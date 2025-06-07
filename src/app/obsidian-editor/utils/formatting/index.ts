/**
 * @fileoverview Markdown formatting utilities
 * @module obsidian-editor/utils/formatting
 */

import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

/**
 * Apply markdown formatting to text
 * 
 * @param {string} text - The text to format
 * @param {string} format - The formatting type to apply
 * @returns {string} The formatted text
 */
export function applyMarkdownFormat(text: string, format: 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'heading'): string {
  switch (format) {
    case 'bold':
      return `**${text}**`;
    case 'italic':
      return `*${text}*`;
    case 'code':
      return `\`${text}\``;
    case 'link':
      return `[${text}](url)`;
    case 'strikethrough':
      return `~~${text}~~`;
    case 'heading':
      return `# ${text}`;
    default:
      return text;
  }
}

/**
 * Check if text has specific markdown formatting
 * 
 * @param {string} text - The text to check
 * @param {string} format - The formatting type to check for
 * @returns {boolean} Whether the text has the formatting
 */
export function hasMarkdownFormat(text: string, format: 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'heading'): boolean {
  switch (format) {
    case 'bold':
      return /^\*\*.*\*\*$/.test(text);
    case 'italic':
      return /^\*.*\*$/.test(text);
    case 'code':
      return /^`.*`$/.test(text);
    case 'link':
      return /^\[.*\]\(.*\)$/.test(text);
    case 'strikethrough':
      return /^~~.*~~$/.test(text);
    case 'heading':
      return /^#+ .*$/.test(text);
    default:
      return false;
  }
}

/**
 * Remove markdown formatting from text
 * 
 * @param {string} text - The formatted text
 * @param {string} format - The formatting type to remove
 * @returns {string} The unformatted text
 */
export function removeMarkdownFormat(text: string, format: 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'heading'): string {
  switch (format) {
    case 'bold':
      return text.replace(/^\*\*(.*)\*\*$/, '$1');
    case 'italic':
      return text.replace(/^\*(.*)\*$/, '$1');
    case 'code':
      return text.replace(/^`(.*)`$/, '$1');
    case 'link':
      return text.replace(/^\[(.*)\]\(.*\)$/, '$1');
    case 'strikethrough':
      return text.replace(/^~~(.*)~~$/, '$1');
    case 'heading':
      return text.replace(/^#+ (.*)$/, '$1');
    default:
      return text;
  }
}

/**
 * Insert bold formatting
 * 
 * @param {EditorView} view - The editor view
 */
export function insertBold(view: EditorView): void {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  
  for (const range of state.selection.ranges) {
    if (range.empty) {
      // If no selection, insert ** and place cursor between them
      changes.push({
        from: range.from,
        to: range.from,
        insert: '****'
      });
      selections.push(EditorSelection.cursor(range.from + 2));
    } else {
      // If text is selected, wrap it with **
      const selectedText = state.doc.sliceString(range.from, range.to);
      const newText = `**${selectedText}**`;
      changes.push({
        from: range.from,
        to: range.to,
        insert: newText
      });
      selections.push(EditorSelection.range(range.from, range.from + newText.length));
    }
  }
  
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}

/**
 * Insert italic formatting
 * 
 * @param {EditorView} view - The editor view
 */
export function insertItalic(view: EditorView): void {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  
  for (const range of state.selection.ranges) {
    if (range.empty) {
      // If no selection, insert * and place cursor between them
      changes.push({
        from: range.from,
        to: range.from,
        insert: '**'
      });
      selections.push(EditorSelection.cursor(range.from + 1));
    } else {
      // If text is selected, wrap it with *
      const selectedText = state.doc.sliceString(range.from, range.to);
      const newText = `*${selectedText}*`;
      changes.push({
        from: range.from,
        to: range.to,
        insert: newText
      });
      selections.push(EditorSelection.range(range.from, range.from + newText.length));
    }
  }
  
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}

/**
 * Insert code formatting
 * 
 * @param {EditorView} view - The editor view
 */
export function insertCode(view: EditorView): void {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  
  for (const range of state.selection.ranges) {
    if (range.empty) {
      // If no selection, insert `` and place cursor between them
      changes.push({
        from: range.from,
        to: range.from,
        insert: '``'
      });
      selections.push(EditorSelection.cursor(range.from + 1));
    } else {
      // If text is selected, wrap it with `
      const selectedText = state.doc.sliceString(range.from, range.to);
      const newText = `\`${selectedText}\``;
      changes.push({
        from: range.from,
        to: range.to,
        insert: newText
      });
      selections.push(EditorSelection.range(range.from, range.from + newText.length));
    }
  }
  
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}

/**
 * Insert heading formatting
 * 
 * @param {EditorView} view - The editor view
 * @param {number} level - The heading level (1-6)
 */
export function insertHeading(view: EditorView, level: number = 1): void {
  const { state, dispatch } = view;
  
  // Validate level
  const validLevel = Math.max(1, Math.min(6, level));
  const prefix = '#'.repeat(validLevel) + ' ';
  
  const changes = [];
  const selections = [];
  
  for (const range of state.selection.ranges) {
    // Get line start and line content
    const line = state.doc.lineAt(range.from);
    const lineContent = line.text;
    
    // Check if line already has heading
    const existingHeadingMatch = lineContent.match(/^(#{1,6})\s/);
    
    if (existingHeadingMatch) {
      // Already has heading, replace it
      changes.push({
        from: line.from,
        to: line.from + existingHeadingMatch[0].length,
        insert: prefix
      });
    } else {
      // Add heading at start of line
      changes.push({
        from: line.from,
        to: line.from,
        insert: prefix
      });
    }
    
    // Keep cursor position relative to content
    const contentOffset = range.from - line.from;
    const newPos = line.from + prefix.length + contentOffset;
    selections.push(EditorSelection.cursor(newPos));
  }
  
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}

/**
 * Insert link formatting
 * 
 * @param {EditorView} view - The editor view
 */
export function insertLink(view: EditorView): void {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  
  for (const range of state.selection.ranges) {
    if (range.empty) {
      // If no selection, insert [](url) and place cursor between []
      changes.push({
        from: range.from,
        to: range.from,
        insert: '[](url)'
      });
      selections.push(EditorSelection.cursor(range.from + 1));
    } else {
      // If text is selected, use it as link text
      const selectedText = state.doc.sliceString(range.from, range.to);
      const newText = `[${selectedText}](url)`;
      changes.push({
        from: range.from,
        to: range.to,
        insert: newText
      });
      
      // Position cursor in the URL part
      const urlPos = range.from + selectedText.length + 3;
      selections.push(EditorSelection.cursor(urlPos));
    }
  }
  
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}

/**
 * Indent text (add spaces at the beginning of line)
 * 
 * @param {EditorView} view - The editor view
 */
export function indentText(view: EditorView): void {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  const indentSize = 2; // Use 2 spaces for indentation
  const indent = ' '.repeat(indentSize);
  
  // Track already processed lines to avoid double indenting
  const processedLines = new Set<number>();
  
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from);
    const endLine = state.doc.lineAt(range.to);
    
    // Process each line in the selection
    for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
      if (processedLines.has(lineNum)) continue;
      
      const line = state.doc.line(lineNum);
      processedLines.add(lineNum);
      
      // Add indentation at the start of the line
      changes.push({
        from: line.from,
        to: line.from,
        insert: indent
      });
    }
    
    // Adjust selection to keep it on the same text
    const newFrom = range.from + indentSize;
    const newTo = range.to + (endLine.number - startLine.number + 1) * indentSize;
    selections.push(EditorSelection.range(newFrom, newTo));
  }
  
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}

/**
 * Unindent text (remove spaces from the beginning of line)
 * 
 * @param {EditorView} view - The editor view
 */
export function unindentText(view: EditorView): void {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  const indentSize = 2; // Remove 2 spaces when unindenting
  
  // Track already processed lines to avoid double processing
  const processedLines = new Set<number>();
  
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from);
    const endLine = state.doc.lineAt(range.to);
    
    // Track total indentation removed to adjust selection
    let totalIndentRemoved = 0;
    
    // Process each line in the selection
    for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
      if (processedLines.has(lineNum)) continue;
      
      const line = state.doc.line(lineNum);
      processedLines.add(lineNum);
      
      // Check for spaces at the beginning of the line
      const lineContent = line.text;
      const leadingSpaces = lineContent.match(/^( +)/);
      
      if (leadingSpaces) {
        // Determine how many spaces to remove (up to indentSize)
        const spacesToRemove = Math.min(leadingSpaces[1].length, indentSize);
        
        changes.push({
          from: line.from,
          to: line.from + spacesToRemove,
          insert: ''
        });
        
        // If this is within the selection range, count for adjustment
        if (lineNum === startLine.number) {
          totalIndentRemoved += spacesToRemove;
        }
      }
    }
    
    // Adjust selection to keep it on the same text
    const newFrom = Math.max(startLine.from, range.from - totalIndentRemoved);
    let newTo = range.to;
    
    // Adjust 'to' position for all removed indents
    for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
      const line = state.doc.line(lineNum);
      const lineContent = line.text;
      const leadingSpaces = lineContent.match(/^( +)/);
      
      if (leadingSpaces) {
        const spacesToRemove = Math.min(leadingSpaces[1].length, indentSize);
        newTo -= spacesToRemove;
      }
    }
    
    selections.push(EditorSelection.range(newFrom, Math.max(newFrom, newTo)));
  }
  
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}

/**
 * Handle backspace in indented lines
 * 
 * @param {EditorView} view - The editor view
 * @returns {boolean} Whether the event was handled
 */
export function handleBackspaceIndent(view: EditorView): boolean {
  const { state, dispatch } = view;
  const indentSize = 2;
  
  // Only handle if all selections are empty (cursor positions)
  if (!state.selection.ranges.every(range => range.empty)) {
    return false;
  }
  
  let handled = false;
  const changes = [];
  const selections = [];
  
  for (const range of state.selection.ranges) {
    const pos = range.from;
    const line = state.doc.lineAt(pos);
    
    // Only handle if cursor is at the end of whitespace
    if (pos > line.from) {
      const textBeforeCursor = line.text.substring(0, pos - line.from);
      
      // Check if there are only spaces before the cursor
      if (/^\s+$/.test(textBeforeCursor)) {
        const spacesToRemove = Math.min(textBeforeCursor.length, indentSize);
        
        changes.push({
          from: pos - spacesToRemove,
          to: pos,
          insert: ''
        });
        
        selections.push(EditorSelection.cursor(pos - spacesToRemove));
        handled = true;
      }
    }
  }
  
  if (handled) {
    dispatch({
      changes,
      selection: EditorSelection.create(selections)
    });
    return true;
  }
  
  return false;
}

/**
 * Handle Enter key in lists and blockquotes
 * 
 * @param {EditorView} view - The editor view
 * @returns {boolean} Whether the event was handled
 */
export function handleEnterListBlockquote(view: EditorView): boolean {
  const { state, dispatch } = view;
  
  // Only handle if there's a single cursor
  if (state.selection.ranges.length !== 1 || !state.selection.ranges[0].empty) {
    return false;
  }
  
  const pos = state.selection.main.from;
  const line = state.doc.lineAt(pos);
  const lineContent = line.text;
  
  // Check for list items or blockquotes
  const listMatch = lineContent.match(/^(\s*)([-*+]|\d+\.)\s/);
  const blockquoteMatch = lineContent.match(/^(\s*>\s+)/);
  
  if (listMatch || blockquoteMatch) {
    const prefix = listMatch ? listMatch[0] : blockquoteMatch![0];
    
    // Check if the line is empty except for the prefix
    if (lineContent.trim() === prefix.trim()) {
      // Empty list item or blockquote - remove the prefix
      dispatch({
        changes: { from: line.from, to: line.to, insert: '' }
      });
      return true;
    } else if (pos === line.to) {
      // At the end of a non-empty line - continue the list or blockquote
      dispatch({
        changes: { from: pos, to: pos, insert: '\n' + prefix },
        selection: { anchor: pos + 1 + prefix.length }
      });
      return true;
    }
  }
  
  return false;
} 