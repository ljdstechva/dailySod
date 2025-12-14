// public/widget.js (or wherever you serve widget.js from)
(function () {
  if (window.__dailysodWidgetLoaded) return;
  window.__dailysodWidgetLoaded = true;

  var script = document.currentScript;
  var clientId = script && script.getAttribute("data-client-id");

  if (!clientId) {
    console.warn("[DailySod widget] missing data-client-id");
    return;
  }

  // Defaults (must match Install page defaults)
  var DEFAULTS = {
    position: "right", // left | right
    bubbleShape: "rounded", // rounded | circle
    bubbleColor: "#0f172a",
    bubbleText: "Ask me anything",
    bubbleImage: null,

    chatTitle: "DailySod Chat",
    chatHeaderBg: "#ffffff",
    chatHeaderText: "#0f172a",
    chatPanelBg: "#f8fafc",

    chatUserBubble: "#0f172a",
    chatUserText: "#ffffff",
    chatBotBubble: "#ffffff",
    chatBotText: "#0f172a",
  };

  function safe(v, fallback) {
    return v === undefined || v === null || v === "" ? fallback : v;
  }

  function normalizeSettings(s) {
    s = s || {};
    return {
      position: safe(s.position, DEFAULTS.position),
      bubbleShape: safe(s.bubbleShape, DEFAULTS.bubbleShape),
      bubbleColor: safe(s.bubbleColor, DEFAULTS.bubbleColor),
      bubbleText: safe(s.bubbleText, DEFAULTS.bubbleText),
      bubbleImage: safe(s.bubbleImage, DEFAULTS.bubbleImage),

      chatTitle: safe(s.chatTitle, DEFAULTS.chatTitle),
      chatHeaderBg: safe(s.chatHeaderBg, DEFAULTS.chatHeaderBg),
      chatHeaderText: safe(s.chatHeaderText, DEFAULTS.chatHeaderText),
      chatPanelBg: safe(s.chatPanelBg, DEFAULTS.chatPanelBg),

      chatUserBubble: safe(s.chatUserBubble, DEFAULTS.chatUserBubble),
      chatUserText: safe(s.chatUserText, DEFAULTS.chatUserText),
      chatBotBubble: safe(s.chatBotBubble, DEFAULTS.chatBotBubble),
      chatBotText: safe(s.chatBotText, DEFAULTS.chatBotText),
    };
  }

  // One style tag only, update via CSS variables
  var style = document.createElement("style");
  style.id = "ds-style";
  style.innerHTML = `
    :root {
      --ds-pos: right;
      --ds-primary: ${DEFAULTS.bubbleColor};
      --ds-header-bg: ${DEFAULTS.chatHeaderBg};
      --ds-header-text: ${DEFAULTS.chatHeaderText};
      --ds-panel-bg: ${DEFAULTS.chatPanelBg};

      --ds-user-bubble: ${DEFAULTS.chatUserBubble};
      --ds-user-text: ${DEFAULTS.chatUserText};
      --ds-bot-bubble: ${DEFAULTS.chatBotBubble};
      --ds-bot-text: ${DEFAULTS.chatBotText};

      --ds-border: #e2e8f0;
    }

    /* ===== Bubble ===== */
    #ds-bubble {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      user-select: none;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      cursor: pointer;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      background: var(--ds-primary);
      color: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.18);

      transition: transform 120ms ease, opacity 120ms ease;
      will-change: transform;
    }

    /* click animation */
    #ds-bubble.ds-press {
      transform: scale(0.96);
    }

    #ds-bubble:active { transform: scale(0.98); }

    /* Circle vs rounded */
    #ds-bubble.ds-circle {
      width: 58px;
      height: 58px;
      border-radius: 999px;
      padding: 0;
    }

    /* Rounded must be plain centred text only */
    #ds-bubble.ds-rounded {
      height: 44px;
      min-width: 170px;
      border-radius: 14px;
      padding: 0 14px;
      justify-content: center;
    }

    /* Bubble inner icon container (centred always) */
    #ds-bubble .ds-icon {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      background: rgba(255,255,255,0.25);
      border: 2px solid rgba(255,255,255,0.6);
      overflow: hidden;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
    }

    #ds-bubble .ds-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    #ds-bubble .ds-text {
      font-size: 14px;
      font-weight: 700;
      white-space: nowrap;
      line-height: 1;
      text-align: center;
    }

    /* ===== Panel ===== */
    #ds-panel {
      position: fixed;
      bottom: 88px;
      right: 20px;
      width: 340px;
      height: 460px;
      border-radius: 16px;
      background: #fff;
      border: 1px solid var(--ds-border);
      box-shadow: 0 10px 30px rgba(0,0,0,0.18);
      z-index: 999999;
      overflow: hidden;
      display: none;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;

      transform-origin: bottom right;

      /* animation baseline */
      opacity: 0;
      transform: translateY(10px) scale(0.98);
      pointer-events: none;

      will-change: transform, opacity;

      /* ✅ IMPORTANT: allow messages + footer to size correctly */
      flex-direction: column;
    }

    /* open/close animation states */
    #ds-panel.ds-open {
      display: flex; /* ✅ was block */
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
      transition: transform 160ms ease, opacity 160ms ease;
    }

    #ds-panel.ds-closing {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
      pointer-events: none;
      transition: transform 140ms ease, opacity 140ms ease;
    }

    #ds-header {
      padding: 12px 14px;
      background: var(--ds-header-bg);
      border-bottom: 1px solid var(--ds-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--ds-header-text);
      flex: 0 0 auto;
    }

    #ds-header-title {
      font-size: 14px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    #ds-close {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      border: 1px solid var(--ds-border);
      background: var(--ds-header-bg);
      cursor: pointer;
      color: var(--ds-header-text);
      font-size: 16px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      transition: background 120ms ease, transform 120ms ease;
    }

    #ds-close:hover {
      background: rgba(0,0,0,0.05);
      transform: translateY(-1px);
    }

    /* ✅ Make messages area flexible so footer padding looks right */
    #ds-messages {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 12px;
      background: var(--ds-panel-bg);
    }

    .ds-row { display: flex; margin-bottom: 10px; }
    .ds-user { justify-content: flex-end; }
    .ds-bot { justify-content: flex-start; }

    .ds-bubble-msg {
      max-width: 78%;
      padding: 10px 12px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.35;
      border: 1px solid var(--ds-border);
      background: var(--ds-bot-bubble);
      color: var(--ds-bot-text);
      white-space: pre-wrap;

      opacity: 0;
      transform: translateX(-10px);
      will-change: transform, opacity;
      animation: ds-in-left 180ms ease forwards;
    }

    .ds-user .ds-bubble-msg {
      background: var(--ds-user-bubble);
      color: var(--ds-user-text);
      border-color: var(--ds-user-bubble);

      transform: translateX(10px);
      animation: ds-in-right 180ms ease forwards;
    }

    @keyframes ds-in-left {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes ds-in-right {
      from { opacity: 0; transform: translateX(10px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ✅ Composer UI like your 2nd reference (pill + padding) */
    #ds-footer {
      flex: 0 0 auto;
      background: #fff;
      border-top: 1px solid var(--ds-border);

      /* outer breathing room */
      padding: 12px 12px calc(14px + env(safe-area-inset-bottom, 0px));

      /* pill container */
      display: flex;
      align-items: center;
      gap: 10px;

      /* keeps the input area visually separated */
      box-sizing: border-box;
    }

    #ds-input {
      flex: 1;
      border: 1px solid var(--ds-border);
      border-radius: 999px;
      padding: 12px 14px;
      font-size: 13px;
      outline: none;
      background: #fff;
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
    }

    #ds-input:focus {
      border-color: rgba(15, 23, 42, 0.25);
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.10);
    }

    #ds-send {
      border: 1px solid var(--ds-primary);
      background: var(--ds-primary);
      color: white;
      border-radius: 999px;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      min-width: 74px;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
    }

    #ds-send:active {
      transform: scale(0.98);
    }

    #ds-send:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* Backdrop exists only for layering, NOT for closing */
    #ds-backdrop {
      position: fixed;
      inset: 0;
      background: transparent;
      z-index: 999998;
      display: none;

      /* ✅ IMPORTANT: do not capture clicks */
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Backdrop (visual only, no click-to-close)
  var backdrop = document.createElement("div");
  backdrop.id = "ds-backdrop";
  document.body.appendChild(backdrop);

  // Bubble
  var bubble = document.createElement("button");
  bubble.type = "button";
  bubble.id = "ds-bubble";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.innerHTML = `
    <span class="ds-icon" data-role="icon"></span>
    <span class="ds-text" data-role="text"></span>
  `;
  document.body.appendChild(bubble);

  // Panel
  var panel = document.createElement("div");
  panel.id = "ds-panel";
  panel.innerHTML = `
    <div id="ds-header">
      <div id="ds-header-title">
        <span data-role="title">${DEFAULTS.chatTitle}</span>
      </div>
      <button id="ds-close" aria-label="Close">×</button>
    </div>

    <div id="ds-messages"></div>

    <div id="ds-footer">
      <input id="ds-input" placeholder="Type a message..." />
      <button id="ds-send" disabled>Send</button>
    </div>
  `;
  document.body.appendChild(panel);

  var closeBtn = panel.querySelector("#ds-close");
  var messagesEl = panel.querySelector("#ds-messages");
  var inputEl = panel.querySelector("#ds-input");
  var sendBtn = panel.querySelector("#ds-send");

  // Ensure close button glyph is consistent
  if (closeBtn) {
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close chat");
  }

  // ===== FIX: robust open/close state =====
  var isOpen = false;
  var isClosing = false;
  var closeTimer = null;

  function setSide(position) {
    var side = position === "left" ? "left" : "right";
    bubble.style.left = "";
    bubble.style.right = "";
    panel.style.left = "";
    panel.style.right = "";

    bubble.style[side] = "20px";
    panel.style[side] = "20px";

    panel.style.transformOrigin = "bottom " + side;
  }

  function applyConfig(settings) {
    var s = normalizeSettings(settings);

    setSide(s.position);

    document.documentElement.style.setProperty("--ds-primary", s.bubbleColor);
    document.documentElement.style.setProperty("--ds-header-bg", s.chatHeaderBg);
    document.documentElement.style.setProperty("--ds-header-text", s.chatHeaderText);
    document.documentElement.style.setProperty("--ds-panel-bg", s.chatPanelBg);

    document.documentElement.style.setProperty("--ds-user-bubble", s.chatUserBubble);
    document.documentElement.style.setProperty("--ds-user-text", s.chatUserText);
    document.documentElement.style.setProperty("--ds-bot-bubble", s.chatBotBubble);
    document.documentElement.style.setProperty("--ds-bot-text", s.chatBotText);

    bubble.classList.remove("ds-circle", "ds-rounded");
    bubble.classList.add(s.bubbleShape === "circle" ? "ds-circle" : "ds-rounded");

    var iconEl = bubble.querySelector('[data-role="icon"]');
    var textEl = bubble.querySelector('[data-role="text"]');

    if (s.bubbleShape === "rounded") {
      if (iconEl) {
        iconEl.innerHTML = "";
        iconEl.style.display = "none";
      }
      if (textEl) {
        textEl.textContent = s.bubbleText || DEFAULTS.bubbleText;
        textEl.style.display = "inline";
      }
    } else {
      if (iconEl) {
        iconEl.style.display = "inline-flex";
        iconEl.innerHTML = "";

        if (s.bubbleImage) {
          var img = document.createElement("img");
          img.src = s.bubbleImage;
          img.alt = "chat icon";
          iconEl.appendChild(img);
        } else {
          iconEl.textContent = "💬";
        }
      }
      if (textEl) {
        textEl.textContent = "";
        textEl.style.display = "none";
      }
    }

    var titleEl = panel.querySelector('[data-role="title"]');
    if (titleEl) titleEl.textContent = s.chatTitle || DEFAULTS.chatTitle;
  }

  function openPanel() {
    if (isOpen || isClosing) return;

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    isOpen = true;

    backdrop.style.display = "block";

    panel.style.display = "block";
    panel.classList.remove("ds-closing");
    panel.offsetHeight; // force reflow
    panel.classList.add("ds-open");

    if (inputEl) inputEl.focus();
  }

  function closePanel() {
    if (!isOpen || isClosing) return;
    isClosing = true;

    panel.classList.remove("ds-open");
    panel.classList.add("ds-closing");

    backdrop.style.display = "none";

    closeTimer = setTimeout(function () {
      panel.style.display = "none";
      panel.classList.remove("ds-closing");
      isOpen = false;
      isClosing = false;
      closeTimer = null;
    }, 160);
  }

  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

  // ===== Sending control =====
  var isSending = false;

  function setTypingState(on) {
    isSending = !!on;
    if (inputEl) inputEl.disabled = isSending;
    if (sendBtn) sendBtn.disabled = isSending || inputEl.value.trim().length === 0;
  }

  function addMessage(role, text) {
    var row = document.createElement("div");
    row.className = "ds-row " + (role === "user" ? "ds-user" : "ds-bot");

    var bubbleMsg = document.createElement("div");
    bubbleMsg.className = "ds-bubble-msg";
    bubbleMsg.textContent = text;

    row.appendChild(bubbleMsg);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function updateSendState() {
    if (!inputEl || !sendBtn) return;
    var val = inputEl.value.trim();
    sendBtn.disabled = isSending || val.length === 0;
  }

  function sendMessage() {
    if (isSending) return;

    var text = inputEl.value.trim();
    if (!text) return;

    addMessage("user", text);
    inputEl.value = "";
    updateSendState();

    addMessage("bot", "Typing...");
    setTypingState(true);

    var sessionId = window.__dailysodSessionId || null;

    fetch(new URL("/api/chat", script.src).toString(), {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: clientId,
        message: text,
        sessionId: sessionId,
        pageUrl: window.location.href,
      }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var last = messagesEl.lastElementChild;
        if (last && last.className.indexOf("ds-bot") !== -1) {
          var b = last.querySelector(".ds-bubble-msg");
          if (b && b.textContent === "Typing...") messagesEl.removeChild(last);
        }

        window.__dailysodSessionId = data.sessionId || window.__dailysodSessionId;
        addMessage("bot", data.reply || "No reply returned.");
      })
      .catch(function (err) {
        var last = messagesEl.lastElementChild;
        if (last && last.className.indexOf("ds-bot") !== -1) {
          var b = last.querySelector(".ds-bubble-msg");
          if (b && b.textContent === "Typing...") messagesEl.removeChild(last);
        }
        addMessage("bot", "Sorry — something went wrong.\n\n" + String(err));
      })
      .finally(function () {
        setTypingState(false);
        updateSendState();
        if (inputEl && isOpen) inputEl.focus();
      });
  }

  // Initial greeting
  addMessage("bot", "Hi! I’m the DailySod widget.\n\nAsk me anything.");

  // ===== Events =====
  bubble.addEventListener("pointerdown", function () {
    bubble.classList.add("ds-press");
  });
  bubble.addEventListener("pointerup", function () {
    bubble.classList.remove("ds-press");
  });
  bubble.addEventListener("pointercancel", function () {
    bubble.classList.remove("ds-press");
  });

  bubble.addEventListener("click", function (e) {
    if (e && e.stopPropagation) e.stopPropagation();
    togglePanel();
  });

  closeBtn.addEventListener("click", function (e) {
    if (e && e.stopPropagation) e.stopPropagation();
    closePanel();
  });

  // ✅ KEEP PANEL OPEN WHEN CLICKING OUTSIDE
  panel.addEventListener("click", function (e) {
    if (e && e.stopPropagation) e.stopPropagation();
  });

  inputEl.addEventListener("input", updateSendState);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });
  sendBtn.addEventListener("click", sendMessage);

  // Fetch config (and keep it updated)
  var lastConfigHash = null;

  function hashSettings(obj) {
    try {
      return JSON.stringify(obj || {});
    } catch (e) {
      return String(Date.now());
    }
  }

  function fetchAndApply() {
    return fetch(
      new URL("/api/widget/config?clientId=" + encodeURIComponent(clientId), script.src).toString(),
      { method: "GET", mode: "cors" }
    )
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        var settings = normalizeSettings((json && json.settings) || {});
        var nextHash = hashSettings(settings);

        if (nextHash !== lastConfigHash) {
          lastConfigHash = nextHash;
          applyConfig(settings);
        }
      })
      .catch(function (err) {
        console.warn("[DailySod widget] config fetch failed:", err);
        if (!lastConfigHash) {
          lastConfigHash = hashSettings(DEFAULTS);
          applyConfig(DEFAULTS);
        }
      });
  }

  fetchAndApply();
  setInterval(fetchAndApply, 8000);

  console.log("[DailySod widget] loaded", { clientId: clientId });
})();
