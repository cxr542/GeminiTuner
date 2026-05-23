// popup.js — GeminiTuner Extension Popup Logic

// ── DOM References ──────────────────────────────────────────────
const valLeft      = document.getElementById('valLeft');
const valRight     = document.getElementById('valRight');
const barLeft      = document.getElementById('barLeft');
const barRight     = document.getElementById('barRight');
const resetLeft    = document.getElementById('resetLeft');
const resetRight   = document.getElementById('resetRight');
const costVal      = document.getElementById('costVal');
const costKrw      = document.getElementById('costKrw');
const costLimit    = document.getElementById('costLimit');
const costLimitKrw = document.getElementById('costLimitKrw');
const costBar      = document.getElementById('costBar');
const tokenCount   = document.getElementById('tokenCount');
const costPct      = document.getElementById('costPct');
const warningBanner = document.getElementById('warningBanner');
const warningText  = document.getElementById('warningText');
const liveBadge    = document.getElementById('liveBadge');

const apiKeyInput  = document.getElementById('apiKeyInput');
const budgetInput  = document.getElementById('budgetInput');
const warnPctInput = document.getElementById('warnPctInput');
const fxRateInput  = document.getElementById('fxRateInput');
const btnSave      = document.getElementById('btnSave');
const saveStatus   = document.getElementById('saveStatus');

// ── Helpers ─────────────────────────────────────────────────────
function setQuotaUI(elVal, elBar, pct) {
  elVal.textContent = pct + '%';
  elBar.style.width = pct + '%';

  // Color thresholds
  if (pct <= 20) {
    elVal.className = 'quota-val red';
    elBar.className = 'quota-bar red';
  } else if (elBar.id === 'barLeft') {
    elVal.className = 'quota-val yellow';
    elBar.className = 'quota-bar yellow';
  } else {
    elVal.className = 'quota-val purple';
    elBar.className = 'quota-bar purple';
  }
}

function setWarning(msg) {
  if (msg) {
    warningBanner.classList.add('visible');
    warningText.textContent = msg;
    liveBadge.textContent   = 'FinOps Warn!';
    liveBadge.style.background = 'rgba(239,68,68,0.15)';
    liveBadge.style.color      = '#f87171';
  } else {
    warningBanner.classList.remove('visible');
    liveBadge.textContent   = 'FinOps On';
    liveBadge.style.background = '';
    liveBadge.style.color      = '';
  }
}

function formatCurrency(n) {
  return '$' + n.toFixed(4);
}

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M tokens used';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K tokens used';
  return n + ' tokens used';
}

// ── Load Stored Data and Render ─────────────────────────────────
function renderFromStorage(data) {
  const {
    quotaShortPct   = null,
    quotaLongPct    = null,
    resetShortTime  = null,
    resetLongTime   = null,
    totalTokens     = 0,
    totalCost       = 0,
    monthlyBudget   = 5,
    warnPct         = 80,
    usdToKrw        = 1380,
    apiKey          = '',
    apiKeyStatus    = 'none',
    apiStudioSpendUsd = null,
    apiStudioSpendKrw = null,
    apiStudioSyncedAt = 0
  } = data;

  const fx = GeminiTunerCurrency.getRate({ usdToKrw });

  // Quota
  if (quotaShortPct !== null) {
    setQuotaUI(valLeft, barLeft, quotaShortPct);
  } else {
    valLeft.textContent = 'N/A';
  }
  if (quotaLongPct !== null) {
    setQuotaUI(valRight, barRight, quotaLongPct);
  } else {
    valRight.textContent = 'N/A';
  }

  resetLeft.textContent  = resetShortTime  ? 'Reset: ' + resetShortTime  : 'No data yet';
  resetRight.textContent = resetLongTime   ? 'Reset: ' + resetLongTime   : 'No data yet';

  // Cost
  const budget = parseFloat(monthlyBudget) || 5;
  const pct    = budget > 0 ? Math.min((totalCost / budget) * 100, 100) : 0;

  costVal.textContent   = formatCurrency(totalCost);
  if (costKrw) costKrw.textContent = GeminiTunerCurrency.formatKrw(totalCost, fx);
  costLimit.textContent = '/ ' + formatCurrency(budget) + ' monthly limit';
  if (costLimitKrw) costLimitKrw.textContent = GeminiTunerCurrency.formatKrw(budget, fx);
  costBar.style.width   = pct.toFixed(1) + '%';
  tokenCount.textContent = formatTokens(totalTokens);
  costPct.textContent    = pct.toFixed(1) + '%';

  // Cost bar colour
  if (pct >= 100) {
    costBar.style.background = '#ef4444';
    costBar.style.boxShadow  = '0 0 8px rgba(239,68,68,0.5)';
  } else if (pct >= warnPct) {
    costBar.style.background = '#fbbf24';
    costBar.style.boxShadow  = '0 0 8px rgba(251,191,36,0.5)';
  } else {
    costBar.style.background = '#a855f7';
    costBar.style.boxShadow  = '0 0 6px rgba(168,85,247,0.4)';
  }

  // Warning
  const lowQuota = (quotaShortPct !== null && quotaShortPct <= 20)
                || (quotaLongPct  !== null && quotaLongPct  <= 20);
  const highCost = pct >= (parseFloat(warnPct) || 80);

  if (lowQuota && highCost) {
    setWarning('Quota critically low AND budget warning!');
  } else if (lowQuota) {
    setWarning('Quota is critically low — check your limits.');
  } else if (highCost) {
    setWarning('Monthly cost is approaching the budget limit!');
  } else {
    setWarning(null);
  }

  // Settings inputs
  apiKeyInput.value  = apiKey   ? '••••••••' + apiKey.slice(-4) : '';
  budgetInput.value  = budget;
  warnPctInput.value = warnPct;
  if (fxRateInput) fxRateInput.value = fx;

  const apiNote = document.getElementById('apiBillingNote');
  if (apiNote) {
    if (!apiKey || apiKeyStatus === 'none') {
      apiNote.textContent = 'API 키를 저장하면 AI Studio 청구액을 패널에 표시할 수 있습니다.';
    } else if (apiKeyStatus === 'invalid') {
      apiNote.textContent = 'API 키가 유효하지 않습니다. AI Studio에서 새 키를 확인하세요.';
    } else if (apiStudioSpendUsd != null) {
      apiNote.textContent = 'AI Studio 지출: '
        + formatCurrency(apiStudioSpendUsd) + ' '
        + GeminiTunerCurrency.formatKrw(apiStudioSpendUsd, fx);
    } else {
      apiNote.textContent = 'aistudio.google.com/spend 을 열면 실제 청구액이 동기화됩니다.';
    }
  }
}

// On popup open, read chrome.storage and render
chrome.storage.local.get(null, (data) => {
  renderFromStorage(data || {});
});

// ── Save Settings ───────────────────────────────────────────────
btnSave.addEventListener('click', () => {
  const rawKey = apiKeyInput.value.trim();
  const budget = parseFloat(budgetInput.value) || 5;
  const warn   = parseInt(warnPctInput.value)  || 80;
  const fx     = parseInt(fxRateInput && fxRateInput.value, 10) || 1380;

  const saveObj = { monthlyBudget: budget, warnPct: warn, usdToKrw: fx };

  // Only overwrite API key if user typed a real (non-masked) value
  if (rawKey && !rawKey.startsWith('••••')) {
    saveObj.apiKey = rawKey;
  }

  chrome.storage.local.set(saveObj, () => {
    saveStatus.textContent = '✓ Saved successfully!';
    saveStatus.style.color = '#34d399';
    setTimeout(() => { saveStatus.textContent = ''; }, 3000);

    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
    chrome.runtime.sendMessage({ type: 'REFRESH_API_KEY' });
  });
});

// ── Listen for live updates pushed from background ───────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'USAGE_UPDATE') {
    chrome.storage.local.get(null, (data) => renderFromStorage(data || {}));
  }
});
