import { ViewPlugin, DecorationSet, EditorView } from '@codemirror/view';
import { buildHtmlDecorations } from './decorations';
import { addHtmlStyles } from './styles';

/**
 * ViewPlugin for HTML decorations in markdown
 * - Detects HTML regions in markdown
 * - Shows syntax-highlighted code when the cursor is near HTML
 * - Shows rendered HTML preview when cursor is away or in preview mode
 */
export const htmlDecorator = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      // Add the CSS styles once at creation
      addHtmlStyles();
      
      // Initialize decorations
      this.decorations = buildHtmlDecorations(view);
    }
    
    update(update: ViewUpdate) {
      // Update decorations whenever the document changes or selection changes
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildHtmlDecorations(update.view);
      }
    }
  },
  {
    // Simply provide decorations without making them atomic
    decorations: (plugin) => plugin.decorations
  }
);

// Also export under the original name for backward compatibility
export const HTMLTagDecorator = htmlDecorator;

// Re-export types and utilities
export * from './types';
export { buildHtmlDecorations } from './decorations';
export { detectHtmlRegions, isCursorNearRegion } from './tag-detector'; 