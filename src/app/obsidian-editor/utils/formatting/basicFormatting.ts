'use client';

import { EditorView } from '@codemirror/view';

/**
 * Insert bold formatting
 * @param editorView - The CodeMirror editor view
 */
export const insertBold = (editorView: EditorView | null): void => {
  if (!editorView) return;
  
  const selection = editorView.state.selection.main;
  if (selection.empty) {
    // Insert bold placeholder
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '**bold text**',
      },
      selection: { anchor: selection.from + 2, head: selection.from + 11 },
    });
  } else {
    // Make selected text bold
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `**${editorView.state.sliceDoc(selection.from, selection.to)}**`,
      },
      selection: { anchor: selection.from + 2, head: selection.to + 2 },
    });
  }
  editorView.focus();
};

/**
 * Insert italic formatting
 * @param editorView - The CodeMirror editor view
 */
export const insertItalic = (editorView: EditorView | null): void => {
  if (!editorView) return;
  
  const selection = editorView.state.selection.main;
  if (selection.empty) {
    // Insert italic placeholder
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '*italic text*',
      },
      selection: { anchor: selection.from + 1, head: selection.from + 12 },
    });
  } else {
    // Make selected text italic
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `*${editorView.state.sliceDoc(selection.from, selection.to)}*`,
      },
      selection: { anchor: selection.from + 1, head: selection.to + 1 },
    });
  }
  editorView.focus();
}; 