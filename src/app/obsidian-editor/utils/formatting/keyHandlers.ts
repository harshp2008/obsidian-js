'use client';

import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { INDENT_UNIT, NBSP } from './indentationUtils';

/**
 * Handles backspace to delete an entire indent unit if applicable.
 * @param editorView - The CodeMirror editor view
 * @returns Whether the action was performed
 */
export const handleBackspaceIndent = (editorView: EditorView | null): boolean => {
  if (!editorView) return false;

  const { state } = editorView;
  const { selection } = state;

  // Only act if the selection is a cursor (empty) and not a range
  if (!selection.main.empty) {
    return false; // Let default backspace handle range deletion
  }

  const cursorPos = selection.main.anchor;
  // Check if there are enough characters before the cursor to form an INDENT_UNIT
  if (cursorPos < INDENT_UNIT.length) {
    return false;
  }

  const textBeforeCursor = state.doc.sliceString(cursorPos - INDENT_UNIT.length, cursorPos);

  if (textBeforeCursor === INDENT_UNIT) {
    editorView.dispatch({
      changes: {
        from: cursorPos - INDENT_UNIT.length,
        to: cursorPos,
        insert: '',
      },
      selection: EditorSelection.cursor(cursorPos - INDENT_UNIT.length),
      userEvent: 'delete.indent',
    });
    return true; // Backspace event handled
  }

  return false; // Default backspace behavior
};

/**
 * Handle Enter key for lists and blockquotes: if the line is only a list or blockquote marker, remove it and convert to a normal empty line.
 * @param editorView - The CodeMirror editor view
 * @returns Whether the action was performed
 */
export const handleEnterListBlockquote = (editorView: EditorView | null): boolean => {
  if (!editorView) return false;
  const { state } = editorView;
  const selection = state.selection.main;
  if (!selection.empty) return false; // Only handle single cursor

  const line = state.doc.lineAt(selection.from);
  const lineText = state.doc.sliceString(line.from, line.to);
  const cursorCol = selection.head - line.from;

  // --- Blockquote handling ---
  // 1. Check if line is a blockquote (has '>' markers)
  const bqFullMatch = lineText.match(/^(\s*)((?:>\s*)+)(.*?)$/);
  if (bqFullMatch) {
    const [, leading, markers, content] = bqFullMatch;
    
    if (!content.trim()) {
      // CASE 1: Empty blockquote line - reduce level
      let rest = lineText;
      // Remove one '>' and its following space
      rest = rest.replace(/^(\s*)>(\s*)/, (m, p1, p2) => p1);
      // If only whitespace remains, clear it
      if (/^\s+$/.test(rest)) {
        rest = '';
      }
      editorView.dispatch({
        changes: { from: line.from, to: line.to, insert: rest },
        selection: { anchor: line.from + rest.length },
        userEvent: 'delete.enter-blockquote',
      });
      return true;
    } else {
      // CASE 2: Blockquote line with content - create new line with same level
      // If cursor is not at the end, split the line
      if (cursorCol < lineText.length) {
        const beforeCursor = lineText.substring(0, cursorCol);
        const afterCursor = lineText.substring(cursorCol);
        
        editorView.dispatch({
          changes: {
            from: line.from,
            to: line.to,
            insert: beforeCursor + '\n' + leading + markers + afterCursor
          },
          selection: { 
            anchor: line.from + beforeCursor.length + 1 + leading.length + markers.length 
          },
          userEvent: 'input.enter'
        });
      } else {
        // Cursor at end - just add new line with same marker
        editorView.dispatch({
          changes: {
            from: line.to,
            to: line.to,
            insert: '\n' + leading + markers
          },
          selection: { 
            anchor: line.to + 1 + leading.length + markers.length 
          },
          userEvent: 'input.enter'
        });
      }
      return true;
    }
  }

  // --- List handling ---
  // 1. Check if line is a list item (has '- ', '* ', etc. or numbered '1. ' markers)
  const listFullMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s+(.*?)$/);
  if (listFullMatch) {
    const [, leading, marker, content] = listFullMatch;
    const markerWithSpace = marker + ' ';
    
    // Convert regular spaces to NBSP for proper atomic indentation
    const transformedLeading = leading.replace(/ {4}/g, INDENT_UNIT);
    
    if (!content.trim()) {
      // CASE 1: Empty list item - reduce level
      let rest = lineText;
      // Check for NBSP-based indents first, then regular spaces
      if (rest.includes(INDENT_UNIT)) {
        rest = rest.replace(INDENT_UNIT, '');
      } else if (/^ {4}/.test(rest)) {
        rest = rest.replace(/^ {4}/, '');
      } else {
        // Otherwise, remove the marker and any following space
        rest = rest.replace(/^(\s*)([-*+]|\d+\.)\s*/, '');
      }
      // If only whitespace remains, clear it
      if (/^\s+$/.test(rest)) {
        rest = '';
      }
      editorView.dispatch({
        changes: { from: line.from, to: line.to, insert: rest },
        selection: { anchor: line.from + rest.length },
        userEvent: 'delete.enter-list',
      });
      return true;
    } else {
      // CASE 2: List item with content - create new line with same level
      const nextMarker = /^\d+\./.test(marker) 
        ? (parseInt(marker) + 1) + '.' // Increment numbered list
        : marker; // Keep same marker for bullet lists
      
      // If cursor is not at the end, split the line
      if (cursorCol < lineText.length) {
        const beforeCursor = lineText.substring(0, cursorCol);
        const afterCursor = lineText.substring(cursorCol);
        
        editorView.dispatch({
          changes: {
            from: line.from,
            to: line.to,
            insert: beforeCursor + '\n' + transformedLeading + nextMarker + ' ' + afterCursor
          },
          selection: { 
            anchor: line.from + beforeCursor.length + 1 + transformedLeading.length + nextMarker.length + 1
          },
          userEvent: 'input.enter'
        });
      } else {
        // Cursor at end - just add new line with same marker
        editorView.dispatch({
          changes: {
            from: line.to,
            to: line.to,
            insert: '\n' + transformedLeading + nextMarker + ' '
          },
          selection: { 
            anchor: line.to + 1 + transformedLeading.length + nextMarker.length + 1
          },
          userEvent: 'input.enter'
        });
      }
      return true;
    }
  }

  // Let default behavior handle all other cases
  return false;
}; 