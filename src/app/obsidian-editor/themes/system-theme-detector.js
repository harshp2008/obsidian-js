/**
 * @fileoverview Utility for detecting system-level dark mode preference
 * @module obsidian-editor/themes/system-theme-detector
 */

import { THEMES } from "../../../public/themes/index.js";

/**
 * MediaQueryList for detecting system dark mode preference
 * @type {MediaQueryList|null}
 */
let darkModeMediaQuery = null;

/**
 * Callbacks to run when system theme changes
 * @type {Array<Function>}
 */
const changeListeners = [];

/**
 * Initialize the system theme detector
 * @returns {boolean} Whether dark mode is preferred
 */
export function initSystemThemeDetector() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  try {
    // Modern browsers support addEventListener
    darkModeMediaQuery.addEventListener("change", handleSystemThemeChange);
  } catch (e) {
    try {
      // Older browsers support addListener
      darkModeMediaQuery.addListener(handleSystemThemeChange);
    } catch (error) {
      console.error("Could not add listener to media query:", error);
    }
  }

  return isDarkModePreferred();
}

/**
 * Clean up the system theme detector
 */
export function cleanupSystemThemeDetector() {
  if (!darkModeMediaQuery) return;

  try {
    darkModeMediaQuery.removeEventListener("change", handleSystemThemeChange);
  } catch (e) {
    try {
      darkModeMediaQuery.removeListener(handleSystemThemeChange);
    } catch (error) {
      console.error("Could not remove listener from media query:", error);
    }
  }
}

/**
 * Handle system theme change event
 * @param {MediaQueryListEvent} event - Media query change event
 * @private
 */
function handleSystemThemeChange(event) {
  const isDark = event.matches;
  notifyListeners(isDark);
}

/**
 * Check if dark mode is preferred by the system
 * @returns {boolean} True if dark mode is preferred
 */
export function isDarkModePreferred() {
  return darkModeMediaQuery ? darkModeMediaQuery.matches : false;
}

/**
 * Get the preferred theme based on system setting
 * @returns {string} Theme ID based on system preference
 */
export function getPreferredTheme() {
  return isDarkModePreferred() ? THEMES.VANILLA_DARK : THEMES.VANILLA_LIGHT;
}

/**
 * Add a listener for system theme changes
 * @param {Function} listener - Callback function that receives a boolean indicating dark mode
 * @returns {Function} Function to remove the listener
 */
export function addSystemThemeChangeListener(listener) {
  changeListeners.push(listener);

  // Return function to remove this listener
  return () => {
    const index = changeListeners.indexOf(listener);
    if (index > -1) {
      changeListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of a system theme change
 * @param {boolean} isDark - Whether dark mode is now preferred
 * @private
 */
function notifyListeners(isDark) {
  changeListeners.forEach((listener) => {
    try {
      listener(isDark);
    } catch (error) {
      console.error("Error in system theme change listener:", error);
    }
  });
}

// Initialize on import in browser environments
if (typeof window !== "undefined") {
  initSystemThemeDetector();
}
