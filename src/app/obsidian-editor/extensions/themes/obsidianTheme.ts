import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

/**
 * Creates an Obsidian-like theme for the editor
 * @returns {Extension} The theme extension
 */
export const obsidianTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-content': {
    padding: '1rem 0',
    minHeight: '100%',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-line': {
    padding: '0 1rem',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--background-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--text-selection)',
  },
  '.cm-cursor': {
    borderLeft: '2px solid var(--cursor-color, #3b82f6)',
  },
}); 