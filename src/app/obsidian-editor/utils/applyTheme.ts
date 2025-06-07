import { EditorView, Extension } from '@codemirror/view';
import { themeRegistry } from '../themes/editorThemes';

// Define available themes
export type ThemeName = 'default' | 'vanilla';
export type ThemeMode = 'light' | 'dark';

// Interface for theme configuration
export interface ThemeConfig {
  name: ThemeName;
  mode: ThemeMode;
}

/**
 * Applies a theme to the editor
 * @param view The CodeMirror EditorView instance
 * @param config The theme configuration
 */
export function applyTheme(view: EditorView, config: ThemeConfig): void {
  const { name, mode } = config;
  
  // Get theme from registry
  const theme = themeRegistry[name] || themeRegistry.default;
  
  // Apply theme mode to document
  if (typeof document !== 'undefined') {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
  
  // Create extensions array
  const extensions: Extension[] = [];
  
  // Add theme extension
  if (mode === 'dark') {
    extensions.push(theme.dark);
  } else {
    extensions.push(theme.light);
  }
  
  // Add highlight style
  extensions.push(theme.highlight);
  
  // Apply extensions to view
  view.dispatch({
    effects: EditorView.reconfigure.of(extensions)
  });
}

/**
 * Helper function to load theme CSS
 * @param name The theme name
 */
export function loadThemeCSS(name: ThemeName): void {
  // Import theme CSS files
  if (typeof document !== 'undefined') {
    if (name === 'vanilla') {
      // Dynamically import vanilla theme CSS
      import('../themes/vanilla/light.css');
      import('../themes/vanilla/dark.css');
    } else {
      // Default theme CSS is loaded in the main app
    }
  }
} 