/**
 * @fileoverview React hook for theme management
 * @module obsidian-editor/themes/useTheme
 */

import { useState, useEffect } from "react";
import { THEMES } from "../../../public/themes/index.js";
import { themeManager } from "./theme-manager.js";

/**
 * Hook for managing theme state
 * @returns {Object} Theme state and controls
 */
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<string>(themeManager.getCurrentTheme());

  useEffect(() => {
    // Update state when theme changes
    const handleThemeChange = () => {
      setCurrentTheme(themeManager.getCurrentTheme());
    };

    // Initial theme setup
    handleThemeChange();

    // Cleanup on unmount
    return () => {
      themeManager.cleanup();
    };
  }, []);

  /**
   * Change the current theme
   * @param {string} theme - Theme ID to set
   */
  const changeTheme = (theme: string) => {
    if (!Object.values(THEMES).includes(theme)) {
      console.error(`Invalid theme: ${theme}`);
      return;
    }
    themeManager.setTheme(theme);
    setCurrentTheme(theme);
  };

  return {
    currentTheme,
    changeTheme,
    themes: THEMES,
  };
} 