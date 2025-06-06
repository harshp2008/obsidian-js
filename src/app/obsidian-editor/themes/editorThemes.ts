import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

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
      value: function(tags) {
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

/**
 * Light theme configuration for CodeMirror editor
 */
export const lightTheme = EditorView.theme({
  '&': { color: '#1a1a1a', backgroundColor: '#ffffff' },
  '.cm-content': { caretColor: '#000000' },
  '.cm-gutters': { backgroundColor: '#f8f9fa', color: '#6c757d', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  '.cm-selectionBackground': { backgroundColor: '#b3d7ff' },
  '.cm-line': { padding: '0 4px' },
  '.cm-cursor': { borderLeftWidth: '2px', borderLeftColor: '#3b82f6' },
}, { dark: false });

/**
 * Dark theme configuration for CodeMirror editor
 */
export const darkTheme = EditorView.theme({
  '&': { color: '#e0e0e0', backgroundColor: '#1e1e1e' },
  '.cm-content': { caretColor: '#ffffff' },
  '.cm-gutters': { backgroundColor: '#252525', color: '#858585', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  '.cm-selectionBackground': { backgroundColor: '#3a4b6d' },
  '.cm-line': { padding: '0 4px' },
  '.cm-cursor': { borderLeftWidth: '2px', borderLeftColor: '#3b82f6' },
}, { dark: true });

/**
 * Custom highlight style for markdown syntax
 * Using a try-catch block to handle potential issues with tags
 */
export const customHighlightStyle = (() => {
  try {
    // Check if tags is defined and iterable
    if (!tags || typeof tags !== 'object') {
      console.warn('Tags not available for highlight style');
      return HighlightStyle.define([]);
    }
    
    const styles = [];
    
    // Only add styles for tags that exist
    if (tags.heading1) styles.push({ tag: tags.heading1, fontSize: '1.6em', fontWeight: 'bold' });
    if (tags.heading2) styles.push({ tag: tags.heading2, fontSize: '1.4em', fontWeight: 'bold' });
    if (tags.heading3) styles.push({ tag: tags.heading3, fontSize: '1.2em', fontWeight: 'bold' });
    if (tags.heading4) styles.push({ tag: tags.heading4, fontSize: '1.1em', fontWeight: 'bold' });
    if (tags.heading5) styles.push({ tag: tags.heading5, fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' });
    if (tags.heading6) styles.push({ tag: tags.heading6, fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' });
    if (tags.strong) styles.push({ tag: tags.strong, fontWeight: 'bold' });
    if (tags.emphasis) styles.push({ tag: tags.emphasis, fontStyle: 'italic' });
    if (tags.link) styles.push({ tag: tags.link, color: '#2563eb', textDecoration: 'underline' });
    if (tags.monospace) styles.push({ tag: tags.monospace, fontFamily: 'monospace', fontSize: '0.9em', color: '#10b981' });
    
    return HighlightStyle.define(styles);
  } catch (error) {
    console.error('Error creating highlight style:', error);
    return HighlightStyle.define([]);
  }
})(); 