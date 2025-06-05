import { Extension } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

/**
 * Creates an extension that adds Obsidian-specific markdown support
 * @returns {Extension} The markdown extension
 */
export function obsidianMarkdown(): Extension {
  return markdown({
    codeLanguages: languages,
    addKeymap: true,
  });
} 