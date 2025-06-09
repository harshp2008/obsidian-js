export { b as CodeMirrorEditor, C as CodeMirrorEditorProps, e as Editor, E as EditorCore, c as EditorToolbar, a as Theme, T as ThemeContextType, g as ThemeProvider, d as ThemeSwitcher, f as ThemeToggle, u as useTheme } from './client-xeCm4j1W.mjs';
import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import 'react';
import 'react/jsx-runtime';

/**
 * Change type representing a text change in the editor.
 * @interface TextChange
 */
interface TextChange {
    from: number;
    to: number;
    insert: string;
}
/**
 * Result of a formatting operation.
 * @interface FormattingResult
 */
interface FormattingResult {
    changes: TextChange[];
    selection?: EditorSelection;
}
/**
 * Toggle bold formatting for the selected text
 *
 * @param selection - The current editor selection
 * @param doc - The document text
 * @returns Changes to apply to the document
 */
declare function toggleBold(selection: EditorSelection, doc: string): {
    changes: {
        from: number;
        to: number;
        insert: string;
    }[];
    selection: EditorSelection;
};
/**
 * Toggle italic formatting for the selected text
 *
 * @param selection - The current editor selection
 * @param doc - The document text
 * @returns Changes to apply to the document
 */
declare function toggleItalic(selection: EditorSelection, doc: string): {
    changes: {
        from: number;
        to: number;
        insert: string;
    }[];
    selection: EditorSelection;
};
/**
 * Toggle heading formatting for the selected text
 *
 * @param selection - The current editor selection
 * @param doc - The document text
 * @param level - Heading level (1-6)
 * @returns Changes to apply to the document
 */
declare function toggleHeading(selection: EditorSelection, doc: string, level: number): {
    changes: {
        from: number;
        to: number;
        insert: string;
    }[];
    selection: EditorSelection;
};
/**
 * Creates a link with the selected text as the label.
 * If no text is selected, inserts a template link and selects the label part.
 *
 * @param selection - The current editor selection
 * @param doc - The current document text
 * @returns FormattingResult with changes to apply
 */
declare function createLink(selection: EditorSelection, doc: string): FormattingResult;
/**
 * Toggles a code block or inline code formatting.
 * - For multi-line selections: Uses fenced code blocks ```
 * - For single-line selections: Uses inline code formatting `code`
 *
 * @param selection - The current editor selection
 * @param doc - The current document text
 * @returns FormattingResult with changes to apply
 */
declare function toggleCode(selection: EditorSelection, doc: string): FormattingResult;

/**
 * @fileoverview Markdown formatting utilities
 * @module obsidian-editor/utils/formatting
 */

/**
 * Apply markdown formatting to text
 *
 * @param {string} text - The text to format
 * @param {string} format - The formatting type to apply
 * @returns {string} The formatted text
 */
declare function applyMarkdownFormat(text: string, format: 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'heading'): string;
/**
 * Check if text has specific markdown formatting
 *
 * @param {string} text - The text to check
 * @param {string} format - The formatting type to check for
 * @returns {boolean} Whether the text has the formatting
 */
declare function hasMarkdownFormat(text: string, format: 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'heading'): boolean;
/**
 * Remove markdown formatting from text
 *
 * @param {string} text - The formatted text
 * @param {string} format - The formatting type to remove
 * @returns {string} The unformatted text
 */
declare function removeMarkdownFormat(text: string, format: 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'heading'): string;
/**
 * Insert bold formatting
 *
 * @param {EditorView} view - The editor view
 */
declare function insertBold(view: EditorView): void;
/**
 * Insert italic formatting
 *
 * @param {EditorView} view - The editor view
 */
declare function insertItalic(view: EditorView): void;
/**
 * Insert code formatting
 *
 * @param {EditorView} view - The editor view
 */
declare function insertCode(view: EditorView): void;
/**
 * Insert heading formatting
 *
 * @param {EditorView} view - The editor view
 * @param {number} level - The heading level (1-6)
 */
declare function insertHeading(view: EditorView, level?: number): void;
/**
 * Insert link formatting
 *
 * @param {EditorView} view - The editor view
 */
declare function insertLink(view: EditorView): void;
/**
 * Indent text (add spaces at the beginning of line)
 *
 * @param {EditorView} view - The editor view
 */
declare function indentText(view: EditorView): void;
/**
 * Unindent text (remove spaces from the beginning of line)
 *
 * @param {EditorView} view - The editor view
 */
declare function unindentText(view: EditorView): void;
/**
 * Handle backspace in indented lines
 *
 * @param {EditorView} view - The editor view
 * @returns {boolean} Whether the event was handled
 */
declare function handleBackspaceIndent(view: EditorView): boolean;
/**
 * Handle Enter key in lists and blockquotes
 *
 * @param {EditorView} view - The editor view
 * @returns {boolean} Whether the event was handled
 */
declare function handleEnterListBlockquote(view: EditorView): boolean;

export { applyMarkdownFormat, createLink, handleBackspaceIndent, handleEnterListBlockquote, hasMarkdownFormat, indentText, insertBold, insertCode, insertHeading, insertItalic, insertLink, removeMarkdownFormat, toggleBold, toggleCode, toggleHeading, toggleItalic, unindentText };
