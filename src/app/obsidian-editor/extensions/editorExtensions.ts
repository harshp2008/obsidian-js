import { Extension, Compartment } from '@codemirror/state';
import { EditorView, keymap, highlightActiveLine, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, bracketMatching, foldGutter, foldKeymap, defaultHighlightStyle } from '@codemirror/language';
import { search, searchNext, searchPrevious, searchKeymap } from '@codemirror/search';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { markdown } from '@codemirror/lang-markdown';
import { obsidianKeymap } from './keymaps/obsidianKeymap';
import { obsidianTheme } from './themes/obsidianTheme';
import { createMarkdownSyntaxPlugin } from './markdown-syntax';

/**
 * Creates the base extensions for the CodeMirror editor with Obsidian-like functionality.
 * This includes syntax highlighting, keymaps, and other essential features.
 * 
 * @param {Compartment} themeCompartment - The theme compartment for managing theme changes
 * @returns {Extension[]} Array of CodeMirror extensions
 */
export function createBaseExtensions(themeCompartment: Compartment): Extension[] {
  const allKeymaps = [
    ...defaultKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
    ...searchKeymap,
    ...obsidianKeymap,
    indentWithTab,
  ];

  return [
    // Basic editor features
    highlightActiveLine(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    EditorView.lineWrapping,

    // Theme
    obsidianTheme,

    // Language support (using default markdown and custom syntax plugin)
    markdown(),
    createMarkdownSyntaxPlugin(),

    // Editor features
    bracketMatching(),
    foldGutter(),
    autocompletion(),
    search(),

    // History and undo/redo
    history(),

    // Keymaps
    keymap.of(allKeymaps),
  ];
} 