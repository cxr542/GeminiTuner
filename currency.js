// currency.js — USD ↔ KRW display helpers (content script + popup)

var GeminiTunerCurrency = (function () {
  'use strict';

  const DEFAULT_USD_TO_KRW = 1380;

  function getRate(stored) {
    const r = stored && stored.usdToKrw;
    const n = parseFloat(r);
    return n > 0 ? n : DEFAULT_USD_TO_KRW;
  }

  function formatKrw(usd, rate) {
    const krw = (usd || 0) * rate;
    if (krw < 0.5) return '≈ ₩0';
    if (krw < 10) return '≈ ₩' + krw.toFixed(1);
    return '≈ ₩' + Math.round(krw).toLocaleString('ko-KR');
  }

  return { DEFAULT_USD_TO_KRW, getRate, formatKrw };
})();
