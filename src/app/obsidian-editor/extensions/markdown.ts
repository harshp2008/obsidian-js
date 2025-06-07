/**
 * @fileoverview Markdown editing utilities
 * @module obsidian-editor/extensions/markdown
 */

import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

/**
 * Toggle markdown formatting around selected text
 * 
 * @param {EditorView} view - The editor view
 * @param {string} openMark - The opening markdown syntax (e.g. "**")
 * @param {string} closeMark - The closing markdown syntax (e.g. "**")
 * @param {boolean} keepSelection - Whether to keep the selection after toggling
 * @returns {boolean} Whether the operation was successful
 */
export function toggleMark(
  view: EditorView,
  openMark: string,
  closeMark: string,
  keepSelection: boolean = false
): boolean {
  const { state } = view;
  const selection = state.selection;
  
  if (selection.ranges.length === 0) return false;
  
  // Store all changes to be applied
  const changes = [];
  const newSelections = [];
  
  for (const range of selection.ranges) {
    if (range.empty) {
      // If no text is selected, insert marks and place cursor between them
      changes.push({
        from: range.from,
        to: range.from,
        insert: openMark + closeMark
      });
      
      const newCursor = range.from + openMark.length;
      newSelections.push(EditorSelection.cursor(newCursor));
    } else {
      const selectedText = state.doc.sliceString(range.from, range.to);
      
      // Check if the selection already has the marks
      const hasMarks = selectedText.startsWith(openMark) && 
                      selectedText.endsWith(closeMark) &&
                      selectedText.length >= openMark.length + closeMark.length;
      
      if (hasMarks) {
        // Remove marks
        const innerFrom = range.from + openMark.length;
        const innerTo = range.to - closeMark.length;
        const innerText = state.doc.sliceString(innerFrom, innerTo);
        
        changes.push({
          from: range.from,
          to: range.to,
          insert: innerText
        });
        
        if (keepSelection) {
          newSelections.push(EditorSelection.range(range.from, range.from + innerText.length));
        } else {
          newSelections.push(EditorSelection.cursor(range.from + innerText.length));
        }
      } else {
        // Add marks
        changes.push({
          from: range.from,
          to: range.to,
          insert: openMark + selectedText + closeMark
        });
        
        if (keepSelection) {
          const newFrom = range.from + openMark.length;
          const newTo = newFrom + selectedText.length;
          newSelections.push(EditorSelection.range(newFrom, newTo));
        } else {
          const cursorPos = range.from + openMark.length + selectedText.length + closeMark.length;
          newSelections.push(EditorSelection.cursor(cursorPos));
        }
      }
    }
  }
  
  // Apply all changes at once
  view.dispatch({
    changes,
    selection: EditorSelection.create(newSelections)
  });
  
  return true;
} 