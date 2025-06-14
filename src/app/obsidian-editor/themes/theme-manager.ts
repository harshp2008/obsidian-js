/**
 * @fileoverview Manages theme preferences and application
 * @module obsidian-editor/themes/theme-manager
 */

import { THEMES } from "../../../public/themes/index.js";
import {
  initSystemThemeDetector,
  cleanupSystemThemeDetector,
  getPreferredTheme,
  addSystemThemeChangeListener,
} from "./system-theme-detector.js";

/**
 * Theme preference storage key
 */
const THEME_PREFERENCE_KEY = "obsidian-editor-theme-preference";

/**
 * Theme manager class for handling theme preferences and application
 */
export class ThemeManager {
  private currentTheme: string;
  private systemThemeListener: (() => void) | null = null;

  constructor() {
    this.currentTheme = this.loadThemePreference();
    this.applyTheme(this.currentTheme);
    this.setupSystemThemeListener();
  }

  /**
   * Load theme preference from storage
   * @returns {string} Theme ID
   * @private
   */
  private loadThemePreference(): string {
    if (typeof window === "undefined") return THEMES.VANILLA_LIGHT;

    const savedTheme = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      return savedTheme;
    }

    return getPreferredTheme();
  }

  /**
   * Save theme preference to storage
   * @param {string} theme - Theme ID to save
   * @private
   */
  private saveThemePreference(theme: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(THEME_PREFERENCE_KEY, theme);
  }

  /**
   * Apply a theme to the document
   * @param {string} theme - Theme ID to apply
   * @private
   */
  private applyTheme(theme: string): void {
    if (typeof document === "undefined") return;

    // Remove all existing theme classes
    Object.values(THEMES).forEach((themeId) => {
      document.documentElement.classList.remove(`theme-${themeId}`);
    });

    // Add new theme class
    document.documentElement.classList.add(`theme-${theme}`);
  }

  /**
   * Set up listener for system theme changes
   * @private
   */
  private setupSystemThemeListener(): void {
    if (typeof window === "undefined") return;

    this.systemThemeListener = addSystemThemeChangeListener((isDark) => {
      if (this.currentTheme === THEMES.SYSTEM) {
        const newTheme = isDark ? THEMES.VANILLA_DARK : THEMES.VANILLA_LIGHT;
        this.applyTheme(newTheme);
      }
    });
  }

  /**
   * Get the current theme
   * @returns {string} Current theme ID
   */
  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Set a new theme
   * @param {string} theme - Theme ID to set
   */
  public setTheme(theme: string): void {
    if (!Object.values(THEMES).includes(theme)) {
      console.error(`Invalid theme: ${theme}`);
      return;
    }

    this.currentTheme = theme;
    this.saveThemePreference(theme);

    if (theme === THEMES.SYSTEM) {
      const systemTheme = getPreferredTheme();
      this.applyTheme(systemTheme);
    } else {
      this.applyTheme(theme);
    }
  }

  /**
   * Clean up theme manager resources
   */
  public cleanup(): void {
    if (this.systemThemeListener) {
      this.systemThemeListener();
      this.systemThemeListener = null;
    }
    cleanupSystemThemeDetector();
  }
}

// Initialize theme manager
if (typeof window !== "undefined") {
  initSystemThemeDetector();
}

// Export singleton instance
export const themeManager = new ThemeManager(); 