// page-hook.js — MAIN world @ document_start
(function () {
  'use strict';

  if (window.__geminiTunerPageHook) return;
  window.__geminiTunerPageHook = true;

  const TAG = '[GeminiTuner:hook]';

  function signalReady() {
    window.postMessage({ source: 'gemini-tuner', type: 'HOOK_READY' }, '*');
  }

  let inspectUrl = '';

  function postUsage(metadata, url) {
    if (!metadata) return;
    const prompt = metadata.promptTokenCount || 0;
    const output = metadata.candidatesTokenCount || 0;
    const total  = metadata.totalTokenCount || (prompt + output);
    if (!total && !prompt && !output) return;

    const srcUrl = url || inspectUrl || '';
    window.postMessage({
      source: 'gemini-tuner',
      type: 'USAGE_METADATA',
      data: {
        promptTokenCount: prompt,
        candidatesTokenCount: output,
        totalTokenCount: total,
        source: /generativelanguage\.googleapis\.com/i.test(srcUrl) ? 'api' : 'web'
      }
    }, '*');
    console.log(TAG, 'tokens captured', { prompt, output, total, source: srcUrl.includes('generativelanguage') ? 'api' : 'web' });
  }

  function stripGoogleJsonPrefix(text) {
    let t = (text || '').trim();
    if (t.startsWith(")]}'")) {
      const nl = t.indexOf('\n');
      t = nl >= 0 ? t.slice(nl + 1).trim() : t.replace(/^\)\]\}'/, '').trim();
    }
    return t;
  }

  function extractByRegex(text) {
    if (!text || text.length < 16) return null;
    const p = text.match(/"promptTokenCount"\s*:\s*(\d+)/);
    const c = text.match(/"candidatesTokenCount"\s*:\s*(\d+)/);
    const t = text.match(/"totalTokenCount"\s*:\s*(\d+)/);
    if (!p && !c && !t) return null;
    const prompt = p ? parseInt(p[1], 10) : 0;
    const output = c ? parseInt(c[1], 10) : 0;
    const total  = t ? parseInt(t[1], 10) : prompt + output;
    return { promptTokenCount: prompt, candidatesTokenCount: output, totalTokenCount: total };
  }

  function findUsageMetadata(node, depth) {
    if (!node || depth > 14 || typeof node !== 'object') return null;

    if (node.usageMetadata && typeof node.usageMetadata === 'object') {
      return node.usageMetadata;
    }
    if (typeof node.promptTokenCount === 'number' || typeof node.candidatesTokenCount === 'number') {
      return {
        promptTokenCount: node.promptTokenCount || 0,
        candidatesTokenCount: node.candidatesTokenCount || 0,
        totalTokenCount: node.totalTokenCount || 0
      };
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = findUsageMetadata(item, depth + 1);
        if (found) return found;
      }
      return null;
    }

    for (const key of Object.keys(node)) {
      const found = findUsageMetadata(node[key], depth + 1);
      if (found) return found;
    }
    return null;
  }

  function parseBodyText(text) {
    const raw = stripGoogleJsonPrefix(text);
    if (!raw) return;

    const regexMeta = extractByRegex(raw);
    if (regexMeta) {
      postUsage(regexMeta);
      return;
    }

    if (!/usageMetadata|promptTokenCount|totalTokenCount|tokenCount/i.test(raw)) {
      return;
    }

    const chunks = raw.split('\n').map(l => l.trim()).filter(Boolean);
    for (let line of chunks.length ? chunks : [raw]) {
      if (line.startsWith('data:')) line = line.slice(5).trim();
      if (line[0] !== '{' && line[0] !== '[') continue;
      try {
        const meta = findUsageMetadata(JSON.parse(line), 0);
        if (meta) postUsage(meta);
      } catch (_) {}
    }

    try {
      const meta = findUsageMetadata(JSON.parse(raw), 0);
      if (meta) postUsage(meta);
    } catch (_) {}
  }

  function isNoiseUrl(url) {
    return /analytics|doubleclick|gtm|googleadservices|fonts|\.woff|\.css|\.js\?|gstatic.*\.js/i.test(String(url));
  }

  function shouldInspectUrl(url) {
    const u = String(url || '');
    if (!u || isNoiseUrl(u)) return false;
    return (
      u.includes('batchexecute') ||
      u.includes('StreamGenerate') ||
      u.includes('BardFrontend') ||
      u.includes('generateContent') ||
      u.includes('streamGenerateContent') ||
      u.includes('generativelanguage.googleapis.com') ||
      (u.includes('gemini.google.com') && u.includes('/_/'))
    );
  }

  function shouldInspectRequest(url, method) {
    if (shouldInspectUrl(url)) return true;
    if (method === 'POST' && String(url).includes('gemini.google.com') && !isNoiseUrl(url)) {
      return true;
    }
    return false;
  }

  async function inspectResponse(url, response) {
    try {
      inspectUrl = url;
      const clone = response.clone();
      const text  = await clone.text();
      if (text && text.length > 20) parseBodyText(text);
    } catch (e) {
      console.warn(TAG, 'inspectResponse', url, e);
    }
  }

  let nativeFetch = window.fetch.bind(window);
  let hookedFetch = async function (...args) {
    const response = await nativeFetch(...args);
    try {
      const req = args[0];
      const init = args[1] || {};
      const url = typeof req === 'string' ? req : (req && req.url) || '';
      const method = (init.method || (req && req.method) || 'GET').toUpperCase();
      if (shouldInspectRequest(url, method)) inspectResponse(url, response);
    } catch (_) {}
    return response;
  };

  function installFetchHook() {
    if (window.fetch === hookedFetch) return;
    nativeFetch = window.fetch.bind(window);
    window.fetch = hookedFetch;
  }

  const XHR = XMLHttpRequest.prototype;
  const nativeOpen = XHR.open;
  const nativeSend = XHR.send;

  function installXhrHook() {
    if (XHR.open.__gtHooked) return;

    XHR.open = function (method, url, ...rest) {
      this.__gtMethod = String(method || 'GET').toUpperCase();
      this.__gtUrl = url;
      return nativeOpen.call(this, method, url, ...rest);
    };
    XHR.open.__gtHooked = true;

    XHR.send = function (...args) {
      this.addEventListener('load', function () {
        try {
          const url = this.__gtUrl || '';
          const method = this.__gtMethod || 'GET';
          const body = this.responseText || '';
          if (!shouldInspectRequest(url, method) && !/tokenCount|usageMetadata/i.test(body)) {
            return;
          }
          inspectUrl = url;
          parseBodyText(body);
        } catch (_) {}
      });
      return nativeSend.apply(this, args);
    };
  }

  installFetchHook();
  installXhrHook();

  // Re-apply if Gemini overwrites fetch later
  setInterval(() => {
    installFetchHook();
    installXhrHook();
  }, 2000);

  console.log(TAG, 'installed (fetch + XHR) — MAIN world');
  signalReady();
})();
