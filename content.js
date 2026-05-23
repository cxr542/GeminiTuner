// content.js — GeminiTuner Content Script
// Injected into gemini.google.com to:
//   1. Inject the GeminiTuner side panel into the DOM
//   2. Intercept network responses to extract usageMetadata
//   3. Send usage data to background.js via chrome.runtime.sendMessage

(function () {
  'use strict';

  console.log('[GeminiTuner] v1.0.7 content script loading…');

  // ── Guard: run only once ───────────────────────────────────────
  if (window.__geminiTunerLoaded) return;
  window.__geminiTunerLoaded = true;

  // ── Panel ID ───────────────────────────────────────────────────
  const PANEL_ID = 'gemini-tuner-panel';

  // ── State ──────────────────────────────────────────────────────
  let state = {
    totalTokens:   0,
    totalCost:     0,
    monthlyBudget: 5,
    warnPct:       80,
    usdToKrw:      1380,
    apiKeyStatus:  'none',
    apiKeyCost:    0,
    apiStudioSpendUsd: null,
    apiStudioSpendKrw: null,
    apiStudioProject: '',
    apiStudioSyncedAt: 0,
    hookActive:    false,
    domMode:       false
  };

  // ── 1. Inject Side Panel ───────────────────────────────────────
  function injectPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = buildPanelHTML();
    document.body.appendChild(panel);
    initPanelDrag(panel);
    initApiSyncButton();
    console.log('[GeminiTuner] Side panel injected.');
  }

  function initApiSyncButton() {
    const btn = document.getElementById('gt-api-sync-btn');
    if (!btn || btn.dataset.ready) return;
    btn.dataset.ready = '1';
    btn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://aistudio.google.com/spend' });
    });
  }

  function buildPanelHTML() {
    return `
      <div id="gt-header" title="드래그해서 위치 이동">
        <div id="gt-logo-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="gt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stop-color="#38bdf8"/>
                <stop offset="50%"  stop-color="#a855f7"/>
                <stop offset="100%" stop-color="#ec4899"/>
              </linearGradient>
            </defs>
            <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"
                  fill="url(#gt-grad)"/>
          </svg>
          <div>
            <span id="gt-title">GeminiTuner</span>
            <div id="gt-drag-hint">⋮⋮ 드래그해서 이동</div>
          </div>
        </div>
        <span id="gt-badge">감시 중</span>
      </div>

      <div class="gt-hero">
        <div id="gt-char-wrap" class="gt-char-wrap">
          <svg class="gt-char-happy" viewBox="0 0 60 60" aria-hidden="true">
            <defs>
              <linearGradient id="gt-char-grad-h" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                <stop stop-color="#38bdf8"/><stop offset="0.5" stop-color="#a855f7"/><stop offset="1" stop-color="#ec4899"/>
              </linearGradient>
            </defs>
            <path d="M30 8 C30 22 18 30 4 30 C18 30 30 38 30 52 C30 38 42 30 56 30 C42 30 30 22 30 8Z" fill="url(#gt-char-grad-h)"/>
            <path d="M22 30 Q25 26 28 30" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M32 30 Q35 26 38 30" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <svg class="gt-char-warn" viewBox="0 0 60 60" aria-hidden="true">
            <defs>
              <linearGradient id="gt-char-grad-w" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                <stop stop-color="#fbbf24"/><stop offset="1" stop-color="#ea580c"/>
              </linearGradient>
            </defs>
            <path d="M30 8 C30 22 18 30 4 30 C18 30 30 38 30 52 C30 38 42 30 56 30 C42 30 30 22 30 8Z" fill="url(#gt-char-grad-w)"/>
            <ellipse cx="24" cy="30" rx="2.5" ry="1" fill="#fff" opacity="0.8"/>
            <ellipse cx="36" cy="30" rx="2.5" ry="1" fill="#fff" opacity="0.8"/>
          </svg>
        </div>
        <div class="gt-hero-text">
          <div id="gt-char-msg">안녕하세요! 질문을 보내 보세요</div>
          <div id="gt-char-hint">이번 달 예상 비용 0%</div>
        </div>
      </div>

      <div id="gt-warning" class="gt-hidden">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span id="gt-warning-text">Budget warning!</span>
      </div>

      <div class="gt-section-label">누적 토큰 (저장됨)</div>
      <div class="gt-stat-card">
        <div class="gt-big-val" id="gt-tokens">0</div>
        <div class="gt-sub">F5·탭 닫아도 유지 · 글자÷4 추정</div>
      </div>

      <div class="gt-section-label">예상 비용 (저장 누적)</div>
      <div class="gt-stat-card">
        <div class="gt-cost-row">
          <div class="gt-cost-values">
            <span class="gt-big-val" id="gt-cost">$0.0000</span>
            <span class="gt-cost-krw" id="gt-cost-krw">≈ ₩0</span>
          </div>
          <div class="gt-limit-wrap">
            <span class="gt-limit" id="gt-limit">/ $5.00</span>
            <span class="gt-limit-krw" id="gt-limit-krw">≈ ₩6,900</span>
          </div>
        </div>
        <div class="gt-bar-wrap">
          <div class="gt-bar" id="gt-bar" style="width:0%"></div>
        </div>
        <div class="gt-pct" id="gt-pct">월 예산의 0.0%</div>
      </div>

      <div class="gt-section-label">방금 대화 1회</div>
      <div class="gt-stat-card">
        <div class="gt-turn-row">
          <div class="gt-turn-item">
            <div class="gt-turn-label">질문</div>
            <div class="gt-turn-val" id="gt-in">—</div>
          </div>
          <div class="gt-turn-item">
            <div class="gt-turn-label">답변</div>
            <div class="gt-turn-val" id="gt-out">—</div>
          </div>
          <div class="gt-turn-item">
            <div class="gt-turn-label">합계</div>
            <div class="gt-turn-val" id="gt-total">—</div>
          </div>
        </div>
      </div>

      <div id="gt-api-section" class="gt-hidden">
        <div class="gt-section-label">API 키 청구 (AI Studio)</div>
        <div class="gt-stat-card">
          <div class="gt-api-status" id="gt-api-status">API 키 확인 중…</div>
          <div class="gt-cost-values gt-api-cost-block">
            <div class="gt-big-val gt-api-big" id="gt-api-cost-usd">$—</div>
            <div class="gt-cost-krw" id="gt-api-cost-krw">≈ ₩—</div>
          </div>
          <div class="gt-sub" id="gt-api-billing-note">AI Studio 지출 페이지를 열면 실제 청구액이 동기화됩니다.</div>
          <button type="button" id="gt-api-sync-btn" class="gt-link-btn">AI Studio 지출 열기 ↗</button>
        </div>
      </div>

      <div id="gt-footer">
        <span id="gt-meter-status">Meter: starting…</span>
        <span id="gt-version">v?</span>
        <span>Gemini Flash · $0.075 / $0.30 per 1M</span>
      </div>
    `;
  }

  // ── 2. Update Panel UI ─────────────────────────────────────────
  function updatePanel(data) {
    const {
      totalTokens   = 0,
      totalCost     = 0,
      monthlyBudget = 5,
      warnPct       = 80,
      usdToKrw      = 1380,
      lastInput     = null,
      lastOutput    = null,
      lastTotal     = null,
      apiKeyStatus  = 'none',
      apiKeyCost    = 0,
      apiStudioSpendUsd = null,
      apiStudioSpendKrw = null,
      apiStudioProject = '',
      apiStudioSyncedAt = 0,
      apiKey = ''
    } = data;

    const pct    = monthlyBudget > 0 ? Math.min((totalCost / monthlyBudget) * 100, 100) : 0;
    const panel  = document.getElementById(PANEL_ID);
    if (!panel) return;

    setText('gt-tokens', formatTokens(totalTokens));
    const fx = GeminiTunerCurrency
      ? GeminiTunerCurrency.getRate({ usdToKrw })
      : (parseFloat(usdToKrw) > 0 ? parseFloat(usdToKrw) : 1380);

    setText('gt-cost',     '$' + totalCost.toFixed(4));
    setText('gt-cost-krw', GeminiTunerCurrency ? GeminiTunerCurrency.formatKrw(totalCost, fx) : '');
    setText('gt-limit',    '/ $' + parseFloat(monthlyBudget).toFixed(2));
    setText('gt-limit-krw', GeminiTunerCurrency ? GeminiTunerCurrency.formatKrw(monthlyBudget, fx) : '');
    setText('gt-pct',    '월 예산의 ' + pct.toFixed(1) + '%');

    const charWrap = document.getElementById('gt-char-wrap');
    const charMsg  = document.getElementById('gt-char-msg');
    const charHint = document.getElementById('gt-char-hint');
    if (charWrap) {
      charWrap.classList.toggle('gt-mood-warn', pct >= parseFloat(warnPct));
    }
    if (charMsg) {
      if (pct >= 100) charMsg.textContent = '예산 한도에 거의 다 닿았어요!';
      else if (pct >= warnPct) charMsg.textContent = '비용이 많이 쌓이고 있어요';
      else if (totalTokens > 0) charMsg.textContent = '잘 쓰고 있어요!';
      else charMsg.textContent = '안녕하세요! 질문을 보내 보세요';
    }
    if (charHint) {
      charHint.textContent = '이번 달 예상 비용 ' + pct.toFixed(1) + '% · 토큰 ' + formatTokens(totalTokens);
    }

    if (lastInput  !== null) setText('gt-in',    lastInput  + ' tk');
    if (lastOutput !== null) setText('gt-out',   lastOutput + ' tk');
    if (lastTotal  !== null) setText('gt-total', lastTotal  + ' tk');

    const meterEl = document.getElementById('gt-meter-status');
    if (meterEl) {
      if (state.domMode) {
        meterEl.textContent = 'Meter: DOM estimate (chars÷4)';
      } else if (state.hookActive) {
        meterEl.textContent = 'Meter: API (network)';
      } else {
        meterEl.textContent = 'Meter: waiting for chat…';
      }
    }

    // Bar colour
    const bar = document.getElementById('gt-bar');
    if (bar) {
      bar.style.width = pct.toFixed(1) + '%';
      bar.className = 'gt-bar' + (pct >= 100 ? ' red' : pct >= warnPct ? ' yellow' : '');
    }

    // Warning
    const high   = pct >= parseFloat(warnPct);
    const warning = document.getElementById('gt-warning');
    const badge   = document.getElementById('gt-badge');
    if (high) {
      warning && warning.classList.remove('gt-hidden');
      setText('gt-warning-text', 'Cost at ' + pct.toFixed(0) + '% — budget limit approaching!');
      if (badge) { badge.textContent = '⚠ Warn'; badge.classList.add('gt-badge-warn'); }
      panel.classList.add('gt-panel-warn');
    } else {
      warning && warning.classList.add('gt-hidden');
      if (badge) { badge.textContent = '감시 중'; badge.classList.remove('gt-badge-warn'); }
      panel.classList.remove('gt-panel-warn');
    }

    updateApiBillingSection(data, fx);
  }

  function updateApiBillingSection(data, fx) {
    const apiSection = document.getElementById('gt-api-section');
    if (!apiSection) return;

    const hasKey = (data.apiKeyStatus || state.apiKeyStatus) === 'ok'
      || !!(data.apiKey || state.apiKey);
    if (!hasKey) {
      apiSection.classList.add('gt-hidden');
      return;
    }
    apiSection.classList.remove('gt-hidden');

    const status = data.apiKeyStatus || state.apiKeyStatus || 'none';
    const statusEl = document.getElementById('gt-api-status');
    if (statusEl) {
      if (status === 'ok') statusEl.textContent = 'API 키 연결됨 ✓';
      else if (status === 'invalid') statusEl.textContent = 'API 키가 올바르지 않습니다';
      else statusEl.textContent = 'API 키 확인 중…';
    }

    const spendUsd = data.apiStudioSpendUsd != null ? data.apiStudioSpendUsd : state.apiStudioSpendUsd;
    const localCost = (data.apiKeyCost != null ? data.apiKeyCost : state.apiKeyCost) || 0;
    const syncedAt = data.apiStudioSyncedAt || state.apiStudioSyncedAt || 0;
    const project = data.apiStudioProject || state.apiStudioProject || '';

    let displayUsd = spendUsd;
    let note = '';

    if (displayUsd != null && !Number.isNaN(displayUsd)) {
      note = 'AI Studio 실제 지출 (대시보드 기준)';
      if (project) note += ' · ' + project;
      if (syncedAt) {
        note += ' · 동기화 ' + new Date(syncedAt).toLocaleString('ko-KR', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
      }
    } else if (localCost > 0) {
      displayUsd = localCost;
      note = '이 브라우저에서 감지한 Gemini API 호출 추정치';
    } else {
      displayUsd = 0;
      note = '아래 버튼으로 AI Studio 지출 페이지를 열면 실제 청구액이 표시됩니다.';
    }

    setText('gt-api-cost-usd', '$' + Number(displayUsd || 0).toFixed(4));
    setText('gt-api-cost-krw', GeminiTunerCurrency ? GeminiTunerCurrency.formatKrw(displayUsd || 0, fx) : '');
    setText('gt-api-billing-note', note);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function formatTokens(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  // ── 3. Receive usage from MAIN-world page-hook.js ───────────────
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const msg = event.data;
    if (!msg || msg.source !== 'gemini-tuner') return;

    if (msg.type === 'HOOK_READY') {
      state.hookActive = true;
      updatePanel(state);
      console.log('[GeminiTuner] Network hook is active.');
      return;
    }

    if (msg.type === 'USAGE_METADATA') {
      state.hookActive = true;
      state.domMode = false;
      console.log('[GeminiTuner] usageMetadata captured:', msg.data);
      reportUsage(msg.data);
    }
  });

  // ── 3b. DOM meter (always on — works when network hook blocked) ───
  function startDomMeter() {
    if (!window.GeminiTunerDomMeter) {
      console.warn('[GeminiTuner] dom-meter.js not loaded — reload extension at chrome://extensions');
      return;
    }
    window.GeminiTunerDomMeter.start((usage) => {
      state.domMode = true;
      console.log('[GeminiTuner] DOM turn:', usage);
      reportUsage(usage);
    });
  }
  startDomMeter();

  chrome.runtime.sendMessage({ type: 'INJECT_PAGE_HOOK' });

  // ── 4. Report to Background ────────────────────────────────────
  function reportUsage(metadata) {
    chrome.runtime.sendMessage(
      { type: 'USAGE_METADATA', data: metadata },
      (resp) => {
        if (chrome.runtime.lastError) {
          console.warn('[GeminiTuner] Message error:', chrome.runtime.lastError.message);
        }
      }
    );

    // Locally update last-turn stats immediately
    updatePanel({
      ...state,
      lastInput:  metadata.promptTokenCount     || 0,
      lastOutput: metadata.candidatesTokenCount || 0,
      lastTotal:  metadata.totalTokenCount      || 0
    });
  }

  // ── 5. Listen for updates from background ─────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'USAGE_UPDATE' && msg.state) {
      state = { ...state, ...msg.state };
      updatePanel(state);
    }
  });

  // ── 6. Load persisted totals (survives F5 & extension reload) ───
  const STORAGE_KEYS = [
    'totalTokens', 'totalCost', 'inputTokens', 'outputTokens',
    'monthlyBudget', 'warnPct', 'usdToKrw', 'apiKey', 'apiKeyStatus',
    'apiKeyCost', 'apiStudioSpendUsd', 'apiStudioSpendKrw',
    'apiStudioProject', 'apiStudioSyncedAt'
  ];

  function loadStoredState(done) {
    chrome.storage.local.get(STORAGE_KEYS, (data) => {
      if (data && Object.keys(data).length) {
        state = { ...state, ...data };
      }
      if (typeof done === 'function') done();
    });
  }

  function refreshStateFromBackground() {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (data) => {
      if (chrome.runtime.lastError) return;
      if (data) {
        state = { ...state, ...data };
        updatePanel(state);
      }
    });
  }

  // ── 6b. Draggable panel (position saved in storage) ─────────────
  function applyPanelPosition(panel, pos) {
    if (!panel || !pos) return;
    panel.style.top = pos.top + 'px';
    panel.style.left = pos.left + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.transform = 'none';
  }

  function initPanelDrag(panel) {
    const header = document.getElementById('gt-header');
    if (!panel || !header || header.dataset.dragReady) return;
    header.dataset.dragReady = '1';

    chrome.storage.local.get(['panelPosition'], (data) => {
      if (data && data.panelPosition) applyPanelPosition(panel, data.panelPosition);
    });

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      panel.classList.add('gt-dragging');
      header.classList.add('gt-dragging');
      const rect = panel.getBoundingClientRect();
      applyPanelPosition(panel, { left: rect.left, top: rect.top });
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const maxL = window.innerWidth - panel.offsetWidth;
      const maxT = window.innerHeight - panel.offsetHeight;
      const left = Math.max(0, Math.min(maxL, startLeft + e.clientX - startX));
      const top  = Math.max(0, Math.min(maxT, startTop + e.clientY - startY));
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('gt-dragging');
      header.classList.remove('gt-dragging');
      chrome.storage.local.set({
        panelPosition: {
          left: parseInt(panel.style.left, 10) || 0,
          top: parseInt(panel.style.top, 10) || 0
        }
      });
    }

    header.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    header.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
  }

  // ── 7. MutationObserver — keep panel alive through SPA nav ────
  const observer = new MutationObserver(() => {
    if (!document.getElementById(PANEL_ID)) {
      injectPanel();
      updatePanel(state);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ── 8. Initial injection (after storage load so totals don't flash 0) ─
  function afterPanelInject() {
    loadStoredState(() => {
      injectPanel();
      updatePanel(state);
      refreshStateFromBackground();
      try {
        const ver = chrome.runtime.getManifest().version;
        setText('gt-version', 'v' + ver);
        if (ver !== '1.0.7') {
          console.warn('[GeminiTuner] Old version loaded:', ver, '— reinstall from gemini_tuner folder');
        }
      } catch (_) { /* ignore */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', afterPanelInject);
  } else {
    afterPanelInject();
  }

})();
