import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';

/**
 * Combined keymap extension for the editor
 * Includes default keybindings and custom ones
 */
const combinedKeymap = keymap.of([
  // Allow indentation with tab
  indentWithTab,
  
  // Add more keybindings here
]);

export default combinedKeymap; 