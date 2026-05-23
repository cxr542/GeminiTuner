// background.js — GeminiTuner Service Worker (Manifest v3)
importScripts('api-usage.js');

const PRICE_INPUT_PER_1M  = GeminiTunerApiUsage.PRICE_INPUT_PER_1M;
const PRICE_OUTPUT_PER_1M = GeminiTunerApiUsage.PRICE_OUTPUT_PER_1M;
const PAGE_HOOK_ID = 'gemini-tuner-page-hook';

async function registerPageHookScript() {
  if (!chrome.scripting?.registerContentScripts) return;
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [PAGE_HOOK_ID] });
  } catch (_) {}
  try {
    await chrome.scripting.registerContentScripts([{
      id: PAGE_HOOK_ID,
      js: ['page-hook.js'],
      matches: ['https://gemini.google.com/*'],
      runAt: 'document_start',
      world: 'MAIN',
      persistAcrossSessions: true
    }]);
    console.log('[GeminiTuner] page-hook registered via scripting API');
  } catch (e) {
    console.warn('[GeminiTuner] registerContentScripts failed:', e);
  }
}

async function injectPageHookIntoTab(tabId) {
  if (!chrome.scripting?.executeScript) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['page-hook.js'],
      world: 'MAIN',
      injectImmediately: true
    });
    console.log('[GeminiTuner] page-hook injected into tab', tabId);
  } catch (e) {
    // Tab may still be loading — ignore
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[GeminiTuner] Extension installed.', details.reason);
  if (details.reason === 'install') {
    chrome.storage.local.set({
      totalTokens: 0,
      totalCost: 0,
      inputTokens: 0,
      outputTokens: 0,
      monthlyBudget: 5,
      warnPct: 80,
      usdToKrw: 1380,
      apiKey: '',
      apiKeyStatus: 'none',
      apiKeyInputTokens: 0,
      apiKeyOutputTokens: 0,
      apiKeyTotalTokens: 0,
      apiKeyCost: 0,
      apiStudioSpendKrw: null,
      apiStudioSpendUsd: null,
      apiStudioProject: '',
      apiStudioSyncedAt: 0
    });
  }
  registerPageHookScript();
  refreshApiKeyStatus();
});

chrome.runtime.onStartup.addListener(() => {
  registerPageHookScript();
  refreshApiKeyStatus();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url || !tab.url.includes('gemini.google.com')) return;
  if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
    injectPageHookIntoTab(tabId);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === 'INJECT_PAGE_HOOK') {
    if (sender.tab && sender.tab.id) {
      injectPageHookIntoTab(sender.tab.id);
    }
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === 'USAGE_METADATA') {
    handleUsageMetadata(msg.data, sender).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'SETTINGS_UPDATED') {
    refreshApiKeyStatus().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'AISTUDIO_BILLING_SYNC') {
    handleAiStudioBillingSync(msg.data).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'REFRESH_API_KEY') {
    refreshApiKeyStatus().then((result) => sendResponse(result || { ok: true }));
    return true;
  }

  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(null, (data) => sendResponse(data || {}));
    return true;
  }
});

async function refreshApiKeyStatus() {
  const stored = await storageGet(['apiKey']);
  const key = stored.apiKey || '';
  const result = await GeminiTunerApiUsage.validateApiKey(key);
  await chrome.storage.local.set({ apiKeyStatus: key ? result.status : 'none' });
  broadcastStateToGeminiTabs();
  return result;
}

async function handleAiStudioBillingSync(data) {
  if (!data) return;
  const stored = await storageGet(['usdToKrw', 'apiKey']);
  if (!stored.apiKey) return;

  const fx = parseFloat(stored.usdToKrw) > 0 ? parseFloat(stored.usdToKrw) : 1380;
  let spendKrw = data.spendKrw != null ? data.spendKrw : null;
  let spendUsd = data.spendUsd != null ? data.spendUsd : null;

  if (spendKrw != null && spendUsd == null) spendUsd = spendKrw / fx;
  if (spendUsd != null && spendKrw == null) spendKrw = spendUsd * fx;

  await chrome.storage.local.set({
    apiStudioSpendKrw: spendKrw,
    apiStudioSpendUsd: spendUsd,
    apiStudioProject: data.projectName || '',
    apiStudioSyncedAt: data.syncedAt || Date.now()
  });
  broadcastStateToGeminiTabs();
}

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function broadcastStateToGeminiTabs() {
  chrome.storage.local.get(null, (data) => {
    chrome.tabs.query({ url: 'https://gemini.google.com/*' }, (tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        chrome.tabs.sendMessage(tab.id, { type: 'USAGE_UPDATE', state: data }).catch(() => {});
      }
    });
  });
}

async function handleUsageMetadata(data, sender) {
  const {
    promptTokenCount = 0,
    candidatesTokenCount = 0,
    totalTokenCount = 0
  } = data || {};

  const isApiTraffic = data && data.source === 'api';
  const costDelta = GeminiTunerApiUsage.costFromTokens(promptTokenCount, candidatesTokenCount);

  if (isApiTraffic) {
    const stored = await storageGet([
      'apiKeyInputTokens', 'apiKeyOutputTokens', 'apiKeyTotalTokens', 'apiKeyCost',
      'monthlyBudget', 'warnPct', 'usdToKrw', 'apiKey'
    ]);
    if (!stored.apiKey) return;

    const patch = {
      apiKeyInputTokens:  (stored.apiKeyInputTokens  || 0) + promptTokenCount,
      apiKeyOutputTokens: (stored.apiKeyOutputTokens || 0) + candidatesTokenCount,
      apiKeyTotalTokens:  (stored.apiKeyTotalTokens  || 0) + totalTokenCount,
      apiKeyCost:         (stored.apiKeyCost || 0) + costDelta
    };
    await chrome.storage.local.set(patch);
    console.log(`[GeminiTuner] API +${totalTokenCount} tk | api $${patch.apiKeyCost.toFixed(6)}`);
    broadcastStateToGeminiTabs();
    return;
  }

  const stored = await storageGet([
    'inputTokens', 'outputTokens', 'totalTokens', 'totalCost',
    'monthlyBudget', 'warnPct', 'usdToKrw'
  ]);

  const newInput  = (stored.inputTokens  || 0) + promptTokenCount;
  const newOutput = (stored.outputTokens || 0) + candidatesTokenCount;
  const newTotal  = (stored.totalTokens  || 0) + totalTokenCount;

  const newCost   = (stored.totalCost || 0) + costDelta;

  await chrome.storage.local.set({
    inputTokens: newInput,
    outputTokens: newOutput,
    totalTokens: newTotal,
    totalCost: newCost
  });

  console.log(`[GeminiTuner] +${totalTokenCount} tokens | total $${newCost.toFixed(6)}`);

  try {
    chrome.runtime.sendMessage({ type: 'USAGE_UPDATE' });
  } catch (_) {}

  if (sender && sender.tab && sender.tab.id) {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'USAGE_UPDATE',
      state: {
        inputTokens: newInput,
        outputTokens: newOutput,
        totalTokens: newTotal,
        totalCost: newCost,
        monthlyBudget: stored.monthlyBudget || 5,
        warnPct: stored.warnPct || 80,
        usdToKrw: stored.usdToKrw || 1380
      }
    });
  }

  const budget  = parseFloat(stored.monthlyBudget) || 5;
  const warnPct = parseInt(stored.warnPct, 10) || 80;
  const pct     = budget > 0 ? (newCost / budget) * 100 : 0;

  if (pct >= 100) {
    showBudgetAlert('Monthly budget exceeded.');
  } else if (pct >= warnPct) {
    showBudgetAlert(`Budget at ${pct.toFixed(1)}% — approaching limit.`);
  }
}

function showBudgetAlert(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'GeminiTuner FinOps Alert',
    message,
    priority: 2
  });
}
