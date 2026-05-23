// api-usage.js — API key validation + cost helpers (service worker / popup)

var GeminiTunerApiUsage = (function () {
  'use strict';

  const PRICE_INPUT_PER_1M  = 0.075;
  const PRICE_OUTPUT_PER_1M = 0.30;

  function costFromTokens(promptTokenCount, candidatesTokenCount) {
    return (promptTokenCount / 1_000_000) * PRICE_INPUT_PER_1M
         + (candidatesTokenCount / 1_000_000) * PRICE_OUTPUT_PER_1M;
  }

  async function validateApiKey(apiKey) {
    if (!apiKey || apiKey.startsWith('••')) {
      return { status: 'none' };
    }
    try {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key='
        + encodeURIComponent(apiKey);
      const res = await fetch(url);
      if (res.ok) return { status: 'ok' };
      return { status: 'invalid', httpStatus: res.status };
    } catch (err) {
      return { status: 'error', message: String(err) };
    }
  }

  return { costFromTokens, validateApiKey, PRICE_INPUT_PER_1M, PRICE_OUTPUT_PER_1M };
})();
