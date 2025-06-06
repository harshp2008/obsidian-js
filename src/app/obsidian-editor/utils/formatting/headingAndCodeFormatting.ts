'use client';

import { EditorView } from '@codemirror/view';

/**
 * Insert heading of specified level
 * @param editorView - The CodeMirror editor view
 * @param level - Heading level (1-6)
 */
export const insertHeading = (editorView: EditorView | null, level: number): void => {
  if (!editorView) return;
  
  const selection = editorView.state.selection.main;
  const line = editorView.state.doc.lineAt(selection.from);
  const prefix = '#'.repeat(level) + ' ';
  
  // Check if line already has a heading
  const lineText = editorView.state.sliceDoc(line.from, line.to);
  const headingMatch = lineText.match(/^(#{1,6})\s/);
  
  if (headingMatch) {
    // Replace existing heading
    editorView.dispatch({
      changes: {
        from: line.from,
        to: line.from + headingMatch[0].length,
        insert: prefix,
      },
    });
  } else {
    // Add new heading
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
 * Insert code formatting
 * @param editorView - The CodeMirror editor view
 */
export const insertCode = (editorView: EditorView | null): void => {
  if (!editorView) return;
  
  const selection = editorView.state.selection.main;
  if (selection.empty) {
    // Insert code placeholder
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '`code`',
      },
      selection: { anchor: selection.from + 1, head: selection.from + 5 },
    });
  } else {
    // Make selected text code
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `\`${editorView.state.sliceDoc(selection.from, selection.to)}\``,
      },
      selection: { anchor: selection.from + 1, head: selection.to + 1 },
    });
  }
  editorView.focus();
}; 