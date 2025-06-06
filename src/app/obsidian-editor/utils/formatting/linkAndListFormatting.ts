'use client';

import { EditorView } from '@codemirror/view';

/**
 * Insert link formatting
 * @param editorView - The CodeMirror editor view
 */
export const insertLink = (editorView: EditorView | null): void => {
  if (!editorView) return;
  
  const selection = editorView.state.selection.main;
  if (selection.empty) {
    // Insert link placeholder
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '[link text](url)',
      },
      selection: { anchor: selection.from + 1, head: selection.from + 10 },
    });
  } else {
    // Make selected text the link text
    const selectedText = editorView.state.sliceDoc(selection.from, selection.to);
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `[${selectedText}](url)`,
      },
      selection: { anchor: selection.to + 2, head: selection.to + 5 },
    });
  }
  editorView.focus();
};

/**
 * Insert list formatting
 * @param editorView - The CodeMirror editor view
 * @param ordered - Whether to create an ordered (numbered) list
 */
export const insertList = (editorView: EditorView | null, ordered: boolean): void => {
  if (!editorView) return;
  
  const selection = editorView.state.selection.main;
  const line = editorView.state.doc.lineAt(selection.from);
  const prefix = ordered ? '1. ' : '- ';
  
  // Check if line already has a list marker
  const lineText = editorView.state.sliceDoc(line.from, line.to);
  const listMatch = lineText.match(/^([-*+]|\d+\.)\s/);
  
  if (!listMatch) {
    // Add list marker
    editorView.dispatch({
      changes: {
        from: line.from,
        to: line.from,
        insert: prefix,
      },
    });
  }
  editorView.focus();
};

/**
 * Checks if a line is a list item
 * @param lineText - The text of the line to check
 * @returns Whether the line is a list item
 */
export const isListItem = (lineText: string): boolean => {
  return /^\s*([-*+]|\d+\.)\s/.test(lineText);
}; 