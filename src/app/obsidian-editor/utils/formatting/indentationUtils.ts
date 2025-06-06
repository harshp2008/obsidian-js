'use client';

import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { isListItem } from './linkAndListFormatting';

/**
 * Non-breaking space character used for indentation
 */
export const NBSP = '\u00A0';

/**
 * Standard indentation unit (4 spaces)
 */
export const INDENT_UNIT = NBSP.repeat(4);

/**
 * Helper function to check if a line is a blockquote
 * @param lineText - The text of the line to check
 * @returns Whether the line contains a blockquote marker
 */
export const isBlockquote = (lineText: string): boolean => {
  return /^\s*>/.test(lineText);
};

/**
 * Helper to indent lists and blockquotes
 * @param editorView - The CodeMirror editor view
 * @param line - The line object
 * @returns Whether an indentation was performed
 */
const indentListOrBlockquote = (editorView: EditorView, line: {from: number, to: number, text: string}): boolean => {
  // For list items, we prepend 4 spaces to increase indentation level
  if (isListItem(line.text)) {
    editorView.dispatch({
      changes: {
        from: line.from,
        to: line.from,
        insert: '    ' // Four regular spaces for lists
      }
    });
    return true;
  }
  
  // For blockquotes, we add another '> ' marker to increase depth
  if (isBlockquote(line.text)) {
    // Find position after the existing blockquote marker(s)
    const existingMarker = line.text.match(/^(\s*(?:>\s*)+)/)?.[1] || '';
    editorView.dispatch({
      changes: {
        from: line.from + existingMarker.length,
        to: line.from + existingMarker.length,
        insert: '> '
      }
    });
    return true;
  }
  
  return false;
};

/**
 * Helper to unindent lists and blockquotes
 * @param editorView - The CodeMirror editor view
 * @param line - The line object
 * @returns Whether an unindentation was performed
 */
const unindentListOrBlockquote = (editorView: EditorView, line: {from: number, to: number, text: string}): boolean => {
  // For list items with leading spaces, remove 4 spaces
  if (isListItem(line.text) && /^\s{1,4}/.test(line.text)) {
    const spacesToRemove = Math.min(4, line.text.match(/^(\s*)/)[1].length);
    if (spacesToRemove > 0) {
      editorView.dispatch({
        changes: {
          from: line.from,
          to: line.from + spacesToRemove,
          insert: ''
        }
      });
      return true;
    }
  }
  
  // For blockquotes, remove one level of '> ' markers
  if (isBlockquote(line.text)) {
    // Find if there's more than one level of blockquote
    const match = line.text.match(/^(\s*)(?:>\s*){2,}/);
    if (match) {
      // Find the position of the last '> ' to remove
      const leadingSpaces = match[1] || '';
      const firstMarkerPos = line.from + leadingSpaces.length;
      const secondMarkerStart = firstMarkerPos + 2; // '> ' is 2 chars
      
      // Remove one '> ' marker
      editorView.dispatch({
        changes: {
          from: firstMarkerPos,
          to: secondMarkerStart,
          insert: ''
        }
      });
      return true;
    }
  }
  
  return false;
};

/**
 * Indent text using non-breaking spaces
 * @param editorView - The CodeMirror editor view
 * @returns Whether the action was performed
 */
export const indentText = (editorView: EditorView | null): boolean => {
  if (!editorView) return false;

  const { state } = editorView;
  let actionPerformed = false;
  
  try {
    // First check if we're dealing with list items or blockquotes in the current selection
    const selection = state.selection.main;
    const firstLine = state.doc.lineAt(selection.from);
    const lastLine = state.doc.lineAt(selection.to);
    
    // For single line selection, try to indent list or blockquote first
    if (firstLine.number === lastLine.number && 
        (isListItem(firstLine.text) || isBlockquote(firstLine.text))) {
      if (indentListOrBlockquote(editorView, firstLine)) {
        return true;
      }
    }
    // For multi-line selection, check each line for list items or blockquotes
    else if (firstLine.number !== lastLine.number) {
      let anyIndented = false;
      for (let i = firstLine.number; i <= lastLine.number; i++) {
        const line = state.doc.line(i);
        if (isListItem(line.text) || isBlockquote(line.text)) {
          if (indentListOrBlockquote(editorView, line)) {
            anyIndented = true;
          }
        }
      }
      if (anyIndented) {
        return true;
      }
    }
    
    // If we get here, proceed with normal indentation for non-list, non-blockquote text
    const changes = state.changeByRange(range => {
      // Default return value in case no changes are made
      const defaultReturn = { 
        range: EditorSelection.range(range.anchor, range.head),
        changes: []
      };
      
      const firstLine = state.doc.lineAt(range.from);
      const lastLine = state.doc.lineAt(range.to);
      const newChanges = [];

      let originalAnchor = range.anchor;
      let originalHead = range.head;
      let newAnchor = originalAnchor;
      let newHead = originalHead;
      
      let cumulativeCharsAddedBeforeAnchor = 0;
      let cumulativeCharsAddedBeforeHead = 0;

      for (let i = firstLine.number; i <= lastLine.number; i++) {
        const line = state.doc.line(i);
        
        // Skip list items and blockquotes which we handled above
        if (isListItem(line.text) || isBlockquote(line.text)) {
          continue;
        }
        
        // Allow indenting empty lines in certain cases
        if (line.length === 0) {
          if (i === firstLine.number && firstLine.number === lastLine.number) {
            // Allow indenting a single empty line
          } else {
            // Skip empty lines in multi-line selection
            continue;
          }
        }
        
        newChanges.push({ from: line.from, insert: INDENT_UNIT });
        actionPerformed = true;

        // Adjust selection:
        if (line.from <= originalAnchor) {
          cumulativeCharsAddedBeforeAnchor += INDENT_UNIT.length;
        }
        if (line.from <= originalHead) {
          cumulativeCharsAddedBeforeHead += INDENT_UNIT.length;
        }
      }
      
      if (!actionPerformed || newChanges.length === 0) {
        return defaultReturn;
      }

      newAnchor = originalAnchor + cumulativeCharsAddedBeforeAnchor;
      newHead = originalHead + cumulativeCharsAddedBeforeHead;

      return {
        changes: newChanges,
        range: EditorSelection.range(newAnchor, newHead)
      };
    });
    
    if (actionPerformed && changes && !changes.changes.empty) {
      editorView.dispatch({
        changes: changes.changes,
        selection: changes.selection,
        userEvent: 'indent'
      });
      editorView.focus();
      return true;
    }
  } catch (error) {
    console.error("Error in indentText:", error);
  }
  
  editorView.focus();
  return false;
};

/**
 * Unindent text by removing leading non-breaking spaces
 * @param editorView - The CodeMirror editor view
 * @returns Whether the action was performed
 */
export const unindentText = (editorView: EditorView | null): boolean => {
  if (!editorView) return false;

  const { state } = editorView;
  let actionPerformed = false;
  
  try {
    // First check if we're dealing with list items or blockquotes in the current selection
    const selection = state.selection.main;
    const firstLine = state.doc.lineAt(selection.from);
    const lastLine = state.doc.lineAt(selection.to);
    
    // For single line selection, try to unindent list or blockquote first
    if (firstLine.number === lastLine.number && 
        (isListItem(firstLine.text) || isBlockquote(firstLine.text))) {
      if (unindentListOrBlockquote(editorView, firstLine)) {
        return true;
      }
    }
    // For multi-line selection, check each line for list items or blockquotes
    else if (firstLine.number !== lastLine.number) {
      let anyUnindented = false;
      for (let i = firstLine.number; i <= lastLine.number; i++) {
        const line = state.doc.line(i);
        if (isListItem(line.text) || isBlockquote(line.text)) {
          if (unindentListOrBlockquote(editorView, line)) {
            anyUnindented = true;
          }
        }
      }
      if (anyUnindented) {
        return true;
      }
    }
    
    // If we get here, proceed with normal unindentation for non-list, non-blockquote text
    const changes = state.changeByRange(range => {
      // Default return value in case no changes are made
      const defaultReturn = { 
        range: EditorSelection.range(range.anchor, range.head),
        changes: []
      };
      
      const firstLine = state.doc.lineAt(range.from);
      const lastLine = state.doc.lineAt(range.to);
      const newChanges = [];

      let originalAnchor = range.anchor;
      let originalHead = range.head;
      let newAnchor = originalAnchor;
      let newHead = originalHead;

      let cumulativeCharsRemovedBeforeAnchor = 0;
      let cumulativeCharsRemovedBeforeHead = 0;

      for (let i = firstLine.number; i <= lastLine.number; i++) {
        const line = state.doc.line(i);
        if (isListItem(line.text) || isBlockquote(line.text)) {
          continue;
        }
        
        // Skip empty lines
        if (line.length === 0) {
          continue;
        }

        // Handle both NBSP and regular spaces
        let removedOnThisLine = 0;
        
        // Check for NBSP indentation first
        if (line.text.startsWith(INDENT_UNIT)) {
          removedOnThisLine = INDENT_UNIT.length;
          newChanges.push({ from: line.from, to: line.from + removedOnThisLine, insert: '' });
          actionPerformed = true;
        }
        // Try regular spaces (4 spaces)
        else if (line.text.startsWith('    ')) {
          removedOnThisLine = 4;
          newChanges.push({ from: line.from, to: line.from + removedOnThisLine, insert: '' });
          actionPerformed = true;
        }
        // Check for any leading spaces or NBSP characters
        else {
          let j = 0;
          while (j < line.text.length && (line.text[j] === ' ' || line.text[j] === NBSP)) {
            j++;
          }
          
          if (j > 0) {
            removedOnThisLine = j;
            newChanges.push({ from: line.from, to: line.from + removedOnThisLine, insert: '' });
            actionPerformed = true;
          }
        }

        if (removedOnThisLine > 0) {
          // Adjust selection positions based on what's removed
          if (line.from < originalAnchor) {
            cumulativeCharsRemovedBeforeAnchor += Math.min(removedOnThisLine, originalAnchor - line.from);
          }
          
          if (line.from < originalHead) {
            cumulativeCharsRemovedBeforeHead += Math.min(removedOnThisLine, originalHead - line.from);
          }
        }
      }
      
      if (!actionPerformed || newChanges.length === 0) {
        return defaultReturn;
      }

      newAnchor = Math.max(0, originalAnchor - cumulativeCharsRemovedBeforeAnchor);
      newHead = Math.max(0, originalHead - cumulativeCharsRemovedBeforeHead);

      // Ensure anchor and head don't cross if they were originally ordered
      if (originalAnchor <= originalHead && newAnchor > newHead) newHead = newAnchor;
      if (originalAnchor >= originalHead && newAnchor < newHead) newAnchor = newHead;

      return {
        changes: newChanges,
        range: EditorSelection.range(newAnchor, newHead)
      };
    });

    if (actionPerformed && changes && !changes.changes.empty) {
      editorView.dispatch({
          changes: changes.changes,
          selection: changes.selection,
          userEvent: 'unindent'
      });
      editorView.focus();
      return true;
    }
  } catch (error) {
    console.error("Error in unindentText:", error);
  }
  
  editorView.focus();
  return false;
}; 