'use client';

import { EditorView } from '@codemirror/view';
import { EditorState, EditorSelection } from '@codemirror/state'; // <-- Ensure this line is present

/**
 * Insert bold formatting
 */
export const insertBold = (editorView: EditorView | null) => {
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
 */
export const insertItalic = (editorView: EditorView | null) => {
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

/**
 * Insert heading of specified level
 */
export const insertHeading = (editorView: EditorView | null, level: number) => {
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
 */
export const insertCode = (editorView: EditorView | null) => {
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

/**
 * Insert link formatting
 */
export const insertLink = (editorView: EditorView | null) => {
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
 */
export const insertList = (editorView: EditorView | null, ordered: boolean) => {
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

const NBSP = '\u00A0'; // Non-breaking space
const INDENT_UNIT = NBSP.repeat(4);

// Helper to check if a line is a list item
const isListItem = (lineText: string): boolean => {
  return /^\s*([-*+]|\d+\.)\s/.test(lineText);
};

/**
 * Indent text using non-breaking spaces
 */
export const indentText = (editorView: EditorView | null): boolean => {
  if (!editorView) return false;

  const { state } = editorView;
  let actionPerformed = false;
  
  const changes = state.changeByRange(range => {
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
      if (line.length === 0 && i === firstLine.number && firstLine.number === lastLine.number) { // Special case: indenting a single empty line
         // Allow indenting a single empty line
      } else if (isListItem(line.text) || (line.length === 0 && (firstLine.number !== lastLine.number))) {
        // Skip list items or empty lines in multi-line selection
        continue; 
      }

      newChanges.push({ from: line.from, insert: INDENT_UNIT });
      actionPerformed = true;

      // Adjust selection:
      // If the original selection point was on or after the start of this line, it's affected.
      if (line.from <= originalAnchor) {
        cumulativeCharsAddedBeforeAnchor += INDENT_UNIT.length;
      }
      if (line.from <= originalHead) {
        cumulativeCharsAddedBeforeHead += INDENT_UNIT.length;
      }
    }
    
    if (!actionPerformed) {
        return { range: EditorSelection.range(originalAnchor, originalHead) }; // No changes
    }

    newAnchor = originalAnchor + cumulativeCharsAddedBeforeAnchor;
    newHead = originalHead + cumulativeCharsAddedBeforeHead;
    
    // If selection was empty and on the line that got indented
    if (range.empty && firstLine.number <= state.doc.lineAt(originalAnchor).number && state.doc.lineAt(originalAnchor).number <= lastLine.number) {
        const lineOfCursor = state.doc.lineAt(originalAnchor);
        if (!isListItem(lineOfCursor.text)) { // Check again, as it might have been skipped if it was the only line and a list
             // newAnchor and newHead already adjusted by cumulative logic if it was not a list item
        }
    }

    return {
      changes: newChanges,
      range: EditorSelection.range(newAnchor, newHead)
    };
  });

  if (actionPerformed && !changes.changes.empty) {
     editorView.dispatch({
        changes: changes.changes,
        selection: changes.selection,
        userEvent: 'indent'
     });
     editorView.focus();
     return true;
  }
  editorView.focus();
  return false; 
};


/**
 * Unindent text by removing leading non-breaking spaces
 */
export const unindentText = (editorView: EditorView | null): boolean => {
  if (!editorView) return false;

  const { state } = editorView;
  let actionPerformed = false;
  
  const changes = state.changeByRange(range => {
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
      if (isListItem(line.text) || line.length === 0) {
        continue;
      }

      let removedOnThisLine = 0;
      for (let j = 0; j < INDENT_UNIT.length && j < line.length; j++) {
        if (line.text[j] === NBSP) {
          removedOnThisLine++;
        } else {
          break;
        }
      }

      if (removedOnThisLine > 0) {
        newChanges.push({ from: line.from, to: line.from + removedOnThisLine, insert: '' });
        actionPerformed = true;

        // Adjust selection:
        // If original selection point was after the removed part on this line
        if (line.from + removedOnThisLine <= originalAnchor) {
            cumulativeCharsRemovedBeforeAnchor += removedOnThisLine;
        } else if (line.from < originalAnchor) { // cursor was within the removed part or just after
            cumulativeCharsRemovedBeforeAnchor += (originalAnchor - line.from);
        }

        if (line.from + removedOnThisLine <= originalHead) {
            cumulativeCharsRemovedBeforeHead += removedOnThisLine;
        } else if (line.from < originalHead) {
            cumulativeCharsRemovedBeforeHead += (originalHead - line.from);
        }
      }
    }
    
    if (!actionPerformed) {
        return { range: EditorSelection.range(originalAnchor, originalHead) }; // No changes
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

  if (actionPerformed && !changes.changes.empty) {
    editorView.dispatch({
        changes: changes.changes,
        selection: changes.selection,
        userEvent: 'unindent'
    });
    editorView.focus();
    return true;
  }
  editorView.focus();
  return false;
};

/**
 * Handles backspace to delete an entire indent unit if applicable.
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