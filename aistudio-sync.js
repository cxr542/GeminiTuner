// aistudio-sync.js — reads Gemini API spend from AI Studio dashboard (user session)

(function () {
  'use strict';

  if (window.__geminiTunerAiStudioSync) return;
  window.__geminiTunerAiStudioSync = true;

  const TAG = '[GeminiTuner:ai-studio]';
  let lastPayload = '';

  function parseKrwToken(raw) {
    if (!raw) return null;
    let s = String(raw).replace(/,/g, '').trim();
    const mult = s.endsWith('K') ? 1000 : s.endsWith('M') ? 1_000_000 : 1;
    if (/[KMB]$/i.test(s)) s = s.slice(0, -1);
    const n = parseFloat(s);
    return Number.isFinite(n) ? n * mult : null;
  }

  function parseUsdToken(raw) {
    if (!raw) return null;
    let s = String(raw).replace(/,/g, '').replace(/^\$/, '').trim();
    const mult = s.endsWith('K') ? 1000 : s.endsWith('M') ? 1_000_000 : 1;
    if (/[KMB]$/i.test(s)) s = s.slice(0, -1);
    const n = parseFloat(s);
    return Number.isFinite(n) ? n * mult : null;
  }

  function scrapeSpend() {
    const text = document.body ? document.body.innerText : '';
    if (!text || !/지출|Spend|Billing|총비용|Total cost/i.test(text)) return null;

    let spendKrw = null;
    let spendUsd = null;

    const krwPatterns = [
      /=\s*총비용\s*₩([\d,.]+[KMB]?)/i,
      /총비용[^\n]*₩([\d,.]+[KMB]?)/i,
      /Total cost[^\n]*₩([\d,.]+[KMB]?)/i,
      /Total cost[^\n]*\$([\d,.]+[KMB]?)/i
    ];
    for (const re of krwPatterns) {
      const m = text.match(re);
      if (m) {
        if (re.source.includes('\\$')) spendUsd = parseUsdToken(m[1]);
        else spendKrw = parseKrwToken(m[1]);
        break;
      }
    }

    if (spendKrw == null) {
      const m = text.match(/비용\s*₩([\d,.]+[KMB]?)/i);
      if (m) spendKrw = parseKrwToken(m[1]);
    }

    if (spendKrw == null && spendUsd == null) return null;

    let projectName = '';
    const projectBtn = document.querySelector('[aria-label="Project"], [aria-label="프로젝트"]');
    if (projectBtn) projectName = (projectBtn.textContent || '').trim();

    return {
      spendKrw,
      spendUsd,
      projectName,
      syncedAt: Date.now(),
      page: location.pathname
    };
  }

  function publish() {
    const data = scrapeSpend();
    if (!data) return;
    const key = JSON.stringify(data);
    if (key === lastPayload) return;
    lastPayload = key;

    chrome.runtime.sendMessage({ type: 'AISTUDIO_BILLING_SYNC', data }, () => {
      if (chrome.runtime.lastError) return;
      console.log(TAG, 'billing synced', data);
    });
  }

  function start() {
    publish();
    const obs = new MutationObserver(() => {
      clearTimeout(window.__gtAiStudioTimer);
      window.__gtAiStudioTimer = setTimeout(publish, 1500);
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
