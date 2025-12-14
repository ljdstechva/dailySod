(function () {
  if (window.__dailysodWidgetLoaded) return;
  window.__dailysodWidgetLoaded = true;

  var script = document.currentScript;
  var clientId = script && script.getAttribute("data-client-id");

  if (!clientId) {
    console.warn("[DailySod widget] missing data-client-id");
    return;
  }

  var DEFAULTS = {
    position: "right",
    bubbleShape: "rounded",
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

  /* ===================== STYLES ===================== */
  var style = document.createElement("style");
  style.id = "ds-style";
  style.innerHTML = `
    :root {
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

    #ds-bubble {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--ds-primary);
      color: white;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      transition: transform 120ms ease;
    }

    #ds-bubble.ds-circle {
      width: 58px;
      height: 58px;
      border-radius: 999px;
    }

    #ds-bubble.ds-rounded {
      height: 44px;
      min-width: 170px;
      padding: 0 14px;
    }

    #ds-bubble.ds-press {
      transform: scale(0.96);
    }

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
      display: none;
      opacity: 0;
      transform: translateY(10px) scale(0.98);
      transition: transform 160ms ease, opacity 160ms ease;
      z-index: 999999;
    }

    #ds-panel.ds-open {
      display: block;
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    #ds-header {
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      background: var(--ds-header-bg);
      color: var(--ds-header-text);
      border-bottom: 1px solid var(--ds-border);
    }

    #ds-close {
      cursor: pointer;
      border: none;
      background: transparent;
      font-size: 18px;
    }

    #ds-messages {
      height: 340px;
      padding: 12px;
      overflow-y: auto;
      background: var(--ds-panel-bg);
    }

    .ds-row {
      display: flex;
      margin-bottom: 10px;
    }

    .ds-user { justify-content: flex-end; }
    .ds-bot { justify-content: flex-start; }

    .ds-bubble-msg {
      max-width: 78%;
      padding: 10px 12px;
      border-radius: 14px;
      background: var(--ds-bot-bubble);
      color: var(--ds-bot-text);
      animation: ds-in-left 160ms ease forwards;
    }

    .ds-user .ds-bubble-msg {
      background: var(--ds-user-bubble);
      color: var(--ds-user-text);
      animation: ds-in-right 160ms ease forwards;
    }

    @keyframes ds-in-left {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes ds-in-right {
      from { opacity: 0; transform: translateX(10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    #ds-footer {
      display: flex;
      gap: 8px;
      padding: 10px;
      border-top: 1px solid var(--ds-border);
    }

    #ds-input {
      flex: 1;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--ds-border);
    }

    #ds-send {
      background: var(--ds-primary);
      color: white;
      border-radius: 12px;
      padding: 10px 12px;
      border: none;
      cursor: pointer;
    }

    #ds-send:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

  /* ===================== DOM ===================== */

  var bubble = document.createElement("button");
  bubble.id = "ds-bubble";
  bubble.innerHTML = `<span data-role="text"></span>`;
  document.body.appendChild(bubble);

  var panel = document.createElement("div");
  panel.id = "ds-panel";
  panel.innerHTML = `
    <div id="ds-header">
      <span data-role="title">${DEFAULTS.chatTitle}</span>
      <button id="ds-close">×</button>
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

  var isOpen = false;
  var isSending = false;

  function openPanel() {
    if (isOpen) return;
    isOpen = true;
    panel.classList.add("ds-open");
    panel.style.display = "block";
    inputEl.focus();
  }

  function closePanel() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("ds-open");
    setTimeout(() => (panel.style.display = "none"), 160);
  }

  bubble.addEventListener("click", () => {
    bubble.classList.add("ds-press");
    setTimeout(() => bubble.classList.remove("ds-press"), 120);
    isOpen ? closePanel() : openPanel();
  });

  closeBtn.addEventListener("click", closePanel);

  function addMessage(role, text) {
    var row = document.createElement("div");
    row.className = "ds-row " + (role === "user" ? "ds-user" : "ds-bot");
    var msg = document.createElement("div");
    msg.className = "ds-bubble-msg";
    msg.textContent = text;
    row.appendChild(msg);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function updateSendState() {
    sendBtn.disabled = isSending || !inputEl.value.trim();
  }

  function sendMessage() {
    if (isSending) return;
    var text = inputEl.value.trim();
    if (!text) return;

    addMessage("user", text);
    inputEl.value = "";
    isSending = true;
    updateSendState();
    addMessage("bot", "Typing...");

    fetch(new URL("/api/chat", script.src), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, message: text }),
    })
      .then(r => r.json())
      .then(d => {
        messagesEl.removeChild(messagesEl.lastChild);
        addMessage("bot", d.reply || "No reply.");
      })
      .finally(() => {
        isSending = false;
        updateSendState();
        inputEl.focus();
      });
  }

  inputEl.addEventListener("input", updateSendState);
  inputEl.addEventListener("keydown", e => e.key === "Enter" && sendMessage());
  sendBtn.addEventListener("click", sendMessage);

  addMessage("bot", "Hi! I’m the DailySod widget.\n\nAsk me anything.");

  console.log("[DailySod widget] loaded");
})();
