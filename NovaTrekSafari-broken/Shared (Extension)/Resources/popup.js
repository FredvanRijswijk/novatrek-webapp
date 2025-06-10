// src/popup.ts
var chrome = typeof browser !== "undefined" ? browser : window.chrome;
var loginView = document.getElementById("login-view");
var mainView = document.getElementById("main-view");
var successView = document.getElementById("success-view");
var loginBtn = document.getElementById("login-btn");
var saveBtn = document.getElementById("save-btn");
var quickSaveBtn = document.getElementById("quick-save-btn");
var logoutBtn = document.getElementById("logout");
var openDashboardBtn = document.getElementById("open-dashboard");
var viewInAppBtn = document.getElementById("view-in-app");
var saveAnotherBtn = document.getElementById("save-another");
var pageTitleEl = document.getElementById("page-title");
var pageUrlEl = document.getElementById("page-url");
var notesInput = document.getElementById("notes");
var tagsInput = document.getElementById("tags");
var tripSelect = document.getElementById("trip-select");
async function init() {
  const authStatus = await chrome.runtime.sendMessage({ action: "getAuthStatus" });
  if (authStatus.isAuthenticated) {
    showMainView();
    loadCurrentTab();
    loadUserTrips();
  } else {
    showLoginView();
  }
}
function showLoginView() {
  loginView.classList.remove("hidden");
  mainView.classList.add("hidden");
  successView.classList.add("hidden");
}
function showMainView() {
  loginView.classList.add("hidden");
  mainView.classList.remove("hidden");
  successView.classList.add("hidden");
}
function showSuccessView() {
  loginView.classList.add("hidden");
  mainView.classList.add("hidden");
  successView.classList.remove("hidden");
}
async function loadCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.title && tab.url) {
    pageTitleEl.textContent = tab.title;
    pageUrlEl.textContent = new URL(tab.url).hostname;
  }
}
async function loadUserTrips() {
  try {
    const { authToken, userId } = await chrome.storage.local.get(["authToken", "userId"]);
    const option = document.createElement("option");
    option.value = "placeholder";
    option.textContent = "Loading trips...";
    option.disabled = true;
    tripSelect.appendChild(option);
  } catch (error) {
    console.error("Failed to load trips:", error);
  }
}
loginBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000/login?from=extension" });
});
saveBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url || !tab.title)
    return;
  saveBtn.querySelector(".btn-text").classList.add("hidden");
  saveBtn.querySelector(".spinner").classList.remove("hidden");
  saveBtn.disabled = true;
  const saveData = {
    url: tab.url,
    title: tab.title,
    notes: notesInput.value,
    tags: tagsInput.value.split(",").map((t) => t.trim()).filter(Boolean),
    tripId: tripSelect.value || void 0
  };
  try {
    await chrome.runtime.sendMessage({
      action: "save",
      data: saveData
    });
    showSuccessView();
  } catch (error) {
    console.error("Save failed:", error);
    saveBtn.querySelector(".btn-text").classList.remove("hidden");
    saveBtn.querySelector(".spinner").classList.add("hidden");
    saveBtn.disabled = false;
  }
});
quickSaveBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url || !tab.title)
    return;
  await chrome.runtime.sendMessage({
    action: "save",
    data: {
      url: tab.url,
      title: tab.title
    }
  });
  window.close();
});
logoutBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove("authToken");
  showLoginView();
});
openDashboardBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000/dashboard/captures" });
  window.close();
});
viewInAppBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:3000/dashboard/captures" });
  window.close();
});
saveAnotherBtn.addEventListener("click", () => {
  notesInput.value = "";
  tagsInput.value = "";
  tripSelect.value = "";
  showMainView();
  loadCurrentTab();
});
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "authTokenReceived" && request.token) {
    chrome.storage.local.set({
      authToken: request.token,
      userId: request.userId
    });
    showMainView();
    loadCurrentTab();
    loadUserTrips();
  }
});
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.authToken) {
    init();
  }
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    init();
  }
});
init();
//# sourceMappingURL=popup.js.map
