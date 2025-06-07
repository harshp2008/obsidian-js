/**
 * @fileoverview Custom React hook for accessing and managing themes
 * @module obsidian-editor/themes/useTheme
 */

import { useState, useEffect } from "react";
import themeManager, { THEME_PREFERENCES } from "./theme-manager";

/**
 * React hook for accessing and changing the current theme
 *
 * @returns {Object} Theme hook state and functions
 * @property {string} currentTheme - The ID of the current theme
 * @property {string} themePreference - The current theme preference (light, dark, system)
 * @property {Function} setTheme - Function to change the current theme
 * @property {Function} setThemePreference - Function to change the theme preference
 * @property {Array<Object>} availableThemes - Array of available theme objects
 * @property {Array<Object>} lightThemes - Array of available light themes
 * @property {Array<Object>} darkThemes - Array of available dark themes
 * @property {boolean} isDarkTheme - Whether the current theme is a dark theme
 * @property {boolean} isSystemPreference - Whether the system preference is being used
 */
function useTheme() {
  const [currentTheme, setCurrentTheme] = useState(
    themeManager.getCurrentTheme()
  );
  const [themePreference, setThemePreferenceState] = useState(
    themeManager.getThemePreference()
  );
  const [availableThemes, setAvailableThemes] = useState([]);

  useEffect(() => {
    // Initialize if not already initialized
    if (!currentTheme) {
      const initialTheme = themeManager.initialize();
      setCurrentTheme(initialTheme);
      setThemePreferenceState(themeManager.getThemePreference());
    }

    setAvailableThemes(themeManager.getAllThemes());

    // Listen for theme changes
    const removeListener = themeManager.addThemeChangeListener((themeId) => {
      setCurrentTheme(themeId);
    });

    // Cleanup listener on unmount
    return removeListener;
  }, []);

  /**
   * Change the current theme
   * @param {string} themeId - The ID of the theme to apply
   * @returns {boolean} True if theme was applied successfully
   */
  const setTheme = (themeId) => {
    const success = themeManager.applyTheme(themeId);

    // Update preference based on selection if successful
    if (success) {
      const theme = availableThemes.find((t) => t.id === themeId);
      if (theme) {
        const newPreference = theme.isDark
          ? THEME_PREFERENCES.DARK
          : THEME_PREFERENCES.LIGHT;
        themeManager.setThemePreference(newPreference);
        setThemePreferenceState(newPreference);
      }
    }

    return success;
  };

  /**
   * Change the theme preference
   * @param {string} preference - The preference from THEME_PREFERENCES
   * @returns {boolean} True if preference was set successfully
   */
  const setThemePreference = (preference) => {
    const success = themeManager.setThemePreference(preference);
    if (success) {
      setThemePreferenceState(preference);
    }
    return success;
  };

  /**
   * Check if the current theme is a dark theme
   * @returns {boolean} True if the current theme is dark
   */
  const isDarkTheme = () => {
    const theme = availableThemes.find((t) => t.id === currentTheme);
    return theme ? theme.isDark : false;
  };

  /**
   * Check if the current theme preference is system
   * @returns {boolean} True if using system preference
   */
  const isSystemPreference = () => {
    return themePreference === THEME_PREFERENCES.SYSTEM;
  };

  // Filter themes by light/dark
  const lightThemes = availableThemes.filter((theme) => !theme.isDark);
  const darkThemes = availableThemes.filter((theme) => theme.isDark);

  return {
    currentTheme,
    themePreference,
    setTheme,
    setThemePreference,
    availableThemes,
    lightThemes,
    darkThemes,
    isDarkTheme: isDarkTheme(),
    isSystemPreference: isSystemPreference(),
  };
}

export default useTheme;
