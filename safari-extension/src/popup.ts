// Popup script for NovaTrek Safari extension

// Safari uses browser API instead of chrome API
declare const browser: any;
const chrome =
  typeof browser !== "undefined" ? browser : (window as any).chrome;

// Configuration - Change for production
const BASE_URL = "http://localhost:3000"; // For production: 'https://novatrek.app'

interface SaveData {
  url: string;
  title: string;
  notes?: string;
  tags?: string[];
  tripId?: string;
}

// DOM Elements
const loginView = document.getElementById("login-view")!;
const mainView = document.getElementById("main-view")!;
const successView = document.getElementById("success-view")!;

const loginBtn = document.getElementById("login-btn")!;
const saveBtn = document.getElementById("save-btn")!;
const quickSaveBtn = document.getElementById("quick-save-btn")!;
const logoutBtn = document.getElementById("logout")!;
const openDashboardBtn = document.getElementById("open-dashboard")!;
const viewInAppBtn = document.getElementById("view-in-app")!;
const saveAnotherBtn = document.getElementById("save-another")!;

const pageTitleEl = document.getElementById("page-title")!;
const pageUrlEl = document.getElementById("page-url")!;
const notesInput = document.getElementById("notes") as HTMLTextAreaElement;
const tagsInput = document.getElementById("tags") as HTMLInputElement;
const tripSelect = document.getElementById("trip-select") as HTMLSelectElement;

// Initialize popup
async function init() {
  // Check auth status
  const authStatus = await chrome.runtime.sendMessage({
    action: "getAuthStatus",
  });

  if (authStatus.isAuthenticated) {
    showMainView();
    loadCurrentTab();
    loadUserTrips();
  } else {
    showLoginView();
  }
}

// Show different views
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

// Load current tab info
async function loadCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.title && tab.url) {
    pageTitleEl.textContent = tab.title;
    pageUrlEl.textContent = new URL(tab.url).hostname;
  }
}

// Load user's trips
async function loadUserTrips() {
  try {
    const { authToken, userId } = await chrome.storage.local.get([
      "authToken",
      "userId",
    ]);

    if (!authToken) {
      console.error("No auth token found");
      return;
    }

    // Clear existing options except the first one
    while (tripSelect.options.length > 1) {
      tripSelect.remove(1);
    }

    // Fetch trips from API
    const response = await fetch(`${BASE_URL}/api/trips/list`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
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
        trips.forEach((trip: any) => {
          const option = document.createElement("option");
          option.value = trip.id;
          option.textContent = trip.name;
          tripSelect.appendChild(option);
        });
      }
    } else {
      console.error("Failed to fetch trips:", response.status);

      // If token expired, clear storage and show login
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

// Event Listeners
loginBtn.addEventListener("click", () => {
  // Open NovaTrek login page
  chrome.tabs.create({ url: `${BASE_URL}/login?from=extension` });
  // Don't close the popup immediately - let it close naturally
});

saveBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.title) return;

  // Show loading state
  saveBtn.querySelector(".btn-text")!.classList.add("hidden");
  saveBtn.querySelector(".spinner")!.classList.remove("hidden");
  saveBtn.disabled = true;

  const saveData: SaveData = {
    url: tab.url,
    title: tab.title,
    notes: notesInput.value,
    tags: tagsInput.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    tripId: tripSelect.value || undefined,
  };

  try {
    await chrome.runtime.sendMessage({
      action: "save",
      data: saveData,
    });

    showSuccessView();
  } catch (error) {
    console.error("Save failed:", error);
    // Reset button
    saveBtn.querySelector(".btn-text")!.classList.remove("hidden");
    saveBtn.querySelector(".spinner")!.classList.add("hidden");
    saveBtn.disabled = false;
  }
});

quickSaveBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.title) return;

  await chrome.runtime.sendMessage({
    action: "save",
    data: {
      url: tab.url,
      title: tab.title,
    },
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
  // Reset form
  notesInput.value = "";
  tagsInput.value = "";
  tripSelect.value = "";

  showMainView();
  loadCurrentTab();
});

// Listen for auth token from content script
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "authTokenReceived" && request.token) {
    chrome.storage.local.set({
      authToken: request.token,
      userId: request.userId,
    });
    showMainView();
    loadCurrentTab();
    loadUserTrips();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.authToken) {
    init();
  }
});

// Re-check auth when popup becomes visible
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    init();
  }
});

// Initialize on load
init();
