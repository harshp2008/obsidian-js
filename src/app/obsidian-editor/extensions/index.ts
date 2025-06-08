import { Extension } from '@codemirror/state';
import { createMarkdownSyntaxPlugin } from './markdown-syntax';
import combinedKeymap from './keymaps';
import { createNoMarkdownInHtmlExtension } from './markdown/no-formatting';

/**
 * Create all the extensions needed for the Obsidian-like editor
 * @returns An array of extensions
 */
export function createAllExtensions(): Extension[] {
  return [
    createMarkdownSyntaxPlugin(),
    combinedKeymap,
    createNoMarkdownInHtmlExtension() // Add the no-markdown-in-html extension
  ];
} 