/**
 * Activity tracker for user last active timestamps
 */

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { getCurrentUser } from "./auth";

let lastActivityUpdate = 0;
const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

/**
 * Update user's last active timestamp
 * Throttled to once every 5 minutes to avoid excessive writes
 */
export async function updateUserActivity() {
  try {
    const user = getCurrentUser();
    if (!user) return;

    const now = Date.now();

    // Only update if it's been more than 5 minutes since last update
    if (now - lastActivityUpdate < UPDATE_INTERVAL) {
      return;
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp(),
    });

    lastActivityUpdate = now;
  } catch (error) {
    console.error("Failed to update user activity:", error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Initialize activity tracking
 * Call this in your app's main layout or provider
 */
export function initActivityTracking() {
  // Update activity on page visibility change
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateUserActivity();
    }
  });

  // Update activity on user interaction
  const events = ["mousedown", "keydown", "scroll", "touchstart"];
  let interactionTimeout: NodeJS.Timeout;

  const handleInteraction = () => {
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
      updateUserActivity();
    }, 1000); // Debounce interactions
  };

  events.forEach((event) => {
    document.addEventListener(event, handleInteraction, { passive: true });
  });

  // Update on initial load
  updateUserActivity();
}
