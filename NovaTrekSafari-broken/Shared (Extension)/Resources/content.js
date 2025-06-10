// src/content.ts
var chrome = typeof browser !== "undefined" ? browser : window.chrome;
if (window.location.hostname === "localhost" || window.location.hostname === "novatrek.app") {
  if (window.location.pathname === "/extension-auth") {
    let tokenFound = false;
    const checkForToken = setInterval(() => {
      const tokenElement = document.getElementById("extension-auth-token");
      if (tokenElement && tokenElement.dataset.token) {
        if (tokenFound)
          return;
        tokenFound = true;
        clearInterval(checkForToken);
        const userId = tokenElement.dataset.userId || "demo-user";
        chrome.runtime.sendMessage({
          action: "authTokenReceived",
          token: tokenElement.dataset.token,
          userId
        });
        chrome.storage.local.set({
          authToken: tokenElement.dataset.token,
          userId
        });
        setTimeout(() => {
          window.close();
        }, 1e3);
      }
    }, 100);
    setTimeout(() => {
      clearInterval(checkForToken);
    }, 1e4);
  }
}
function detectTravelContent() {
  const pageText = document.body.innerText.toLowerCase();
  const travelKeywords = [
    "hotel",
    "restaurant",
    "flight",
    "travel",
    "vacation",
    "trip",
    "tourism",
    "booking",
    "airbnb",
    "hostel",
    "attraction",
    "museum",
    "beach",
    "mountain",
    "city guide"
  ];
  const isTravelContent = travelKeywords.some((keyword) => pageText.includes(keyword));
  if (isTravelContent) {
    addFloatingSaveButton();
  }
}
function addFloatingSaveButton() {
  if (document.getElementById("novatrek-save-button"))
    return;
  const button = document.createElement("button");
  button.id = "novatrek-save-button";
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
    Save to NovaTrek
  `;
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: #000;
    color: white;
    border: none;
    border-radius: 24px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: all 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  `;
  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.05)";
    button.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
  });
  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
    button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  });
  button.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "save",
      data: {
        url: window.location.href,
        title: document.title,
        type: "page"
      }
    });
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Saved!
    `;
    button.style.background = "#00d000";
    setTimeout(() => {
      button.remove();
    }, 2e3);
  });
  document.body.appendChild(button);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", detectTravelContent);
} else {
  detectTravelContent();
}
var selectionTimeout;
document.addEventListener("mouseup", () => {
  clearTimeout(selectionTimeout);
  selectionTimeout = window.setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 10) {
      console.log("Text selected:", selection.toString());
    }
  }, 500);
});
//# sourceMappingURL=content.js.map
