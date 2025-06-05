import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

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
 */
export const customHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.6em', fontWeight: 'bold' },
  { tag: tags.heading2, fontSize: '1.4em', fontWeight: 'bold' },
  { tag: tags.heading3, fontSize: '1.2em', fontWeight: 'bold' },
  { tag: tags.heading4, fontSize: '1.1em', fontWeight: 'bold' },
  { tag: tags.heading5, fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' },
  { tag: tags.heading6, fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
  { tag: tags.monospace, fontFamily: 'monospace', fontSize: '0.9em', color: '#10b981' },
]); 