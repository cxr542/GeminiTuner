// dom-meter.js — estimates tokens from visible Gemini chat DOM

(function initDomMeter(global) {
  'use strict';

  const USER_SELECTORS = [
    'user-query',
    '.user-query',
    '[data-test-id="user-query"]'
  ];

  const MODEL_SELECTORS = [
    'model-response',
    '.model-response',
    '[data-test-id="model-response"]'
  ];

  let onTurnCallback = null;
  let stableTimer = null;
  let lastReportedKey = '';

  function estimateTokens(text) {
    const len = (text || '').trim().length;
    if (!len) return 0;
    return Math.max(1, Math.ceil(len / 4));
  }

  function stripA11yLabels(text) {
    return (text || '')
      .replace(/^말씀하신 내용\s*/i, '')
      .replace(/^Gemini의 응답\s*/i, '')
      .replace(/^Your message\s*/i, '')
      .replace(/^Gemini's response\s*/i, '')
      .trim();
  }

  function pickText(root, role) {
    if (!root) return '';
    if (role === 'user') {
      const qt = root.querySelector('.query-text, .query-text-line');
      if (qt) return stripA11yLabels(qt.innerText || qt.textContent);
    }
    const inner = root.querySelector(
      'message-content, .model-response-text, .markdown-main-panel, .markdown, structured-content-container'
    );
    const el = inner || root;
    return stripA11yLabels(el.innerText || el.textContent);
  }

  function getLatestBlock(selectors, role) {
    let latest = null;
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        if (el.closest('.model-thoughts, thoughts-container')) return;
        if (!pickText(el, role)) return;
        latest = el;
      });
    }
    return latest;
  }

  function scanTurn() {
    const userEl = getLatestBlock(USER_SELECTORS, 'user');
    const modelEl = getLatestBlock(MODEL_SELECTORS, 'model');
    if (!modelEl) return;

    const userText = pickText(userEl, 'user');
    const modelText = pickText(modelEl, 'model');
    if (modelText.length < 8) return;

    const key = userText.slice(0, 80) + '|||' + modelText.slice(0, 200) + '|||' + modelText.length;
    if (key === lastReportedKey) return;

    const inputTok = estimateTokens(userText);
    const outputTok = estimateTokens(modelText);
    if (!outputTok) return;

    lastReportedKey = key;

    if (typeof onTurnCallback === 'function') {
      onTurnCallback({
        promptTokenCount: inputTok,
        candidatesTokenCount: outputTok,
        totalTokenCount: inputTok + outputTok,
        source: 'dom'
      });
    }
  }

  function scheduleStableScan() {
    clearTimeout(stableTimer);
    stableTimer = setTimeout(scanTurn, 1200);
  }

  global.GeminiTunerDomMeter = {
    start(callback) {
      onTurnCallback = callback;
      const obs = new MutationObserver(scheduleStableScan);
      const startObs = () => {
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        const u = document.querySelectorAll('user-query').length;
        const m = document.querySelectorAll('model-response').length;
        console.log('[GeminiTuner] DOM meter started (chars÷4). user-query:', u, 'model-response:', m);
      };
      if (document.body) startObs();
      else document.addEventListener('DOMContentLoaded', startObs);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
