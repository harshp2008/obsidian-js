/**
 * @fileoverview Extension to prevent markdown formatting inside HTML blocks
 * @module obsidian-editor/extensions/markdown/no-formatting
 */

import { EditorView, ViewPlugin, Decoration, DecorationSet } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder, Extension } from '@codemirror/state';

/**
 * Creates an extension that prevents markdown formatting inside HTML blocks
 * This helps to maintain proper separation between HTML and markdown content
 * 
 * @returns An Extension that prevents markdown processing in HTML blocks
 */
export function createNoMarkdownInHtmlExtension(): Extension {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update: any) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      
      // Find HTML blocks in the document
      for (const { from, to } of view.visibleRanges) {
        const tree = syntaxTree(view.state);
        
        tree.iterate({
          from,
          to,
          enter: (node) => {
            // Check if this is an HTML node
            if (node.name.includes('HtmlBlock') || 
                node.type.name.includes('HtmlTag') ||
                node.type.name.includes('Element')) {
              
              // Add decoration to prevent markdown processing
              builder.add(
                node.from, 
                node.to, 
                Decoration.mark({
                  class: 'cm-no-markdown-formatting',
                  attributes: { 'data-no-markdown': 'true' }
                })
              );
            }
          }
        });
      }
      
      return builder.finish();
    }
  }, {
    decorations: v => v.decorations
  });
} 