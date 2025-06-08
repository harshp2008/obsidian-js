/**
 * @fileoverview Theme utilities for the editor
 * @module obsidian-editor/utils/theme
 */

/**
 * This file contains theme configurations for the CodeMirror editor.
 */
import { EditorView } from '@codemirror/view';
import { vanillaLightTheme, vanillaDarkTheme } from '../themes/vanilla';
import { loadThemeCSS } from './applyTheme';

/**
 * Editor theme names
 */
export type EditorThemeName = 'vanilla';

/**
 * Theme storage key
 */
const THEME_STORAGE_KEY = 'obsidian-editor-theme';

/**
 * Get the current document theme (light/dark) based on system preferences
 */
export const getCurrentDocumentTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    // First check for explicitly set theme in localStorage
    const storedTheme = localStorage.getItem('obsidian-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

/**
 * Get the current editor theme
 * 
 * @returns {EditorThemeName} The current theme name
 */
export function getCurrentEditorTheme(): EditorThemeName {
  if (typeof window === 'undefined') return 'vanilla'; // Default for SSR
  
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return (savedTheme as EditorThemeName) || 'vanilla';
}

/**
 * Set the editor theme
 * 
 * @param {EditorThemeName} theme - The theme to set
 */
export function setEditorTheme(theme: EditorThemeName): void {
  if (typeof window === 'undefined') return; // Skip for SSR
  
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  
  // Apply theme to document
  const isDarkMode = document.documentElement.classList.contains('dark');
  const themeClass = isDarkMode ? `${theme}-dark` : `${theme}-light`;
  document.documentElement.setAttribute('data-theme', themeClass);
}

/**
 * Check if the current theme is dark mode
 * 
 * @returns {boolean} True if in dark mode
 */
export function isEditorDarkMode(): boolean {
  if (typeof window === 'undefined') return false; // Default for SSR
  
  return document.documentElement.classList.contains('dark');
}

/**
 * Toggle the editor theme between light and dark
 */
export function toggleEditorTheme(): void {
  if (typeof window === 'undefined') return; // Skip for SSR
  
  const currentTheme = getCurrentEditorTheme();
  const isDark = document.documentElement.classList.contains('dark');
  
  // Toggle dark mode class
  document.documentElement.classList.toggle('dark');
  
  // Update theme attribute
  const newMode = !isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', `${currentTheme}-${newMode}`);
}

/**
 * Define CSS variables for Obsidian-like styling
 */
const obsidianCssVariables = {
  light: {
    '--background-primary': '#ffffff',
    '--background-secondary': '#f8f8f8',
    '--text-normal': '#2e3338',
    '--text-muted': '#888888',
    '--text-faint': '#999999',
    '--text-error': '#e75545',
    '--text-accent': '#705dcf',
    '--interactive-normal': '#f2f3f5',
    '--interactive-hover': '#e9e9e9',
    '--interactive-accent': '#7b6cd9',
    '--interactive-accent-hover': '#8875ff',
    '--link-color': '#5E81AC',
    '--hr-color': '#dcddde',
    '--tag-color': '#2991e3',
    '--selection-background': 'rgba(104, 134, 197, 0.3)',
    '--code-background': 'rgba(0, 0, 0, 0.03)'
  },
  dark: {
    '--background-primary': '#2b2b2b',
    '--background-secondary': '#363636',
    '--text-normal': '#dcddde',
    '--text-muted': '#999999',
    '--text-faint': '#666666',
    '--text-error': '#ff3333',
    '--text-accent': '#a277ff',
    '--interactive-normal': '#3f3f3f',
    '--interactive-hover': '#4a4a4a',
    '--interactive-accent': '#7b6cd9',
    '--interactive-accent-hover': '#8875ff',
    '--link-color': '#a8c0e0',
    '--hr-color': '#444444',
    '--tag-color': '#4097e3',
    '--selection-background': 'rgba(104, 134, 197, 0.2)',
    '--code-background': 'rgba(255, 255, 255, 0.05)'
  }
};

/**
 * Apply CSS variables to the document
 * @param theme - The theme to apply ('light' or 'dark')
 */
const applyThemeVariables = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    const variables = obsidianCssVariables[theme];
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
};

/**
 * Light theme for the editor (Obsidian default)
 */
export const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--background-primary, #ffffff)',
    color: 'var(--text-normal, #2e3338)'
  },
  '.cm-content': {
    caretColor: 'var(--text-normal, #2e3338)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--text-normal, #2e3338)'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--selection-background, rgba(104, 134, 197, 0.3))'
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--background-secondary, #f5f6f8)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--background-secondary, #f5f6f8)'
  },
}, { dark: false });

/**
 * Dark theme for the editor (Obsidian default)
 */
export const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--background-primary, #202020)',
    color: 'var(--text-normal, #dcddde)'
  },
  '.cm-content': {
    caretColor: 'var(--text-normal, #dcddde)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--text-normal, #dcddde)'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--selection-background, rgba(104, 134, 197, 0.2))'
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--background-secondary, #161616)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--background-secondary, #161616)'
  },
}, { dark: true });

// Re-export vanilla themes for easier access
export { vanillaLightTheme, vanillaDarkTheme };

// Get the appropriate theme based on theme name and mode
export const getTheme = (themeName: EditorThemeName, mode: 'light' | 'dark'): EditorView.Theme => {
  if (themeName === 'vanilla') {
    return mode === 'dark' ? vanillaDarkTheme : vanillaLightTheme;
  } else {
    return mode === 'dark' ? darkTheme : lightTheme;
  }
};

// Apply theme variables when this module is loaded in browser
if (typeof window !== 'undefined') {
  // Wait until after hydration is complete
  setTimeout(() => {
    const initialTheme = getCurrentDocumentTheme();
    applyThemeVariables(initialTheme);
    
    // Load theme CSS based on current editor theme
    const editorTheme = getCurrentEditorTheme();
    loadThemeCSS(editorTheme === 'vanilla' ? 'vanilla' : 'default');
    
    // Listen for theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          // Only update if no explicit theme is set in localStorage
          if (!localStorage.getItem('obsidian-theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyThemeVariables(newTheme);
          }
        });
    }
  }, 0);
} 