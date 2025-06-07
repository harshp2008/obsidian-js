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
  
  console.log(`Applying theme: ${name} in ${mode} mode`);
  
  // Get theme from registry
  const theme = themeRegistry[name] || themeRegistry.default;
  
  // Apply theme mode to document
  if (typeof document !== 'undefined') {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', `${name}-dark`);
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', `${name}-light`);
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
  // Load theme CSS files
  if (typeof document !== 'undefined') {
    // Remove any existing theme CSS
    const existingLinks = document.querySelectorAll('link[data-theme-css]');
    existingLinks.forEach(link => link.remove());
    
    if (name === 'vanilla') {
      // Create link elements for vanilla theme CSS
      const lightCSS = document.createElement('link');
      lightCSS.rel = 'stylesheet';
      lightCSS.href = '/css/vanilla-light.css'; // These files should be in the public/css directory
      lightCSS.setAttribute('data-theme-css', 'vanilla-light');
      document.head.appendChild(lightCSS);
      
      const darkCSS = document.createElement('link');
      darkCSS.rel = 'stylesheet';
      darkCSS.href = '/css/vanilla-dark.css'; // These files should be in the public/css directory
      darkCSS.setAttribute('data-theme-css', 'vanilla-dark');
      document.head.appendChild(darkCSS);
      
      console.log('Loaded vanilla theme CSS');
    } else {
      // Default theme CSS is loaded in the main app
    }
  }
} 