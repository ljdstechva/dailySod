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
    chatBotBubble: "#ffffff",
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
      chatBotBubble: safe(s.chatBotBubble, DEFAULTS.chatBotBubble),
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
      --ds-bot-bubble: ${DEFAULTS.chatBotBubble};
      --ds-border: #e2e8f0;
    }

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
      gap: 10px;

      background: var(--ds-primary);
      color: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.18);

      transition: transform 120ms ease, opacity 120ms ease;
    }

    #ds-bubble:active { transform: scale(0.98); }

    /* Circle vs rounded */
    #ds-bubble.ds-circle {
      width: 58px;
      height: 58px;
      border-radius: 999px;
      padding: 0;
    }
    #ds-bubble.ds-rounded {
      height: 44px;
      min-width: 170px;
      border-radius: 14px;
      padding: 0 14px;
      justify-content: flex-start;
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
    }

    /* Panel */
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
      color: #0f172a;
      white-space: pre-wrap;
    }

    .ds-user .ds-bubble-msg {
      background: var(--ds-user-bubble);
      color: white;
      border-color: var(--ds-user-bubble);
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

    /* Modal close on outside click needs a backdrop */
    #ds-backdrop {
      position: fixed;
      inset: 0;
      background: transparent;
      z-index: 999998;
      display: none;
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

  function setSide(position) {
    // right/left positioning for both bubble and panel
    var side = position === "left" ? "left" : "right";
    bubble.style.left = "";
    bubble.style.right = "";
    panel.style.left = "";
    panel.style.right = "";

    bubble.style[side] = "20px";
    panel.style[side] = "20px";
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
    document.documentElement.style.setProperty("--ds-bot-bubble", s.chatBotBubble);

    // Bubble shape + content
    bubble.classList.remove("ds-circle", "ds-rounded");
    bubble.classList.add(s.bubbleShape === "circle" ? "ds-circle" : "ds-rounded");

    var iconEl = bubble.querySelector('[data-role="icon"]');
    var textEl = bubble.querySelector('[data-role="text"]');

    // Icon/image
    if (iconEl) {
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

    // Text (only show on rounded)
    if (textEl) {
      if (s.bubbleShape === "rounded") {
        textEl.textContent = s.bubbleText || DEFAULTS.bubbleText;
        textEl.style.display = "inline";
      } else {
        textEl.textContent = "";
        textEl.style.display = "none";
      }
    }

    // Panel title
    var titleEl = panel.querySelector('[data-role="title"]');
    if (titleEl) titleEl.textContent = s.chatTitle || DEFAULTS.chatTitle;
  }

  function openPanel() {
    panel.style.display = "block";
    backdrop.style.display = "block";
    if (inputEl) inputEl.focus();
  }

  function closePanel() {
    panel.style.display = "none";
    backdrop.style.display = "none";
  }

  function togglePanel() {
    var isOpen = panel.style.display === "block";
    if (isOpen) closePanel();
    else openPanel();
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
    var val = inputEl.value.trim();
    sendBtn.disabled = val.length === 0;
  }

  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text) return;

    addMessage("user", text);
    inputEl.value = "";
    updateSendState();

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
      });
  }

  // Initial greeting
  addMessage("bot", "Hi! I’m the DailySod widget.\n\nAsk me anything.");

  // Events
  bubble.addEventListener("click", togglePanel);
  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

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
    } catch {
      return String(Date.now());
    }
  }

  function fetchAndApply() {
    return fetch(new URL("/api/widget/config?clientId=" + encodeURIComponent(clientId), script.src).toString(), {
      method: "GET",
      mode: "cors",
    })
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
        // Apply defaults if first load fails
        if (!lastConfigHash) {
          lastConfigHash = hashSettings(DEFAULTS);
          applyConfig(DEFAULTS);
        }
      });
  }

  // Apply once immediately, then poll so "Apply" updates live widgets
  fetchAndApply();
  setInterval(fetchAndApply, 8000);

  console.log("[DailySod widget] loaded", { clientId: clientId });
})();
