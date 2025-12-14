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

      /* Anim timings */
      --ds-ease: cubic-bezier(.2,.8,.2,1);
      --ds-fast: 140ms;
      --ds-med: 220ms;
    }

    /* Bubble */
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

      transition: transform var(--ds-fast) var(--ds-ease), opacity var(--ds-fast) var(--ds-ease);
      transform: translateZ(0);
    }

    /* Click micro-animation */
    #ds-bubble.ds-press {
      transform: translateZ(0) scale(0.96);
    }

    /* Circle vs rounded */
    #ds-bubble.ds-circle {
      width: 58px;
      height: 58px;
      border-radius: 999px;
      padding: 0;
    }

    /* Rounded: plain centred text only */
    #ds-bubble.ds-rounded {
      height: 44px;
      min-width: 170px;
      border-radius: 14px;
      padding: 0 14px;
      justify-content: center;
    }

    /* Bubble icon container (circle only) */
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

    /* Backdrop */
    #ds-backdrop {
      position: fixed;
      inset: 0;
      background: transparent;
      z-index: 999998;
      display: none;
    }

    /* Panel (animated open/close via classes) */
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
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }

    #ds-panel.ds-open {
      display: block;
      animation: dsPanelIn var(--ds-med) var(--ds-ease) forwards;
    }

    #ds-panel.ds-closing {
      display: block;
      animation: dsPanelOut 180ms var(--ds-ease) forwards;
    }

    @keyframes dsPanelIn {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes dsPanelOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(10px) scale(0.985); }
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
    }

    #ds-messages {
      height: 340px;
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
      transform: translateZ(0);
    }

    .ds-user .ds-bubble-msg {
      background: var(--ds-user-bubble);
      color: var(--ds-user-text);
      border-color: var(--ds-user-bubble);
    }

    /* Message entrance animations */
    .ds-row.ds-animate-in.ds-user .ds-bubble-msg {
      animation: dsMsgInRight 180ms var(--ds-ease) both;
    }
    .ds-row.ds-animate-in.ds-bot .ds-bubble-msg {
      animation: dsMsgInLeft 180ms var(--ds-ease) both;
    }

    @keyframes dsMsgInRight {
      from { opacity: 0; transform: translateX(14px) scale(0.98); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes dsMsgInLeft {
      from { opacity: 0; transform: translateX(-14px) scale(0.98); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    #ds-footer {
      padding: 10px;
      border-top: 1px solid var(--ds-border);
      background: #fff;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    #ds-input {
      flex: 1;
      border: 1px solid var(--ds-border);
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 13px;
      outline: none;
      background: #fff;
      transition: opacity var(--ds-fast) var(--ds-ease);
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
      transition: opacity var(--ds-fast) var(--ds-ease), transform var(--ds-fast) var(--ds-ease);
    }

    #ds-send:active { transform: scale(0.98); }
    #ds-send:disabled { opacity: 0.55; cursor: not-allowed; }

    /* Typing state */
    #ds-input:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      #ds-panel.ds-open, #ds-panel.ds-closing,
      .ds-row.ds-animate-in.ds-user .ds-bubble-msg,
      .ds-row.ds-animate-in.ds-bot .ds-bubble-msg {
        animation: none !important;
      }
      #ds-panel { opacity: 1; transform: none; }
    }
  `;
  document.head.appendChild(style);

  // Backdrop (for click-outside-to-close)
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

  // State: only allow 1 message at a time
  var isSending = false;

  function setSide(position) {
    var side = position === "left" ? "left" : "right";
    bubble.style.left = "";
    bubble.style.right = "";
    panel.style.left = "";
    panel.style.right = "";

    bubble.style[side] = "20px";
    panel.style[side] = "20px";

    // Set transform origin depending on side for nicer open animation
    panel.style.transformOrigin = side === "left" ? "bottom left" : "bottom right";
  }

  function setTypingState(typing) {
    isSending = !!typing;
    if (inputEl) inputEl.disabled = isSending;
    if (sendBtn) sendBtn.disabled = isSending || inputEl.value.trim().length === 0;

    // Optional UX: placeholder changes while waiting
    if (inputEl) {
      inputEl.placeholder = isSending ? "Waiting for reply..." : "Type a message...";
    }
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
    // Ensure only one widget open at a time
    try {
      window.dispatchEvent(new CustomEvent("dailysod:open", { detail: { clientId: clientId } }));
    } catch (e) {}

    backdrop.style.display = "block";
    panel.classList.remove("ds-closing");
    panel.classList.add("ds-open");

    if (inputEl) {
      // Focus after animation starts
      setTimeout(function () {
        if (!isSending) inputEl.focus();
      }, 120);
    }
  }

  function closePanel() {
    // Animate out
    panel.classList.remove("ds-open");
    panel.classList.add("ds-closing");
    backdrop.style.display = "none";

    // After animation ends, hide
    setTimeout(function () {
      panel.classList.remove("ds-closing");
      panel.style.display = "none";
    }, 190);
  }

  function isPanelOpen() {
    return panel.classList.contains("ds-open");
  }

  function togglePanel() {
    var open = isPanelOpen();
    if (open) closePanel();
    else openPanel();
  }

  function addMessage(role, text, opts) {
    opts = opts || {};
    var row = document.createElement("div");
    row.className = "ds-row " + (role === "user" ? "ds-user" : "ds-bot");

    // Entrance animation class
    if (opts.animate !== false) {
      row.classList.add("ds-animate-in");
    }

    var bubbleMsg = document.createElement("div");
    bubbleMsg.className = "ds-bubble-msg";
    bubbleMsg.textContent = text;

    row.appendChild(bubbleMsg);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    return row;
  }

  function updateSendState() {
    if (isSending) {
      sendBtn.disabled = true;
      return;
    }
    var val = inputEl.value.trim();
    sendBtn.disabled = val.length === 0;
  }

  function removeTypingIfPresent() {
    var last = messagesEl.lastElementChild;
    if (last && last.className.indexOf("ds-bot") !== -1) {
      var b = last.querySelector(".ds-bubble-msg");
      if (b && b.textContent === "Typing...") messagesEl.removeChild(last);
    }
  }

  function sendMessage() {
    if (isSending) return;

    var text = inputEl.value.trim();
    if (!text) return;

    // Lock send until bot reply returns
    setTypingState(true);

    addMessage("user", text);
    inputEl.value = "";
    updateSendState();

    // Add typing indicator (animated in)
    addMessage("bot", "Typing...");

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
        removeTypingIfPresent();
        window.__dailysodSessionId = data.sessionId || window.__dailysodSessionId;
        addMessage("bot", data.reply || "No reply returned.");
      })
      .catch(function (err) {
        removeTypingIfPresent();
        addMessage("bot", "Sorry — something went wrong.\n\n" + String(err));
      })
      .finally(function () {
        // Unlock send
        setTypingState(false);
        updateSendState();
        if (inputEl) inputEl.focus();
      });
  }

  // Bubble click animation helper
  function pressBubble() {
    bubble.classList.add("ds-press");
    setTimeout(function () {
      bubble.classList.remove("ds-press");
    }, 140);
  }

  // Initial greeting
  addMessage("bot", "Hi! I’m the DailySod widget.\n\nAsk me anything.", { animate: false });

  // Events
  bubble.addEventListener("click", function () {
    pressBubble();
    togglePanel();
  });

  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  inputEl.addEventListener("input", updateSendState);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });
  sendBtn.addEventListener("click", sendMessage);

  // Only one widget panel open at a time (across multiple embeds on same page)
  window.addEventListener("dailysod:open", function (ev) {
    try {
      if (ev && ev.detail && ev.detail.clientId && ev.detail.clientId !== clientId) {
        if (isPanelOpen()) closePanel();
      }
    } catch (e) {}
  });

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
