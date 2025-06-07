import { EditorView, ViewPlugin, ViewUpdate, PluginValue, Decoration, DecorationSet } from '@codemirror/view';
import { Extension, StateEffect, StateField } from '@codemirror/state';
import { buildHtmlDecorations } from './decorations';
import { addHtmlStyles } from './styles';
import { DANGEROUS_TAGS } from './types';

/**
 * HtmlDecorator plugin to handle HTML rendering and editing in the editor
 */
class HtmlDecoratorPlugin implements PluginValue {
  private view: EditorView;
  private enabled = true;
  private debug = true;
  private updateScheduled = false;
  private isDestroyed = false;
  private lastSelectionHead = -1;
  
  constructor(view: EditorView) {
    this.view = view;
    
    // Add styles on plugin initialization
    addHtmlStyles();
    
    // Initialize last selection position
    if (view.state.selection.ranges.length > 0) {
      this.lastSelectionHead = view.state.selection.main.head;
    }
    
    // Schedule initial decorations update
    setTimeout(() => {
      this.updateDecorations();
    }, 100);
    
    console.log('HtmlDecorator plugin initialized');
  }

  /**
   * Update the view - rebuild decorations when editor changes
   */
  update(update: ViewUpdate): void {
    if (!this.enabled || this.isDestroyed) return;
    
    // Check if content or selection changed
    const contentChanged = update.docChanged;
    const selectionChanged = update.selectionSet;
    
    // Check if cursor moved significantly
    let cursorMoved = false;
    if (selectionChanged && update.state.selection.ranges.length > 0) {
      const newHead = update.state.selection.main.head;
      // Only count significant cursor movements (more than just character by character)
      cursorMoved = Math.abs(newHead - this.lastSelectionHead) > 1;
      this.lastSelectionHead = newHead;
      
      if (cursorMoved) {
        console.log("Cursor moved - checking HTML regions");
      }
    }
    
    if (contentChanged) {
      console.log("Document changed - scheduling HTML decoration update");
    }
    
    // Update on content change or significant cursor movement
    if ((contentChanged || cursorMoved) && !this.updateScheduled) {
      console.log('HtmlDecorator: Scheduling update due to', 
        contentChanged ? 'content change' : 'cursor movement');
      
      // Schedule decoration update at the end of the current event loop
      this.updateScheduled = true;
      setTimeout(() => {
        this.updateDecorations();
        this.updateScheduled = false;
      }, 0);
    }
  }
  
  /**
   * Update decorations using the measure/notify pattern
   */
  private updateDecorations(): void {
    if (this.isDestroyed) return;
    
    try {
      console.log("Updating HTML decorations");
      // Build decorations
      const decorations = buildHtmlDecorations(this.view);
      
      // Apply the decorations using the state effect
      this.view.dispatch({
        effects: setHtmlDecorations.of(decorations)
      });
    } catch (error) {
      console.error('Error updating HTML decorations:', error);
    }
  }

  /**
   * Clean up resources when plugin is removed
   */
  destroy(): void {
    this.updateScheduled = false;
    this.isDestroyed = true;
    
    console.log('HtmlDecorator plugin destroyed');
  }
}

// Define state effect for setting decorations
export const setHtmlDecorations = StateEffect.define<DecorationSet>();

/**
 * State field for HTML decorations
 */
export const htmlDecorationsField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (decorations, tr) => {
    // Always rebuild decorations when doc changes
    if (tr.docChanged) {
      return Decoration.none; // Clear decorations to force rebuild
    }
    
    // Move decorations if document changes
    decorations = decorations.map(tr.changes);
    
    // Apply any decoration effects
    for (const effect of tr.effects) {
      if (effect.is(setHtmlDecorations)) {
        decorations = effect.value;
      }
    }
    
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

/**
 * Create HTML decorator extension for CodeMirror
 */
export function htmlDecorator(): Extension {
  return [
    htmlDecorationsField,
    ViewPlugin.define(view => new HtmlDecoratorPlugin(view))
  ];
}

/**
 * Export HTML decorator types and constants
 */
export { DANGEROUS_TAGS };

/**
 * Add HTML styles to document
 */
export { addHtmlStyles };

// Also export under the original name for backward compatibility
export const HTMLTagDecorator = htmlDecorator;

// Re-export types and utilities
export * from './types';
export { buildHtmlDecorations } from './decorations';
export { detectHtmlRegions, isCursorNearRegion } from './tag-detector'; 