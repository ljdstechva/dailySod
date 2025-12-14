(function () {
  // Prevent duplicate loads
  if (window.__dailysodWidgetLoaded) return;
  window.__dailysodWidgetLoaded = true;

  // Try to find the script tag to get the Client ID
  var script = document.currentScript || document.querySelector('script[data-client-id]');
  var clientId = script && script.getAttribute("data-client-id");

  if (!clientId) {
    console.warn("[DailySod widget] missing data-client-id attribute on script tag");
    return;
  }

  // --- Configuration ---

  // Defaults based on the user's request
  var DEFAULTS = {
    position: "right",
    chatTitle: "DailySOD Chat me!",
    bubbleText: "Chat me!",
    bubbleColor: "#0f172a",
    bubbleImage: null,
    bubbleShape: "rounded", // rounded | circle
    
    // Theme Colors
    chatHeaderBg: "#ffdd00",
    chatHeaderText: "#000000",
    chatPanelBg: "#ffebeb",
    
    // Bubble Colors
    chatUserBubble: "#00ff55",
    chatUserText: "#000000",
    chatBotBubble: "#ffbdbd",
    chatBotText: "#000000",
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

  // --- Styles ---

  // We use CSS variables for colors, but modern polished CSS for layout/shape
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

      --ds-font: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --ds-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --ds-shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    /* Base Reset */
    .ds-reset * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ===== Launcher Bubble ===== */
    #ds-bubble {
      position: fixed;
      bottom: 24px;
      z-index: 2147483647; /* Max z-index */
      font-family: var(--ds-font);
      cursor: pointer;
      user-select: none;
      
      display: flex;
      align-items: center;
      justify-content: center;
      
      background-color: var(--ds-primary);
      color: white;
      box-shadow: var(--ds-shadow-lg);
      
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      will-change: transform;
    }

    #ds-bubble:hover {
      transform: scale(1.05);
      box-shadow: 0 25px 30px -5px rgba(0,0,0,0.15);
    }

    #ds-bubble:active {
      transform: scale(0.95);
    }

    /* Shape Variants */
    #ds-bubble.ds-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
    }
    
    #ds-bubble.ds-rounded {
      height: 48px;
      padding: 0 24px;
      border-radius: 24px;
      min-width: 120px;
    }

    /* Content inside bubble */
    #ds-bubble .ds-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    
    #ds-bubble .ds-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #ds-bubble .ds-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    /* ===== Chat Panel ===== */
    #ds-panel {
      position: fixed;
      bottom: 100px;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 600px;
      max-height: calc(100vh - 120px);
      background: var(--ds-panel-bg);
      border-radius: 20px;
      box-shadow: var(--ds-shadow-lg);
      border: 1px solid rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: var(--ds-font);
      z-index: 2147483647;
      
      /* Animation Initial State */
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transform-origin: bottom right;
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    #ds-panel.ds-left { transform-origin: bottom left; }
    
    #ds-panel.ds-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Header */
    #ds-header {
      padding: 16px 20px;
      background: var(--ds-header-bg);
      color: var(--ds-header-text);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      flex-shrink: 0;
    }

    #ds-title {
      font-weight: 700;
      font-size: 16px;
      letter-spacing: -0.01em;
    }

    #ds-close {
      background: rgba(0,0,0,0.05);
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      color: currentColor;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: background 0.2s;
    }
    
    #ds-close:hover {
      background: rgba(0,0,0,0.1);
    }

    /* Messages Area */
    #ds-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }

    /* Scrollbar styling */
    #ds-messages::-webkit-scrollbar {
      width: 6px;
    }
    #ds-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    #ds-messages::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.1);
      border-radius: 3px;
    }

    .ds-message-row {
      display: flex;
      width: 100%;
    }

    .ds-message-row.ds-bot { justify-content: flex-start; }
    .ds-message-row.ds-user { justify-content: flex-end; }

    .ds-bubble {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      animation: ds-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
      transform: translateY(10px);
    }

    .ds-message-row.ds-bot .ds-bubble {
      background: var(--ds-bot-bubble);
      color: var(--ds-bot-text);
      border-bottom-left-radius: 4px;
    }

    .ds-message-row.ds-user .ds-bubble {
      background: var(--ds-user-bubble);
      color: var(--ds-user-text);
      border-bottom-right-radius: 4px;
    }

    @keyframes ds-fade-in {
      to { opacity: 1; transform: translateY(0); }
    }

    .ds-typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      align-items: center;
      height: 40px;
    }
    
    .ds-dot {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
      opacity: 0.6;
      animation: ds-bounce 1.4s infinite ease-in-out both;
    }
    
    .ds-dot:nth-child(1) { animation-delay: -0.32s; }
    .ds-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes ds-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Footer */
    #ds-footer {
      padding: 16px;
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(0,0,0,0.05);
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }

    .ds-input-container {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      display: flex;
      align-items: center;
      padding: 4px 4px 4px 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .ds-input-container:focus-within {
      border-color: var(--ds-primary);
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1); /* fallback shadow color */
    }

    #ds-input {
      flex: 1;
      border: none;
      outline: none;
      font-family: var(--ds-font);
      font-size: 14px;
      background: transparent;
      padding: 8px 0;
      min-height: 24px;
      max-height: 100px;
      resize: none;
    }

    #ds-send {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--ds-primary);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
      flex-shrink: 0;
    }

    #ds-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    #ds-send:hover:not(:disabled) {
      transform: scale(1.05);
    }
    
    #ds-send svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;
  document.head.appendChild(style);

  // --- Component Creation ---

  // 1. Bubble
  var bubble = document.createElement("div");
  bubble.id = "ds-bubble";
  bubble.className = "ds-reset";
  bubble.setAttribute("role", "button");
  bubble.setAttribute("aria-label", "Toggle chat");
  document.body.appendChild(bubble);

  // 2. Panel
  var panel = document.createElement("div");
  panel.id = "ds-panel";
  panel.className = "ds-reset";
  panel.innerHTML = `
    <div id="ds-header">
      <span id="ds-title"></span>
      <button id="ds-close" aria-label="Close chat">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    <div id="ds-messages"></div>
    <div id="ds-footer">
      <div class="ds-input-container">
        <textarea id="ds-input" placeholder="Type a message..." rows="1"></textarea>
        <button id="ds-send" aria-label="Send message">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // --- Element References ---
  var elTitle = panel.querySelector("#ds-title");
  var elClose = panel.querySelector("#ds-close");
  var elMessages = panel.querySelector("#ds-messages");
  var elInput = panel.querySelector("#ds-input");
  var elSend = panel.querySelector("#ds-send");

  // --- State ---
  var isOpen = false;
  var isSending = false;
  var sessionId = window.__dailysodSessionId || null;
  var lastConfigHash = null;

  // --- Logic ---

  function renderBubbleContent(s) {
    var isCircle = s.bubbleShape === 'circle';
    
    // Reset classes
    bubble.className = "ds-reset";
    bubble.classList.add(isCircle ? "ds-circle" : "ds-rounded");

    // Position style
    var side = s.position === "left" ? "left" : "right";
    bubble.style.left = side === "left" ? "24px" : "auto";
    bubble.style.right = side === "right" ? "24px" : "auto";
    
    panel.style.left = side === "left" ? "24px" : "auto";
    panel.style.right = side === "right" ? "24px" : "auto";
    panel.style.transformOrigin = "bottom " + side;
    
    // Content
    var html = '<div class="ds-content">';
    
    // Icon Logic
    var iconHtml = '';
    if (s.bubbleImage) {
      iconHtml = `<div class="ds-icon"><img src="${s.bubbleImage}" alt="Chat" /></div>`;
    } else if (isCircle) {
      // Default icon for circle if no image
      iconHtml = `<div class="ds-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>`;
    }
    
    // Text Logic
    var textHtml = '';
    if (!isCircle && s.bubbleText) {
       textHtml = `<span>${s.bubbleText}</span>`;
    }
    
    // Combine
    // If circle: only Icon. If rounded: Text + optional Icon (if defined by user, though user request said "rounded plain text only" we can be flexible. Sticking to logic: Rounded usually text, Circle usually icon).
    // The previous code said "Rounded must be plain centred text only". Let's stick to that for user consistency, but make it look good.
    if (!isCircle) {
        html += textHtml;
    } else {
        html += iconHtml;
    }
    
    html += '</div>';
    bubble.innerHTML = html;
  }

  function applyConfig(settings) {
    var s = normalizeSettings(settings);
    
    // CSS Variables for Colors
    var r = document.documentElement;
    r.style.setProperty("--ds-primary", s.bubbleColor);
    r.style.setProperty("--ds-header-bg", s.chatHeaderBg);
    r.style.setProperty("--ds-header-text", s.chatHeaderText);
    r.style.setProperty("--ds-panel-bg", s.chatPanelBg);
    r.style.setProperty("--ds-user-bubble", s.chatUserBubble);
    r.style.setProperty("--ds-user-text", s.chatUserText);
    r.style.setProperty("--ds-bot-bubble", s.chatBotBubble);
    r.style.setProperty("--ds-bot-text", s.chatBotText);

    // DOM Updates
    elTitle.textContent = s.chatTitle;
    renderBubbleContent(s);
  }

  function togglePanel() {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add("ds-open");
      setTimeout(() => elInput.focus(), 100);
      // Mobile handling: prevent body scroll if needed, but keeping it simple for now
    } else {
      panel.classList.remove("ds-open");
    }
  }

  function addMessage(role, text) {
    var row = document.createElement("div");
    row.className = `ds-message-row ds-${role}`;
    
    var bubbleDiv = document.createElement("div");
    bubbleDiv.className = "ds-bubble";
    bubbleDiv.innerHTML = text.replace(/\n/g, '<br>'); // Basic formatting
    
    row.appendChild(bubbleDiv);
    elMessages.appendChild(row);
    scrollToBottom();
    return row;
  }

  function addTypingIndicator() {
    var row = document.createElement("div");
    row.className = "ds-message-row ds-bot";
    var bubbleDiv = document.createElement("div");
    bubbleDiv.className = "ds-bubble";
    bubbleDiv.innerHTML = `
      <div class="ds-typing-indicator">
        <div class="ds-dot"></div>
        <div class="ds-dot"></div>
        <div class="ds-dot"></div>
      </div>
    `;
    row.appendChild(bubbleDiv);
    elMessages.appendChild(row);
    scrollToBottom();
    return row;
  }

  function scrollToBottom() {
    elMessages.scrollTop = elMessages.scrollHeight;
  }

  function updateSendButton() {
    elSend.disabled = elInput.value.trim().length === 0 || isSending;
  }

  function sendMessage() {
    var text = elInput.value.trim();
    if (!text || isSending) return;

    isSending = true;
    updateSendButton();
    addMessage("user", text);
    elInput.value = "";
    elInput.style.height = 'auto'; // Reset height

    // Show typing
    var typingEl = addTypingIndicator();

    // Mock network delay + fetch
    var apiUrl = new URL("/api/chat", script.src || window.location.href).toString();
    
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: clientId,
        message: text,
        sessionId: sessionId,
        pageUrl: window.location.href,
      }),
    })
    .then(res => res.json())
    .then(data => {
      // Remove typing
      if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
      
      window.__dailysodSessionId = data.sessionId || sessionId;
      sessionId = window.__dailysodSessionId;
      
      addMessage("bot", data.reply || "No reply from server.");
    })
    .catch(err => {
      if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
      addMessage("bot", "Error: " + err.message);
    })
    .finally(() => {
      isSending = false;
      updateSendButton();
      scrollToBottom();
    });
  }

  // --- Event Listeners ---
  
  bubble.addEventListener("click", togglePanel);
  elClose.addEventListener("click", togglePanel);
  
  elSend.addEventListener("click", sendMessage);
  
  elInput.addEventListener("input", function() {
    updateSendButton();
    // Auto-resize textarea
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
  
  elInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // --- Initial Fetch ---
  
  function fetchConfig() {
    // Determine API URL (handle case where script.src might be undefined in some envs)
    var baseUrl = script.src ? new URL(script.src).origin : window.location.origin;
    var url = `${baseUrl}/api/widget/config?clientId=${encodeURIComponent(clientId)}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Config fetch failed");
        return res.json();
      })
      .then(json => {
        var settings = (json && json.settings) || {};
        var hash = JSON.stringify(settings);
        if (hash !== lastConfigHash) {
          lastConfigHash = hash;
          applyConfig(settings);
        }
      })
      .catch(err => {
        console.warn("[DailySod] Using defaults due to error:", err);
        if (!lastConfigHash) {
          applyConfig(DEFAULTS);
          lastConfigHash = "defaults";
        }
      });
  }

  // Initial load
  fetchConfig();
  
  // Poll for config changes every 5s (useful for the demo)
  setInterval(fetchConfig, 5000);

  // Initial Greeting (Optional, but friendly)
  setTimeout(() => {
    if (elMessages.children.length === 0) {
       addMessage("bot", "Hi! 👋 How can I help you today?");
    }
  }, 500);

})();