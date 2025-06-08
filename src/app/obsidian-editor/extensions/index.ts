import { Extension } from '@codemirror/state';
import { createMarkdownSyntaxPlugin } from './markdown-syntax';
import { createCodeMirrorKeymaps } from './keymaps';
import { createMarkdownFileSystem } from './filesystem';
import { createNoMarkdownInHtmlExtension } from './markdown/no-formatting';

/**
 * Create all the extensions needed for the Obsidian-like editor
 * @returns An array of extensions
 */
export function createAllExtensions(): Extension[] {
  return [
    createMarkdownSyntaxPlugin(),
    createCodeMirrorKeymaps(),
    createMarkdownFileSystem(),
    createNoMarkdownInHtmlExtension() // Add the no-markdown-in-html extension
  ];
} 