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
      background: linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.02)), var(--ds-panel-bg);
      border: 1px solid var(--ds-border);
      box-shadow: 0 18px 48px rgba(0,0,0,0.24);
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
    }

    /* open/close animation states */
    #ds-panel.ds-open {
      display: block;
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

    #ds-messages {
      height: 340px;
      overflow-y: auto;
      padding: 16px 14px 18px;
      background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.02)), var(--ds-panel-bg);
    }

    .ds-row { display: flex; margin-bottom: 10px; }
    .ds-user { justify-content: flex-end; }
    .ds-bot { justify-content: flex-start; }

    .ds-bubble-msg {
      max-width: 78%;
      padding: 11px 13px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
      border: 1px solid rgba(255,255,255,0.04);
      background: var(--ds-bot-bubble);
      color: var(--ds-bot-text);
      white-space: pre-wrap;

      /* message animation baseline */
      opacity: 0;
      transform: translateX(-10px);
      will-change: transform, opacity;
      box-shadow: 0 14px 34px rgba(0,0,0,0.16);
      animation: ds-in-left 200ms ease forwards;
    }

    .ds-user .ds-bubble-msg {
      background: var(--ds-user-bubble);
      color: var(--ds-user-text);
      border-color: var(--ds-user-bubble);

      transform: translateX(10px);
      animation: ds-in-right 200ms ease forwards;
      box-shadow: 0 14px 34px rgba(0,0,0,0.2);
    }

    @keyframes ds-in-left {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes ds-in-right {
      from { opacity: 0; transform: translateX(10px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ✅ UI/UX: add more bottom padding in the footer */
    #ds-footer {
      padding: 14px;
      padding-bottom: 20px;
      border-top: 1px solid var(--ds-border);
      background: rgba(255,255,255,0.7);
      display: flex;
      gap: 10px;
      align-items: center;
      backdrop-filter: blur(6px);
    }

    #ds-input {
      flex: 1;
      border: 1px solid var(--ds-border);
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 13px;
      outline: none;
      background: #fff;
      box-shadow: inset 0 1px 2px rgba(15,23,42,0.08);
    }

    #ds-send {
      border: 1px solid var(--ds-primary);
      background: var(--ds-primary);
      color: white;
      border-radius: 12px;
      padding: 10px 12px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
    }

    #ds-send:disabled { opacity: 0.6; cursor: not-allowed; }

    .ds-typing {
      font-style: italic;
      opacity: 0.8;
      letter-spacing: 0.01em;
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

  // ===== FIX: robust open/close state (prevents "can't open again") =====
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

    // keep animation origin correct
    panel.style.transformOrigin = "bottom " + side;
  }

  function applyConfig(settings) {
    var s = normalizeSettings(settings);

    // Position
    setSide(s.position);

    // CSS vars
    document.documentElement.style.setProperty("--ds-primary", s.bubbleColor);
    document.documentElement.style.setProperty("--ds-header-bg", s.chatHeaderBg);
    document.documentElement.style.setProperty("--ds-header-text", s.chatHeaderText);
    document.documentElement.style.setProperty("--ds-panel-bg", s.chatPanelBg);

    document.documentElement.style.setProperty("--ds-user-bubble", s.chatUserBubble);
    document.documentElement.style.setProperty("--ds-user-text", s.chatUserText);
    document.documentElement.style.setProperty("--ds-bot-bubble", s.chatBotBubble);
    document.documentElement.style.setProperty("--ds-bot-text", s.chatBotText);

    // Bubble shape
    bubble.classList.remove("ds-circle", "ds-rounded");
    bubble.classList.add(s.bubbleShape === "circle" ? "ds-circle" : "ds-rounded");

    var iconEl = bubble.querySelector('[data-role="icon"]');
    var textEl = bubble.querySelector('[data-role="text"]');

    // Rounded: plain centred text only, NO icon/image
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
      // Circle: icon only, centred; image optional
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
      if (iconEl) {
        iconEl.innerHTML = "";
        iconEl.textContent = "✦";
      }
    }

    // Panel title
    var titleEl = panel.querySelector('[data-role="title"]');
    if (titleEl) titleEl.textContent = s.chatTitle || DEFAULTS.chatTitle;
  }

  function openPanel() {
    if (isOpen || isClosing) return;

    // cancel pending close
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    isOpen = true;

    // backdrop used only for layering, not click closing
    backdrop.style.display = "block";

    // ensure panel is visible then animate via class
    panel.style.display = "block";
    panel.classList.remove("ds-closing");
    // force reflow so transition consistently triggers
    panel.offsetHeight; // eslint-disable-line no-unused-expressions
    panel.classList.add("ds-open");

    if (inputEl) inputEl.focus();
  }

  function closePanel() {
    if (!isOpen || isClosing) return;
    isClosing = true;

    // start closing animation
    panel.classList.remove("ds-open");
    panel.classList.add("ds-closing");

    // hide backdrop (visual only)
    backdrop.style.display = "none";

    // after animation, fully hide panel
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

  // ===== Sending control: one message at a time, disable while "typing" =====
  var isSending = false;

  function setTypingState(on) {
    isSending = !!on;
    if (inputEl) inputEl.disabled = isSending;
    if (sendBtn) sendBtn.disabled = isSending || inputEl.value.trim().length === 0;
  }

  function addMessage(role, text, opts) {
    var row = document.createElement("div");
    row.className = "ds-row " + (role === "user" ? "ds-user" : "ds-bot");

    var bubbleMsg = document.createElement("div");
    bubbleMsg.className = "ds-bubble-msg";
    if (opts && opts.typing) bubbleMsg.classList.add("ds-typing");
    bubbleMsg.textContent = text;

    row.appendChild(bubbleMsg);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return row;
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

    // delay the typing bubble for a human-like pause
    if (typingTimer) clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      typingRow = addMessage("bot", "Typing...", { typing: true });
    }, 1500);
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
        if (typingTimer) {
          clearTimeout(typingTimer);
          typingTimer = null;
        }
        if (typingRow && typingRow.parentNode) {
          typingRow.parentNode.removeChild(typingRow);
        }
        typingRow = null;

        window.__dailysodSessionId = data.sessionId || window.__dailysodSessionId;
        addMessage("bot", data.reply || "No reply returned.");
      })
      .catch(function (err) {
        if (typingTimer) {
          clearTimeout(typingTimer);
          typingTimer = null;
        }
        if (typingRow && typingRow.parentNode) {
          typingRow.parentNode.removeChild(typingRow);
        }
        typingRow = null;
        addMessage("bot", "Sorry - something went wrong.\n\n" + String(err));
      })
      .finally(function () {
        setTypingState(false);
        updateSendState();
        if (inputEl && isOpen) inputEl.focus();
      });
  }

  // Initial greeting
  addMessage("bot", "Hi There! How can I help you?");

  // ===== Events =====

  // bubble click animation + toggle
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

  // ✅ KEEP PANEL OPEN WHEN CLICKING OUTSIDE:
  // - stopPropagation inside panel is fine
  // - backdrop MUST NOT close (removed close handler)
  panel.addEventListener("click", function (e) {
    if (e && e.stopPropagation) e.stopPropagation();
  });

  // ❌ REMOVED: backdrop click-to-close
  // backdrop.addEventListener("click", function () {
  //   closePanel();
  // });

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
