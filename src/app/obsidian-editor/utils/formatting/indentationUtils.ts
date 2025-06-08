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
export const INDENT_UNIT = '    '; // Exactly 4 spaces

/**
 * Helper function to check if a line is a blockquote
 * @param lineText - The text of the line to check
 * @returns Whether the line contains a blockquote marker
 */
export const isBlockquote = (lineText: string): boolean => {
  // Look for '>' character with optional leading spaces
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
    // Add indentation at the start of the line - ensure it's exactly 4 spaces
    editorView.dispatch({
      changes: {
        from: line.from,
        to: line.from,
        insert: INDENT_UNIT // Exactly four spaces for lists
      },
      userEvent: 'indent'
    });
    
    console.log('List indent applied: 4 spaces added');
    return true;
  }
  
  // For blockquotes, we add another '> ' marker to increase depth
  if (isBlockquote(line.text)) {
    // Create a proper blockquote marker
    const blockquotePrefix = '> ';
    
    // Find the leading spaces and blockquote markers
    const blockquoteMatch = line.text.match(/^(\s*)((?:>\s*)+)(.*)/);
    if (blockquoteMatch) {
      const leadingSpaces = blockquoteMatch[1] || '';

      // Add the marker at the beginning of the existing blockquote markers
      editorView.dispatch({
        changes: {
          from: line.from + leadingSpaces.length,
          to: line.from + leadingSpaces.length,
          insert: blockquotePrefix
        },
        userEvent: 'indent'
      });
      
      console.log('Blockquote indent applied: > marker added');
      return true;
    } else {
      // If the regex didn't match but isBlockquote returned true, use simpler approach
      const simpleMatch = line.text.match(/^(\s*)>(.*)/);
      if (simpleMatch) {
        const leadingSpaces = simpleMatch[1] || '';
        
        editorView.dispatch({
          changes: {
            from: line.from + leadingSpaces.length, 
            to: line.from + leadingSpaces.length,
            insert: blockquotePrefix
          },
          userEvent: 'indent'
        });
        
        console.log('Simple blockquote indent applied');
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Helper to unindent lists and blockquotes
 * @param editorView - The CodeMirror editor view
 * @param line - The line object
 * @returns Whether an unindentation was performed
 */
export const unindentListOrBlockquote = (editorView: EditorView, line: {from: number, to: number, text: string}): boolean => {
  // For list items with leading spaces, remove exactly 4 spaces
  if (isListItem(line.text)) {
    const match = line.text.match(/^(\s*)/);
    if (!match) return false;
    
    // Always try to remove exactly 4 spaces for consistency
    const leadingSpaces = match[1];
    
    // If we have at least 4 spaces, remove exactly 4
    if (leadingSpaces.length >= 4) {
      editorView.dispatch({
        changes: {
          from: line.from,
          to: line.from + 4, // Always remove exactly 4 spaces
          insert: ''
        },
        userEvent: 'unindent'
      });
      console.log(`List unindent applied: 4 spaces removed`);
      return true;
    }
    // If we have less than 4 spaces, remove all of them
    else if (leadingSpaces.length > 0) {
      editorView.dispatch({
        changes: {
          from: line.from,
          to: line.from + leadingSpaces.length,
          insert: ''
        },
        userEvent: 'unindent'
      });
      console.log(`List unindent applied: ${leadingSpaces.length} spaces removed`);
      return true;
    }
  }
  
  // For blockquotes, remove one level of '> ' markers
  if (isBlockquote(line.text)) {
    // Find the blockquote structure
    const blockquoteMatch = line.text.match(/^(\s*)((?:>\s*)+)(.*)/);
    if (blockquoteMatch) {
      const leadingSpaces = blockquoteMatch[1] || '';
      const blockquoteMarkers = blockquoteMatch[2];
      
      // Find position of first '>' marker
      const firstMarkerPos = line.from + leadingSpaces.length;
      
      // Find the last '> ' sequence to remove
      const markerMatches = blockquoteMarkers.match(/(>\s*)/g);
      if (markerMatches && markerMatches.length > 0) {
        // Remove the first '> ' marker (which is the leftmost one)
        const markerToRemove = markerMatches[0];
        editorView.dispatch({
          changes: {
            from: firstMarkerPos,
            to: firstMarkerPos + markerToRemove.length,
            insert: ''
          },
          userEvent: 'unindent'
        });
        console.log('Blockquote unindent applied: > marker removed');
        return true;
      }
    } else {
      // Simpler case - just one level of blockquote
      const match = line.text.match(/^(\s*)>/);
      if (match) {
        const leadingSpaces = match[1] || '';
        const removePos = line.from + leadingSpaces.length;
        
        // Remove just the '>' character and one space after it if it exists
        const hasSpaceAfter = line.text.charAt(leadingSpaces.length + 1) === ' ';
        const removeLength = hasSpaceAfter ? 2 : 1; // '> ' or just '>'
        
        editorView.dispatch({
          changes: {
            from: removePos,
            to: removePos + removeLength,
            insert: ''
          },
          userEvent: 'unindent'
        });
        console.log('Simple blockquote unindent applied');
        return true;
      }
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