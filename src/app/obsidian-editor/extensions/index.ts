import { Extension } from '@codemirror/state';
import { createMarkdownSyntaxPlugin } from './markdown-syntax';
import combinedKeymap from './keymaps';
import { createNoMarkdownInHtmlExtension } from './markdown/no-formatting';
import { atomicIndents } from './AtomicIndents';
import { markdownSyntaxHider } from './MarkdownSyntaxHider';
import { LineBreakDecorator } from './markdown-syntax/rules/lineBreakDecorator';
import { htmlDecorator } from './markdown-syntax/html-decorator';

/**
 * Create all the extensions needed for the Obsidian-like editor
 * @returns An array of extensions
 */
export function createAllExtensions(): Extension[] {
  return [
    createMarkdownSyntaxPlugin(),
    combinedKeymap,
    createNoMarkdownInHtmlExtension(), // Add the no-markdown-in-html extension
    atomicIndents, // Make indentation atomic (tab movement)
    markdownSyntaxHider, // Hide markdown syntax when not in focus
    LineBreakDecorator, // Handle markdown line breaks
    htmlDecorator(), // Render HTML in markdown
  ];
} 