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
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        const { state } = view;
        const tree = syntaxTree(state);
        const htmlRegions: {from: number, to: number}[] = [];

        // First pass: Find HTML regions
        tree.iterate({
          enter: (node) => {
            // More comprehensive check for HTML elements
            if (node.name.includes('HtmlTag') || 
                node.name.includes('HtmlBlock') || 
                node.name.includes('OpenTag') || 
                node.name.includes('CloseTag') || 
                node.name.includes('SelfClosingTag') ||
                node.name.includes('Element')) {
              
              htmlRegions.push({from: node.from, to: node.to});
              
              // Add three layers of decorations to ensure markdown is disabled
              
              // 1. Mark as HTML content
              builder.add(node.from, node.to, Decoration.mark({
                class: 'cm-html-content',
                attributes: { 'data-html': 'true' }
              }));
              
              // 2. Apply plain text marker to prevent markdown parsing
              builder.add(node.from, node.to, Decoration.mark({
                class: 'cm-plain-text cm-disable-markdown-parsing',
                attributes: { 'data-no-markdown': 'true' }
              }));
              
              // 3. Apply special HTML tag marker that CSS will target
              builder.add(node.from, node.to, Decoration.mark({
                class: 'cm-html-tag-block cm-no-list-rendering',
                attributes: { 'data-html-tag': 'true', 'data-no-list': 'true' }
              }));
            }
          }
        });

        // Second pass: Find any markdown list items or other formatting within HTML regions
        // and add extra decorations to override them
        tree.iterate({
          enter: (node) => {
            // Check for list items or other formatting elements
            if ((node.name.includes('ListItem') || 
                 node.name.includes('BulletList') ||
                 node.name.includes('OrderedList') ||
                 node.name.includes('ListMark') ||
                 node.name.includes('Emph') ||
                 node.name.includes('Strong') ||
                 node.name.includes('Heading')) && 
                isInHtmlRegion(node.from, node.to, htmlRegions)) {
              
              // Add extra strong decoration to override formatting
              builder.add(node.from, node.to, Decoration.mark({
                class: 'cm-no-markdown cm-no-list-rendering cm-html-plain-text',
                attributes: { 
                  'data-force-plain': 'true',
                  'data-no-list': 'true',
                  'data-no-markdown': 'true'
                }
              }));
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
          // These rules ensure markdown formatting doesn't apply inside HTML
          '.cm-html-content .cm-formatting': {
            // Override any markdown formatting inside HTML
            color: 'inherit !important',
            fontWeight: 'inherit !important',
            fontStyle: 'inherit !important',
            textDecoration: 'inherit !important',
          },
          '.cm-html-tag-block': {
            // Additional styling for HTML tags
            color: '#0550ae !important',  // HTML tag color
          },
          '.cm-disable-markdown-parsing .cm-heading': {
            // Prevent headings from being styled inside HTML
            fontSize: 'inherit !important',
            fontWeight: 'inherit !important',
            color: 'inherit !important',
          },
          '.cm-disable-markdown-parsing .cm-strong': {
            // Prevent bold from being styled inside HTML
            fontWeight: 'inherit !important',
          },
          '.cm-disable-markdown-parsing .cm-emphasis': {
            // Prevent italic from being styled inside HTML
            fontStyle: 'inherit !important',
          },
          '.cm-disable-markdown-parsing .cm-list': {
            // Prevent lists from being styled inside HTML
            fontWeight: 'inherit !important',
          },
          '.cm-no-list-rendering .cm-list-bullet': {
            // Prevent list bullets from appearing
            color: 'inherit !important',
            fontWeight: 'inherit !important',
          },
          '.cm-html-plain-text': {
            // Additional overrides for plain text inside HTML
            fontWeight: 'inherit !important',
            fontStyle: 'inherit !important',
            fontSize: 'inherit !important',
          }
        })
    }
  );
}

/**
 * Helper function to determine if a node is within an HTML region
 */
function isInHtmlRegion(from: number, to: number, htmlRegions: {from: number, to: number}[]): boolean {
  for (const region of htmlRegions) {
    if (from >= region.from && to <= region.to) {
      return true;
    }
  }
  return false;
} 