// src/popup.ts
var chrome = typeof browser !== "undefined" ? browser : window.chrome;
var BASE_URL = "http://localhost:3000";
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
  const authStatus = await chrome.runtime.sendMessage({
    action: "getAuthStatus"
  });
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
    const { authToken, userId } = await chrome.storage.local.get([
      "authToken",
      "userId"
    ]);
    if (!authToken) {
      console.error("No auth token found");
      return;
    }
    while (tripSelect.options.length > 1) {
      tripSelect.remove(1);
    }
    const response = await fetch(`${BASE_URL}/api/trips/list`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      const trips = data.trips || [];
      if (trips.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No trips yet";
        option.disabled = true;
        tripSelect.appendChild(option);
      } else {
        trips.forEach((trip) => {
          const option = document.createElement("option");
          option.value = trip.id;
          option.textContent = trip.name;
          tripSelect.appendChild(option);
        });
      }
    } else {
      console.error("Failed to fetch trips:", response.status);
      if (response.status === 401 || response.status === 500) {
        console.log("Token may be expired, clearing auth");
        await chrome.storage.local.remove(["authToken", "userId"]);
        showLoginView();
        return;
      }
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Failed to load trips";
      option.disabled = true;
      tripSelect.appendChild(option);
    }
  } catch (error) {
    console.error("Failed to load trips:", error);
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Error loading trips";
    option.disabled = true;
    tripSelect.appendChild(option);
  }
}
loginBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: `${BASE_URL}/login?from=extension` });
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
  chrome.tabs.create({ url: `${BASE_URL}/dashboard/captures` });
  window.close();
});
viewInAppBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: `${BASE_URL}/dashboard/captures` });
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
