/**
 * @fileoverview Extension to prevent markdown formatting inside HTML elements
 * @module obsidian-editor/extensions/markdown/no-formatting
 */

import { Extension } from '@codemirror/state';
import { EditorView, Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';

/**
 * Creates an extension that prevents markdown formatting within HTML elements
 * 
 * @returns {Extension} CodeMirror extension
 */
export function createNoMarkdownInHtmlExtension(): Extension {
  // Create a ViewPlugin to handle HTML elements
  return ViewPlugin.fromClass(
    class {
      decorations: any;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        const { state } = view;
        const tree = syntaxTree(state);

        // Find HTML tags in the document
        tree.iterate({
          enter: (node) => {
            if (node.name.includes('HtmlTag') || node.name.includes('HtmlBlock')) {
              // Add a decoration to mark this as HTML content
              const htmlMark = Decoration.mark({
                class: 'cm-html-content',
                attributes: { 'data-html': 'true' }
              });
              
              builder.add(node.from, node.to, htmlMark);
            }
          }
        });

        return builder.finish();
      }
    },
    {
      decorations: (instance) => instance.decorations,
      provide: (plugin) =>
        EditorView.baseTheme({
          '.cm-html-content': {
            // Styles for HTML content
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: '2px',
          },
          '.cm-html-content .cm-formatting': {
            // Prevent markdown formatting inside HTML
            color: 'inherit !important',
            fontWeight: 'inherit !important',
            fontStyle: 'inherit !important',
          }
        })
    }
  );
} 