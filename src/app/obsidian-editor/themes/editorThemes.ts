import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags, Tag } from '@lezer/highlight';
import { createLightThemeFromCssVars, createDarkThemeFromCssVars, createHighlightStyleFromCssVars } from './themeVariables';
import { vanillaLightTheme, vanillaDarkTheme, vanillaHighlightStyle } from './vanilla';

// Monkey patch the HighlightStyle to be more resilient to "tags is not iterable" errors
// We need to do this because some versions of the @lezer/highlight package have this issue
const originalDefine = HighlightStyle.define;
HighlightStyle.define = function(specs) {
  try {
    const style = originalDefine.call(this, specs);
    const originalStyleFn = style.style;
    
    // Create a safer version of the style function by wrapping it
    // We use Object.defineProperty to avoid issues with readonly properties
    Object.defineProperty(style, 'style', {
      value: function(tags: readonly Tag[]) {
        // Handle undefined or non-iterable tags
        if (!tags) return "";
        try {
          return originalStyleFn.call(this, tags);
        } catch (e) {
          console.warn("Error in highlight style:", e);
          return "";
        }
      },
      writable: false,
      configurable: true
    });
    
    return style;
  } catch (error) {
    console.error("Error creating HighlightStyle:", error);
    // Return an empty style as fallback
    return originalDefine.call(this, []);
  }
};

// Default themes
/**
 * Light theme configuration for CodeMirror editor
 * Uses CSS variables from lightThemeTemplate.css
 */
export const lightTheme = createLightThemeFromCssVars();

/**
 * Dark theme configuration for CodeMirror editor
 * Uses CSS variables from darkThemeTemplate.css
 */
export const darkTheme = createDarkThemeFromCssVars();

/**
 * Custom highlight style for markdown syntax
 * Uses CSS variables for colors
 */
export const customHighlightStyle = createHighlightStyleFromCssVars();

// Vanilla themes
/**
 * Vanilla light theme for CodeMirror editor
 * Uses CSS variables from vanilla/light.css
 */
export { vanillaLightTheme };

/**
 * Vanilla dark theme for CodeMirror editor
 * Uses CSS variables from vanilla/dark.css
 */
export { vanillaDarkTheme };

/**
 * Vanilla highlight style for markdown syntax
 * Uses CSS variables for colors from vanilla theme
 */
export { vanillaHighlightStyle };

// Theme registry for all available themes
export const themeRegistry = {
  default: {
    light: lightTheme,
    dark: darkTheme,
    highlight: customHighlightStyle
  },
  vanilla: {
    light: vanillaLightTheme,
    dark: vanillaDarkTheme,
    highlight: vanillaHighlightStyle
  }
}; 