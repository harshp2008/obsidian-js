/**
 * @fileoverview Obsidian theme configuration
 * @module obsidian-editor/themes/obsidian
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * Base theme for the editor (UI elements)
 */
export const obsidianTheme = EditorView.theme({
  '&': {
    fontSize: '16px',
    height: '100%',
    fontFamily: 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',
    backgroundColor: 'var(--background-primary, #ffffff)',
    color: 'var(--text-normal, #2e3338)',
  },
  '.cm-content': {
    caretColor: 'var(--text-normal, #2e3338)',
    fontFamily: 'var(--font-mono, Menlo, SFMono-Regular, Consolas, "Liberation Mono", monospace)',
    padding: '10px 0',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--text-normal, #2e3338)',
    borderLeftWidth: '2px',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--background-primary-alt, rgba(0, 0, 0, 0.04))',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--background-primary, #ffffff)',
    color: 'var(--text-muted, #999)',
    border: 'none',
    borderRight: '1px solid var(--background-modifier-border, rgba(0, 0, 0, 0.1))',
  },
});

/**
 * UI theme styles
 */
export const obsidianEditorTheme = EditorView.theme({
  '.cm-line': {
    lineHeight: '1.6',
  },
  // Headers
  '.cm-header, .cm-header-1, .cm-header-2, .cm-header-3, .cm-header-4, .cm-header-5, .cm-header-6': {
    color: 'var(--text-title, #000000)',
    fontWeight: 'bold',
  },
  '.cm-header-1': { fontSize: '1.8em' },
  '.cm-header-2': { fontSize: '1.6em' },
  '.cm-header-3': { fontSize: '1.4em' },
  '.cm-header-4': { fontSize: '1.2em' },
  '.cm-header-5': { fontSize: '1.1em' },
  '.cm-header-6': { fontSize: '1.0em' },
  
  // Bold and italic
  '.cm-strong': {
    color: 'var(--text-strong, #000000)',
    fontWeight: 'bold',
  },
  '.cm-emphasis': {
    color: 'var(--text-emphasis, #000000)',
    fontStyle: 'italic',
  },
  
  // Links and URL
  '.cm-link, .cm-url': {
    color: 'var(--text-accent, #106ba3)',
    textDecoration: 'underline',
  },
  
  // Code blocks and inline code
  '.cm-inline-code, .cm-code': {
    color: 'var(--text-code, #eb5757)',
    fontFamily: 'var(--font-mono, Menlo, SFMono-Regular, Consolas, "Liberation Mono", monospace)',
    backgroundColor: 'var(--code-background, rgba(135, 131, 120, 0.15))',
    borderRadius: '3px',
    padding: '0 4px',
  },
  
  // Blockquotes
  '.cm-quote': {
    color: 'var(--text-quote, #108548)',
    fontStyle: 'italic',
    borderLeft: '4px solid var(--quote-border, rgba(16, 133, 72, 0.5))',
    paddingLeft: '16px',
    display: 'inline-block',
  },
  
  // Lists
  '.cm-list': {
    color: 'var(--text-normal, #2e3338)',
  },
  '.cm-list-bullet': {
    color: 'var(--text-bullet, #5a67d8)',
    fontWeight: 'bold',
  },
});

/**
 * Syntax highlighting styles for Obsidian-like markdown
 */
const obsidianHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: 'var(--heading-color, #42404d)', fontWeight: 'bold' },
  { tag: tags.emphasis, color: 'var(--emphasis-color, #2c2c2c)', fontStyle: 'italic' },
  { tag: tags.strong, color: 'var(--strong-color, #222222)', fontWeight: 'bold' },
  { tag: tags.link, color: 'var(--link-color, #625772)' },
  { tag: tags.url, color: 'var(--link-color, #625772)' },
  { tag: tags.keyword, color: '#9876AA' },
  { tag: tags.string, color: '#6A8759' },
  { tag: tags.comment, color: '#808080', fontStyle: 'italic' },
  { tag: tags.atom, color: 'var(--code-color, #625772)' },
  { tag: tags.meta, color: '#BBB529' },
  { tag: tags.name, color: '#A9B7C6' },
  { tag: tags.quote, color: 'var(--quote-color, #707070)' },
]);

/**
 * Combined syntax highlighting theme
 */
export const obsidianSyntaxTheme = syntaxHighlighting(obsidianHighlightStyle);

/**
 * Default exports for the Obsidian theme
 */
export default {
  theme: obsidianTheme,
  editorTheme: obsidianEditorTheme,
  highlightStyle: obsidianHighlightStyle,
  syntaxTheme: obsidianSyntaxTheme,
}; 