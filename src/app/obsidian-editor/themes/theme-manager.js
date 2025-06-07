/**
 * @fileoverview Theme manager for the Obsidian editor
 * @module obsidian-editor/themes/theme-manager
 */

import {
  THEMES,
  getAllThemes,
  getThemeById,
} from "../../../public/themes/index.js";
import {
  getPreferredTheme,
  addSystemThemeChangeListener,
} from "./system-theme-detector";

/**
 * Theme preference options
 * @enum {string}
 */
export const THEME_PREFERENCES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

/**
 * Storage keys for theme preferences
 * @type {Object}
 */
const STORAGE_KEYS = {
  THEME_ID: "obsidian-theme",
  THEME_PREFERENCE: "obsidian-theme-preference",
};

/**
 * Default theme to use if none is selected
 * @type {string}
 */
const DEFAULT_THEME = THEMES.VANILLA_LIGHT;

/**
 * ThemeManager class for handling theme operations
 */
class ThemeManager {
  /**
   * Create a new ThemeManager instance
   */
  constructor() {
    this.currentTheme = null;
    this.themePreference = THEME_PREFERENCES.LIGHT;
    this.themeChangeListeners = [];
    this.systemThemeRemoveListener = null;
  }

  /**
   * Initialize the theme manager
   * @returns {string} The current theme ID
   */
  initialize() {
    // Get saved preferences
    const savedThemePreference = localStorage.getItem(
      STORAGE_KEYS.THEME_PREFERENCE
    );
    const savedThemeId = localStorage.getItem(STORAGE_KEYS.THEME_ID);

    // Set theme preference
    this.themePreference = savedThemePreference || THEME_PREFERENCES.SYSTEM;

    // Determine theme to apply
    let themeToApply;

    if (this.themePreference === THEME_PREFERENCES.SYSTEM) {
      themeToApply = getPreferredTheme();
      // Listen for system theme changes
      this.setupSystemThemeListener();
    } else {
      themeToApply = savedThemeId || DEFAULT_THEME;
    }

    this.applyTheme(themeToApply);
    return themeToApply;
  }

  /**
   * Set up listener for system theme changes
   * @private
   */
  setupSystemThemeListener() {
    // Clean up existing listener if any
    if (this.systemThemeRemoveListener) {
      this.systemThemeRemoveListener();
    }

    // Add new listener
    this.systemThemeRemoveListener = addSystemThemeChangeListener((isDark) => {
      if (this.themePreference === THEME_PREFERENCES.SYSTEM) {
        this.applyTheme(isDark ? THEMES.VANILLA_DARK : THEMES.VANILLA_LIGHT);
      }
    });
  }

  /**
   * Apply a theme to the document
   * @param {string} themeId - The ID of the theme to apply
   * @returns {boolean} True if theme was applied successfully, false otherwise
   */
  applyTheme(themeId) {
    const theme = getThemeById(themeId);

    if (!theme) {
      console.error(`Theme '${themeId}' not found`);
      return false;
    }

    // Remove any existing theme links
    const existingThemeLinks = document.querySelectorAll(
      "link[data-theme-link]"
    );
    existingThemeLinks.forEach((link) => link.remove());

    // Create a new link element for the theme
    const linkElement = document.createElement("link");
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("href", theme.path);
    linkElement.setAttribute("data-theme-link", theme.id);
    document.head.appendChild(linkElement);

    // Set the theme attribute on the html element
    document.documentElement.setAttribute("data-theme", theme.id);

    // Save the theme preference
    localStorage.setItem(STORAGE_KEYS.THEME_ID, theme.id);

    // Update current theme and notify listeners
    this.currentTheme = theme.id;
    this.notifyThemeChange(theme.id);

    return true;
  }

  /**
   * Set the theme preference (light, dark, or system)
   * @param {string} preference - The preference from THEME_PREFERENCES
   * @returns {boolean} True if preference was set successfully
   */
  setThemePreference(preference) {
    if (!Object.values(THEME_PREFERENCES).includes(preference)) {
      console.error(`Invalid theme preference: ${preference}`);
      return false;
    }

    this.themePreference = preference;
    localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, preference);

    if (preference === THEME_PREFERENCES.SYSTEM) {
      this.setupSystemThemeListener();
      this.applyTheme(getPreferredTheme());
    }

    return true;
  }

  /**
   * Get the current theme preference
   * @returns {string} The current theme preference
   */
  getThemePreference() {
    return this.themePreference;
  }

  /**
   * Get the current theme ID
   * @returns {string} The current theme ID
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   * @returns {Array<Object>} Array of theme metadata objects
   */
  getAllThemes() {
    return getAllThemes();
  }

  /**
   * Add a listener for theme changes
   * @param {Function} listener - Callback function that receives the new theme ID
   * @returns {Function} Function to remove the listener
   */
  addThemeChangeListener(listener) {
    this.themeChangeListeners.push(listener);

    // Return function to remove this listener
    return () => {
      this.themeChangeListeners = this.themeChangeListeners.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * Notify all listeners of a theme change
   * @param {string} themeId - The new theme ID
   * @private
   */
  notifyThemeChange(themeId) {
    this.themeChangeListeners.forEach((listener) => {
      try {
        listener(themeId);
      } catch (error) {
        console.error("Error in theme change listener:", error);
      }
    });
  }

  /**
   * Clean up resources when the theme manager is no longer needed
   */
  cleanup() {
    if (this.systemThemeRemoveListener) {
      this.systemThemeRemoveListener();
      this.systemThemeRemoveListener = null;
    }
  }
}

// Create and export a singleton instance
const themeManager = new ThemeManager();

export default themeManager;
