// src/background.ts
var chrome = typeof browser !== "undefined" ? browser : window.chrome;
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url);
    if ((url.hostname === "localhost" || url.hostname === "novatrek.app") && url.pathname === "/extension-auth") {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      }).catch((err) => console.error("Failed to inject content script:", err));
    }
  }
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-page",
    title: "Save page to NovaTrek",
    contexts: ["page"]
  });
  chrome.contextMenus.create({
    id: "save-selection",
    title: 'Save "%s" to NovaTrek',
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "save-link",
    title: "Save link to NovaTrek",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "save-image",
    title: "Save image to NovaTrek",
    contexts: ["image"]
  });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.url || !tab?.title)
    return;
  let captureData = {
    url: tab.url,
    title: tab.title,
    type: "page"
  };
  switch (info.menuItemId) {
    case "save-selection":
      captureData.selectedText = info.selectionText;
      captureData.type = "text";
      break;
    case "save-link":
      captureData.linkUrl = info.linkUrl;
      captureData.type = "link";
      break;
    case "save-image":
      captureData.imageUrl = info.srcUrl;
      captureData.type = "image";
      break;
  }
  saveToNovaTrek(captureData);
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "save") {
    saveToNovaTrek(request.data);
    sendResponse({ success: true });
  } else if (request.action === "getAuthStatus") {
    getAuthStatus().then(sendResponse);
    return true;
  } else if (request.action === "authTokenReceived") {
    chrome.storage.local.set({
      authToken: request.token,
      userId: request.userId
    }).then(() => {
      sendResponse({ success: true });
      if (sender.tab?.id) {
        chrome.tabs.remove(sender.tab.id);
      }
    });
    return true;
  }
});
async function saveToNovaTrek(data) {
  try {
    const { authToken, userId } = await chrome.storage.local.get(["authToken", "userId"]);
    if (!authToken || !userId) {
      chrome.action.openPopup();
      return;
    }
    chrome.action.setBadgeText({ text: "..." });
    chrome.action.setBadgeBackgroundColor({ color: "#FFA500" });
    const requestBody = {
      content: data.url || data.selectedText || data.linkUrl || data.imageUrl || "",
      contentType: data.type === "page" ? "link" : data.type,
      source: "browser-extension",
      sourceUrl: data.url,
      title: data.title,
      capturedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (data.selectedText) {
      requestBody.notes = data.selectedText;
    }
    console.log("Sending capture to API:", requestBody);
    const apiUrl = false ? "http://localhost:3000/api/captures-simple" : "https://novatrek.app/api/captures-simple";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "X-User-Id": userId
        // Temporary until we implement proper token verification
      },
      body: JSON.stringify(requestBody)
    });
    if (response.ok) {
      chrome.action.setBadgeText({ text: "\u2713" });
      chrome.action.setBadgeBackgroundColor({ color: "#00D000" });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 2e3);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon-128.png",
        // Safari requires PNG icons
        title: "Saved to NovaTrek!",
        message: `${data.title || "Content"} has been saved to your travel inbox`
      });
    } else {
      const errorText = await response.text();
      console.error("API Error Response:", response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 2e3);
    console.error("Failed to save to NovaTrek:", error);
  }
}
async function getAuthStatus() {
  const { authToken, userId } = await chrome.storage.local.get(["authToken", "userId"]);
  if (!authToken) {
    return { isAuthenticated: false };
  }
  return {
    isAuthenticated: true,
    user: { uid: userId }
  };
}
//# sourceMappingURL=background.js.map
