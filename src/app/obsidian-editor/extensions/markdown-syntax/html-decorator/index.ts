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
  private debug = false;
  private updateScheduled = false;
  private isDestroyed = false;
  private lastSelectionHead = -1;
  private htmlRegions: Array<{from: number, to: number}> = [];
  
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
    
    if (this.debug) console.log('HtmlDecorator plugin initialized');
  }

  /**
   * Update the view - rebuild decorations when editor changes
   */
  update(update: ViewUpdate): void {
    if (!this.enabled || this.isDestroyed) return;
    
    // Check if content changed
    const contentChanged = update.docChanged;
    const selectionChanged = update.selectionSet;
    
    // Check if cursor moved
    let cursorMoved = false;
    if (selectionChanged && update.state.selection.ranges.length > 0) {
      const newHead = update.state.selection.main.head;
      cursorMoved = newHead !== this.lastSelectionHead;
      this.lastSelectionHead = newHead;
    }
    
    // Only update if:
    // 1. Content changed AND might affect HTML (we'll check this below)
    // 2. Cursor moved near or away from an HTML region
    
    // Quick check - if content changed, is it affecting any known HTML region?
    let htmlContentChanged = false;
    if (contentChanged) {
      // Check if any changes overlap with known HTML regions
      update.changes.iterChanges((fromA, toA, fromB, toB) => {
        // If we've already determined HTML content changed, skip further checks
        if (htmlContentChanged) return;
        
        // Check if this change overlaps with any known HTML region
        for (const region of this.htmlRegions) {
          if (fromA <= region.to && toA >= region.from) {
            htmlContentChanged = true;
            break;
          }
        }
        
        // If the change doesn't overlap with known regions, we'll need to detect
        // if it might have created a new HTML region (simple heuristic check for tags)
        if (!htmlContentChanged) {
          const changedText = update.state.doc.sliceString(fromB, toB);
          htmlContentChanged = changedText.includes('<') && changedText.includes('>');
        }
      });
    }
    
    // Check if cursor moved to/from HTML region
    let cursorMovedToFromHtml = false;
    if (cursorMoved) {
      // Check if cursor is within any known HTML region
      const currentPosition = update.state.selection.main.head;
      const cursorInHtmlRegion = this.htmlRegions.some(
        region => currentPosition >= region.from && currentPosition <= region.to
      );
      
      // Only consider exact boundaries, not adjacent positions
      if (!cursorInHtmlRegion) {
        cursorMovedToFromHtml = this.htmlRegions.some(
          region => currentPosition === region.from || currentPosition === region.to
        );
      } else {
        cursorMovedToFromHtml = true;
      }
    }
    
    // Schedule updates for both content changes and cursor movements
    // IMPORTANT: Always use setTimeout to avoid updating during an update cycle
    if ((contentChanged && htmlContentChanged) || cursorMoved) {
      const reason = contentChanged ? 'HTML content change' : 'cursor movement';
      if (this.debug) console.log(`HtmlDecorator: Scheduling update due to ${reason}`);
      
      // Always schedule updates at the end of the current update cycle to avoid errors
      if (!this.updateScheduled) {
        this.updateScheduled = true;
        setTimeout(() => {
          this.updateDecorations();
          this.updateScheduled = false;
        }, 0);
      }
    }
  }
  
  /**
   * Update decorations using the measure/notify pattern
   */
  private updateDecorations(): void {
    if (this.isDestroyed) return;
    
    try {
      if (this.debug) console.log("Updating HTML decorations");
      // Build decorations
      const decorations = buildHtmlDecorations(this.view);
      
      // Update our cached HTML regions
      this.updateHtmlRegions();
      
      // Apply the decorations using the state effect
      this.view.dispatch({
        effects: setHtmlDecorations.of(decorations)
      });
    } catch (error) {
      console.error('Error updating HTML decorations:', error);
    }
  }
  
  /**
   * Update the cached list of HTML regions
   */
  private updateHtmlRegions(): void {
    try {
      const { state } = this.view;
      const doc = state.doc;
      const fullText = doc.toString();
      
      // Quick regex to find HTML regions (not perfect but good enough for caching)
      const regions: Array<{from: number, to: number}> = [];
      const htmlRegex = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
      let match: RegExpExecArray | null;
      
      while ((match = htmlRegex.exec(fullText)) !== null) {
        regions.push({
          from: match.index,
          to: match.index + match[0].length
        });
      }
      
      this.htmlRegions = regions;
    } catch (error) {
      console.error('Error updating HTML regions cache:', error);
    }
  }

  /**
   * Clean up resources when plugin is removed
   */
  destroy(): void {
    this.updateScheduled = false;
    this.isDestroyed = true;
    
    if (this.debug) console.log('HtmlDecorator plugin destroyed');
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