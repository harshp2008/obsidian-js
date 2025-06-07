/**
 * This file contains configurations for CodeMirror editor extensions.
 */
import { Extension, Prec } from '@codemirror/state';
import { keymap, highlightActiveLine, highlightActiveLineGutter, EditorView } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands';

// Import custom extensions
import { atomicIndents } from '../extensions/AtomicIndents';
import { createMarkdownSyntaxPlugin } from '../extensions/markdown-syntax/index';
import { markdownPasteHandler } from '../extensions/MarkdownPasteHandler.ts';
// Import our Lezer safety plugin
import { createLezerSafetyPlugin } from '../extensions/lezer-safety-plugin';

// Import formatting functions from our new modular structure
import { 
  insertBold, 
  insertItalic, 
  insertHeading, 
  insertCode, 
  insertLink,
  indentText,
  unindentText,
  handleBackspaceIndent,
  handleEnterListBlockquote
} from './formatting';

/**
 * Creates a custom highlight style for markdown content
 * @returns {HighlightStyle} The highlight style extension
 */
export const createCustomHighlightStyle = (): HighlightStyle | Extension[] => {
  try {
    // First verify that tags is an object and has the expected properties
    if (typeof tags !== 'object' || tags === null) {
      console.warn('Lezer highlight tags not available, using empty highlight style');
      return [];
    }

    // Build an array of valid tag styles
    const validStyles = [];
    
    // Ensure consistent handling of tags - always use array format for tag property
    if (tags.heading1) validStyles.push({ tag: [tags.heading1], fontSize: '1.6em', fontWeight: 'bold' });
    if (tags.heading2) validStyles.push({ tag: [tags.heading2], fontSize: '1.4em', fontWeight: 'bold' });
    if (tags.heading3) validStyles.push({ tag: [tags.heading3], fontSize: '1.2em', fontWeight: 'bold' });
    if (tags.heading4) validStyles.push({ tag: [tags.heading4], fontSize: '1.1em', fontWeight: 'bold' });
    if (tags.heading5) validStyles.push({ tag: [tags.heading5], fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' });
    if (tags.heading6) validStyles.push({ tag: [tags.heading6], fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' });
    if (tags.strong) validStyles.push({ tag: [tags.strong], fontWeight: 'bold' });
    if (tags.emphasis) validStyles.push({ tag: [tags.emphasis], fontStyle: 'italic' });
    if (tags.link) validStyles.push({ tag: [tags.link], color: '#2563eb', textDecoration: 'underline' });
    if (tags.monospace) validStyles.push({ tag: [tags.monospace], fontFamily: 'monospace', fontSize: '0.9em', color: '#10b981' });
    
    // Only create the highlight style if we have valid tags
    if (validStyles.length > 0) {
      return HighlightStyle.define(validStyles);
    } else {
      console.warn('No valid lezer highlight tags found, using empty highlight style');
      return [];
    }
  } catch (error) {
    console.error('Error creating custom highlight style:', error);
    return []; // Return empty extension on failure
  }
};

/**
 * Creates a custom Enter keymap with highest precedence
 * @returns {Extension} The custom enter keymap extension
 */
export const createCustomEnterKeymap = (): Extension => {
  return Prec.highest(keymap.of([
    {
      key: 'Enter',
      run: (view) => handleEnterListBlockquote(view),
    }
  ]));
};

/**
 * Creates custom keymaps for markdown editing
 * @param onSaveRef - Reference to the onSave function
 * @returns {Extension} The keymap extension
 */
export const createMarkdownKeymaps = (onSaveRef: React.MutableRefObject<(() => void) | undefined>): Extension => {
  return keymap.of([
    {
      key: 'Backspace',
      run: (view) => {
        return handleBackspaceIndent(view);
      }
    },
    ...defaultKeymap,
    ...historyKeymap,
    {
      key: 'Tab',
      run: (view) => {
        indentText(view);
        return true;
      },
      shift: (view) => {
        unindentText(view);
        return true;
      }
    },
    {
      key: 'Ctrl-b',
      run: (view) => {
        insertBold(view);
        return true;
      },
    },
    {
      key: 'Ctrl-i',
      run: (view) => {
        insertItalic(view);
        return true;
      },
    },
    {
      key: 'Ctrl-1',
      run: (view) => {
        insertHeading(view, 1);
        return true;
      },
    },
    {
      key: 'Ctrl-2',
      run: (view) => {
        insertHeading(view, 2);
        return true;
      },
    },
    {
      key: 'Ctrl-3',
      run: (view) => {
        insertHeading(view, 3);
        return true;
      },
    },
    {
      key: 'Ctrl-`',
      run: (view) => {
        insertCode(view);
        return true;
      },
    },
    {
      key: 'Ctrl-k',
      run: (view) => {
        insertLink(view);
        return true;
      },
    },
    {
      key: 'Ctrl-s',
      run: () => {
        if (onSaveRef.current) onSaveRef.current();
        return true;
      },
    },
  ]);
};

/**
 * Creates base editor styling
 * @returns {Extension} The editor theme extension
 */
export const createEditorStyling = (): Extension => {
  return EditorView.theme({
    '&': {
      height: '100%',
    },
    '.cm-content': {
      padding: '1rem',
      fontFamily: 'Menlo, Monaco, Courier New, monospace',
      fontSize: '16px',
      lineHeight: '1.6',
    },
  });
};

/**
 * Interface for editor extension options
 */
export interface EditorExtensionOptions {
  markdown: string;
  editableCompartment: any;
  isDark: boolean;
  themeExtension: any;
  onSave?: () => void;
}

/**
 * Creates all the extensions needed for the CodeMirror editor
 * @param options - Editor extension options
 * @returns {Extension[]} Array of extensions
 */
export const createEditorExtensions = (options: EditorExtensionOptions): Extension[] => {
  const { editableCompartment, themeExtension, isDark } = options;

  const onSaveRef = { 
    current: options.onSave || (() => {})
  };
  
  // Create extensions that are less likely to cause issues
  const safeExtensions: Extension[] = [
    themeExtension,
    history(),
    atomicIndents,
    createCustomEnterKeymap(),
    // Add our Lezer safety plugin with highest precedence to run first
    Prec.highest(createLezerSafetyPlugin()),
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      addKeymap: false,
    }),
    createMarkdownSyntaxPlugin(),
    markdownPasteHandler,
    highlightActiveLine(),
    highlightActiveLineGutter(),
    EditorView.lineWrapping,
    createMarkdownKeymaps(onSaveRef),
    editableCompartment.of(EditorView.editable.of(true)), // Start as editable
    createEditorStyling(),
  ];

  // Try to apply syntax highlighting safely
  try {
    const highlightStyle = createCustomHighlightStyle();
    
    // Only add syntax highlighting if we got a valid HighlightStyle object
    if (Array.isArray(highlightStyle)) {
      if (highlightStyle.length > 0) {
        safeExtensions.push(...highlightStyle);
      }
    } else {
      safeExtensions.push(syntaxHighlighting(highlightStyle));
    }
  } catch (error) {
    console.error("Error applying syntax highlighting:", error);
    // Continue without syntax highlighting
  }
  
  return safeExtensions;
}; 