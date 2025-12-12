(function () {
  // Prevent double-loading
  if (window.__dailysodWidgetLoaded) return;
  window.__dailysodWidgetLoaded = true;

  // Read clientId from the script tag
  var script = document.currentScript;
  var clientId = script && script.getAttribute("data-client-id");

  // Basic config
  var WIDGET_TITLE = "DailySod Chat";
  var POSITION = "right"; // right | left
  var PRIMARY = "#0f172a"; // slate-900
  var BG = "#ffffff";
  var BORDER = "#e2e8f0";

  // Inject styles
  var style = document.createElement("style");
  style.innerHTML = `
    #ds-bubble {
      position: fixed;
      ${POSITION}: 20px;
      bottom: 20px;
      width: 56px;
      height: 56px;
      border-radius: 999px;
      background: ${PRIMARY};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      z-index: 999999;
      user-select: none;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }

    #ds-panel {
      position: fixed;
      ${POSITION}: 20px;
      bottom: 88px;
      width: 340px;
      height: 460px;
      border-radius: 16px;
      background: ${BG};
      border: 1px solid ${BORDER};
      box-shadow: 0 10px 30px rgba(0,0,0,0.18);
      z-index: 999999;
      overflow: hidden;
      display: none;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }

    #ds-header {
      padding: 12px 14px;
      background: ${BG};
      border-bottom: 1px solid ${BORDER};
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    #ds-header-title {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    #ds-badge {
      font-size: 11px;
      color: #475569;
      border: 1px solid ${BORDER};
      padding: 2px 8px;
      border-radius: 999px;
      max-width: 190px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #ds-close {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      border: 1px solid ${BORDER};
      background: ${BG};
      cursor: pointer;
      color: #0f172a;
      font-size: 16px;
      line-height: 1;
    }

    #ds-messages {
      height: 340px;
      overflow-y: auto;
      padding: 12px;
      background: #f8fafc;
    }

    .ds-row {
      display: flex;
      margin-bottom: 10px;
    }

    .ds-user { justify-content: flex-end; }
    .ds-bot { justify-content: flex-start; }

    .ds-bubble {
      max-width: 78%;
      padding: 10px 12px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.35;
      border: 1px solid ${BORDER};
      background: white;
      color: #0f172a;
      white-space: pre-wrap;
    }

    .ds-user .ds-bubble {
      background: ${PRIMARY};
      color: white;
      border-color: ${PRIMARY};
    }

    #ds-footer {
      padding: 10px;
      border-top: 1px solid ${BORDER};
      background: ${BG};
      display: flex;
      gap: 8px;
      align-items: center;
    }

    #ds-input {
      flex: 1;
      border: 1px solid ${BORDER};
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 13px;
      outline: none;
    }

    #ds-send {
      border: 1px solid ${PRIMARY};
      background: ${PRIMARY};
      color: white;
      border-radius: 12px;
      padding: 10px 12px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    #ds-send:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    #ds-hint {
      font-size: 11px;
      color: #64748b;
      padding: 10px 12px;
      border-top: 1px dashed ${BORDER};
      background: #f8fafc;
    }
  `;
  document.head.appendChild(style);

  // Create bubble button
  var bubble = document.createElement("div");
  bubble.id = "ds-bubble";
  bubble.innerHTML = "💬";
  bubble.title = "Chat with DailySod";
  document.body.appendChild(bubble);

  // Create panel
  var panel = document.createElement("div");
  panel.id = "ds-panel";
  panel.innerHTML = `
    <div id="ds-header">
      <div id="ds-header-title">
        <span>${WIDGET_TITLE}</span>
        <span id="ds-badge">${clientId ? "client: " + clientId : "missing client id"}</span>
      </div>
      <button id="ds-close" aria-label="Close">×</button>
    </div>

    <div id="ds-messages"></div>

    <div id="ds-footer">
      <input id="ds-input" placeholder="Type a message..." />
      <button id="ds-send" disabled>Send</button>
    </div>

    <div id="ds-hint">
      Widget v0: messages echo locally. Next: connect to your API.
    </div>
  `;
  document.body.appendChild(panel);

  var closeBtn = panel.querySelector("#ds-close");
  var messagesEl = panel.querySelector("#ds-messages");
  var inputEl = panel.querySelector("#ds-input");
  var sendBtn = panel.querySelector("#ds-send");

  function openPanel() {
    panel.style.display = "block";
    inputEl && inputEl.focus();
  }

  function closePanel() {
    panel.style.display = "none";
  }

  function togglePanel() {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    if (panel.style.display === "block" && inputEl) inputEl.focus();
  }

  function addMessage(role, text) {
    var row = document.createElement("div");
    row.className = "ds-row " + (role === "user" ? "ds-user" : "ds-bot");

    var bubbleMsg = document.createElement("div");
    bubbleMsg.className = "ds-bubble";
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

    // Real backend call (Widget v1)
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
    pageUrl: window.location.href
  }),
})
  .then(function (res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then(function (data) {
    // remove the "Typing..." bubble by replacing last bot message
    // simple approach: remove last message row if it was bot typing
    var last = messagesEl.lastElementChild;
    if (last && last.className.indexOf("ds-bot") !== -1) {
      var bubble = last.querySelector(".ds-bubble");
      if (bubble && bubble.textContent === "Typing...") {
        messagesEl.removeChild(last);
      }
    }

    window.__dailysodSessionId = data.sessionId || window.__dailysodSessionId;
    addMessage("bot", data.reply || "No reply returned.");
  })
  .catch(function (err) {
    var last = messagesEl.lastElementChild;
    if (last && last.className.indexOf("ds-bot") !== -1) {
      var bubble = last.querySelector(".ds-bubble");
      if (bubble && bubble.textContent === "Typing...") {
        messagesEl.removeChild(last);
      }
    }
    addMessage("bot", "Sorry — something went wrong.\n\n" + String(err));
  });

  }

  // Initial greeting
  addMessage(
    "bot",
    "Hi! I’m the DailySod widget.\n\nAsk me anything — I’ll be connected to your AI backend next."
  );

  // Events
  bubble.addEventListener("click", togglePanel);
  closeBtn.addEventListener("click", closePanel);

  inputEl.addEventListener("input", updateSendState);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });
  sendBtn.addEventListener("click", sendMessage);

  // Debug
  console.log("[DailySod widget] loaded", { clientId: clientId });
})();
