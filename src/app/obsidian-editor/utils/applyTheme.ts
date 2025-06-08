import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { themeRegistry } from '../themes/editorThemes';
import { EditorThemeName } from './theme';

// Define available themes
export type ThemeMode = 'light' | 'dark';

// Interface for theme configuration
export interface ThemeConfig {
  name: EditorThemeName;
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
  const registryName = name as keyof typeof themeRegistry;
  const theme = themeRegistry[registryName] || themeRegistry.default;
  
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
  
  // In a real implementation, we would apply the theme to CodeMirror
  // But for now, we'll just log what would happen
  console.log(`Would apply ${mode} theme to editor`, theme);
} 