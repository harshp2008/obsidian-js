/**
 * @fileoverview Markdown support extensions for CodeMirror
 * @module obsidian-editor/extensions/markdown-support
 */

import { EditorView } from '@codemirror/view';
import { Extension, StateEffect, StateField } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

/**
 * State effect for changing the markdown syntax mode
 */
export const setMarkdownSyntaxMode = StateEffect.define<'live' | 'preview'>();

/**
 * Create a markdown syntax plugin for the editor
 * @returns Extension for markdown syntax support
 */
export function createMarkdownSyntaxPlugin(): Extension {
  return [
    // Core markdown language support
    markdown({
      codeLanguages: languages,
      addKeymap: true
    }),
    // Optional: Add custom state field to track rendering mode
    markdownRenderModeField
  ];
}

/**
 * State field for tracking the markdown rendering mode
 */
const markdownRenderModeField = StateField.define<'live' | 'preview'>({
  create() {
    return 'live';
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setMarkdownSyntaxMode)) {
        return effect.value;
      }
    }
    return value;
  },
  provide(field) {
    return EditorView.contentAttributes.from(field, mode => ({
      'data-markdown-mode': mode
    }));
  }
});

/**
 * State effect that signals a markdown syntax mode change
 */
export const markdownSyntaxModeEffect = setMarkdownSyntaxMode; 