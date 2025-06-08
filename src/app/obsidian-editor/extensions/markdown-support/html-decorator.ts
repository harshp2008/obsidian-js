/**
 * @fileoverview HTML decorator for markdown syntax
 * @module obsidian-editor/extensions/markdown-support/html-decorator
 */

import { EditorView, ViewPlugin, Decoration, DecorationSet } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';

/**
 * Creates the HTML decorator plugin for markdown content
 * This helps to properly render HTML within markdown
 * 
 * @returns An EditorView.Plugin that decorates HTML within markdown
 */
export function htmlDecorator() {
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
            if (node.name.includes('HtmlBlock') || 
                node.name.includes('HtmlTag') ||
                node.name.includes('OpenTag') ||
                node.name.includes('CloseTag')) {
              
              // Add decoration to HTML region
              builder.add(
                node.from, 
                node.to, 
                Decoration.mark({
                  class: 'cm-html-content',
                  attributes: { 'data-html-content': 'true' }
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