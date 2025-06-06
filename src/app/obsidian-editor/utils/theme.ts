/**
 * This file contains theme configurations for the CodeMirror editor.
 */
import { EditorView } from '@codemirror/view';

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
 * Toggle between light and dark themes
 */
export const toggleTheme = (): 'light' | 'dark' => {
  const currentTheme = getCurrentDocumentTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  // Save the new theme preference
  if (typeof window !== 'undefined') {
    localStorage.setItem('obsidian-theme', newTheme);
  }
  
  // Apply the new theme
  applyThemeVariables(newTheme);
  
  return newTheme;
};

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
  }
};

/**
 * Light theme for the editor
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
 * Dark theme for the editor
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

// Apply theme variables when this module is loaded in browser
if (typeof window !== 'undefined') {
  // Wait until after hydration is complete
  setTimeout(() => {
    const initialTheme = getCurrentDocumentTheme();
    applyThemeVariables(initialTheme);
    
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