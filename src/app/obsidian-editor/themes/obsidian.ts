/**
 * @fileoverview Obsidian theme configuration
 * @module obsidian-editor/themes/obsidian
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * Base theme configuration for Obsidian-like styling
 */
export const obsidianTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    fontFamily: 'var(--font-mono), monospace',
    backgroundColor: 'var(--background-primary, #ffffff)',
    color: 'var(--text-normal, #2c2c2c)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono), monospace',
    caretColor: 'var(--cursor, #5a4c6d)',
    lineHeight: '1.6',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--cursor, #5a4c6d)',
    borderLeftWidth: '2px',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--active-line, rgba(0, 0, 0, 0.03))',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--active-line-gutter, rgba(0, 0, 0, 0.05))',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'var(--selection-bg, rgba(98, 87, 114, 0.15))',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--selection-bg, rgba(98, 87, 114, 0.15))',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--background-secondary, #f5f5f5)',
    color: 'var(--text-muted, #707070)',
    border: 'none',
    borderRight: '1px solid var(--border-color, #e2e2e2)',
    paddingRight: '8px',
  },
  '.cm-lineNumbers': {
    minWidth: '40px',
  },
  '.cm-line': {
    padding: '0 4px 0 8px',
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
 * Combined Obsidian syntax theme
 */
export const obsidianSyntaxTheme = syntaxHighlighting(obsidianHighlightStyle);

/**
 * Default exports for the Obsidian theme
 */
export default {
  theme: obsidianTheme,
  highlightStyle: obsidianHighlightStyle,
  syntaxTheme: obsidianSyntaxTheme,
}; 