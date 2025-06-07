/**
 * @fileoverview Keyboard shortcuts and key mappings for the editor
 * @module obsidian-editor/extensions/keymaps
 */

import { keymap } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { toggleMark } from './markdown';

/**
 * Keyboard mapping for markdown formatting shortcuts
 */
export const markdownKeymap = keymap.of([
  // Bold: Ctrl+B
  {
    key: 'Ctrl-b',
    run: (view) => {
      return toggleMark(view, '**', '**');
    }
  },
  // Italic: Ctrl+I
  {
    key: 'Ctrl-i',
    run: (view) => {
      return toggleMark(view, '*', '*');
    }
  },
  // Strikethrough: Ctrl+Shift+S
  {
    key: 'Ctrl-Shift-s',
    run: (view) => {
      return toggleMark(view, '~~', '~~');
    }
  },
  // Code: Ctrl+Shift+C
  {
    key: 'Ctrl-Shift-c',
    run: (view) => {
      return toggleMark(view, '`', '`');
    }
  },
  // Link: Ctrl+K
  {
    key: 'Ctrl-k',
    run: (view) => {
      const selection = view.state.selection;
      if (selection.ranges.length === 1 && selection.main.empty) {
        // No selection, insert a template link
        const transaction = view.state.update({
          changes: {
            from: selection.main.from,
            to: selection.main.from,
            insert: '[]()'
          },
          selection: EditorSelection.cursor(selection.main.from + 1)
        });
        view.dispatch(transaction);
        return true;
      } else {
        // With selection, wrap it in link syntax
        return toggleMark(view, '[', ']()', true);
      }
    }
  }
]);

/**
 * Define additional editor keymaps
 */
export const editorKeymap = keymap.of([
  // Save: Ctrl+S
  {
    key: 'Ctrl-s',
    run: (view) => {
      // Trigger a custom event that can be caught by the editor component
      const event = new CustomEvent('editor-save', {
        bubbles: true,
        detail: { content: view.state.doc.toString() }
      });
      view.dom.dispatchEvent(event);
      return true;
    },
    preventDefault: true
  }
]);

/**
 * Combined keymap for all editor shortcuts
 */
export const combinedKeymap = [
  markdownKeymap,
  editorKeymap
];

export default combinedKeymap; 