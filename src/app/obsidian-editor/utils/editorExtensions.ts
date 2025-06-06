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
import { markdownPasteHandler } from '../extensions/MarkdownPasteHandler';

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
export const createCustomHighlightStyle = (): HighlightStyle => {
  return HighlightStyle.define([
    { tag: tags.heading1, fontSize: '1.6em', fontWeight: 'bold' },
    { tag: tags.heading2, fontSize: '1.4em', fontWeight: 'bold' },
    { tag: tags.heading3, fontSize: '1.2em', fontWeight: 'bold' },
    { tag: tags.heading4, fontSize: '1.1em', fontWeight: 'bold' },
    { tag: tags.heading5, fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' },
    { tag: tags.heading6, fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
    { tag: tags.monospace, fontFamily: 'monospace', fontSize: '0.9em', color: '#10b981' },
  ]);
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
  
  return [
    themeExtension,
    history(),
    atomicIndents,
    createCustomEnterKeymap(),
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      addKeymap: false,
    }),
    createMarkdownSyntaxPlugin(),
    markdownPasteHandler,
    highlightActiveLine(),
    highlightActiveLineGutter(),
    syntaxHighlighting(createCustomHighlightStyle()),
    EditorView.lineWrapping,
    createMarkdownKeymaps(onSaveRef),
    editableCompartment.of(EditorView.editable.of(true)), // Start as editable
    createEditorStyling(),
  ];
}; 