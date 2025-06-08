'use client';

import { ViewPlugin, ViewUpdate, Decoration, EditorView as CMEditorView } from '@codemirror/view';
import { RangeSet, RangeSetBuilder } from '@codemirror/state';
import { Extension } from '@codemirror/state';
import { isListItem } from '../utils/formatting/linkAndListFormatting';
import { isBlockquote, INDENT_UNIT } from '../utils/formatting/indentationUtils';
import {
  DecorationSet,
  WidgetType,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { SyntaxNode } from '@lezer/common';

/**
 * Type definition for atomic decoration
 */
interface AtomicDecoration {
  from: number;
  to: number;
  decoration: Decoration;
}

/**
 * Plugin class that handles atomic indentation in the editor.
 * This ensures that indentation spaces are treated as a single unit
 * for cursor movement and selection purposes.
 */
class AtomicIndentPluginValue {
  /** The set of ranges that should be treated as atomic units */
  atomicRanges: RangeSet<Decoration>;

  /**
   * Creates a new instance of the atomic indent plugin
   * @param view - The CodeMirror editor view
   */
  constructor(view: CMEditorView) {
    this.atomicRanges = this.buildAtomicRanges(view);
  }

  /**
   * Updates the atomic ranges when the document or viewport changes
   * @param update - ViewUpdate
   */
  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.atomicRanges = this.buildAtomicRanges(update.view);
    }
  }

  /**
   * Builds the set of atomic ranges based on the current document content
   * @param view - The CodeMirror editor view
   * @returns A RangeSet containing all atomic indent ranges
   */
  buildAtomicRanges(view: CMEditorView): RangeSet<Decoration> {
    // Process each line and collect all decorations
    const allDecorations: AtomicDecoration[] = [];
    
    for (const { from, to } of view.visibleRanges) {
      let pos = from;
      while (pos <= to) {
        const line = view.state.doc.lineAt(pos);
        const lineText = line.text;
        
        // Process regular indentation (only at the beginning of lines)
        this.processSpacesIndentation(lineText, line.from, allDecorations);
        
        // Process list indentation
        if (isListItem(lineText)) {
          this.processListIndentation(lineText, line.from, allDecorations);
        }
        
        // Process blockquote indentation
        if (isBlockquote(lineText)) {
          this.processBlockquoteIndentation(lineText, line.from, allDecorations);
        }
        
        pos = line.to + 1;
      }
    }
    
    // Sort the decorations by from position
    allDecorations.sort((a, b) => a.from - b.from);
    
    // Create the range set
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to, decoration } of allDecorations) {
      if (from < to) {  // Ensure valid range
        try {
          builder.add(from, to, decoration);
        } catch (error) {
          console.warn("Failed to add atomic decoration:", from, to, error);
        }
      }
    }
    
    return builder.finish();
  }
  
  /**
   * Process standard space indentation in text
   * IMPORTANT: Only process spaces at the beginning of the line
   */
  private processSpacesIndentation(lineText: string, lineStart: number, decorations: AtomicDecoration[]) {
    // Only handle indentation at the beginning of lines
    const leadingSpacesMatch = lineText.match(/^(\s+)/);
    if (!leadingSpacesMatch) return;
    
    const leadingSpaces = leadingSpacesMatch[1];
    let pos = 0;
    
    // Process leading spaces in chunks of 4
    while (pos + 4 <= leadingSpaces.length) {
      decorations.push({
        from: lineStart + pos,
        to: lineStart + pos + 4,
        decoration: Decoration.mark({
          class: "cm-atomic-indent",
          inclusive: true,
          atomic: true
        })
      });
      pos += 4;
    }
    
    // Handle remaining spaces if any
    const remainingSpaces = leadingSpaces.length % 4;
    if (remainingSpaces > 0) {
      decorations.push({
        from: lineStart + pos,
        to: lineStart + pos + remainingSpaces,
        decoration: Decoration.mark({
          class: "cm-atomic-indent",
          inclusive: true,
          atomic: true
        })
      });
    }
  }
  
  /**
   * Process list indentation
   */
  private processListIndentation(lineText: string, lineStart: number, decorations: AtomicDecoration[]) {
    // Handle leading spaces in lists
    const leadingMatch = lineText.match(/^(\s+)/);
    if (leadingMatch && leadingMatch[1]) {
      const spaces = leadingMatch[1];
      for (let i = 0; i < Math.floor(spaces.length / 4) * 4; i += 4) {
        decorations.push({
          from: lineStart + i,
          to: lineStart + i + 4,
          decoration: Decoration.mark({
            class: "cm-atomic-indent cm-list-indent",
            inclusive: true,
            atomic: true
          })
        });
      }
    }
    
    // Handle indentation after list markers
    const markerMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s+/);
    if (markerMatch) {
      const afterMarker = lineText.substring(markerMatch[0].length);
      const afterMarkerIndent = afterMarker.match(/^(\s+)/);
      
      if (afterMarkerIndent && afterMarkerIndent[1]) {
        const indentStart = lineStart + markerMatch[0].length;
        const spaces = afterMarkerIndent[1];
        
        for (let i = 0; i < Math.floor(spaces.length / 4) * 4; i += 4) {
          decorations.push({
            from: indentStart + i,
            to: indentStart + i + 4,
            decoration: Decoration.mark({
              class: "cm-atomic-indent cm-list-indent",
              inclusive: true,
              atomic: true
            })
          });
        }
      }
    }
  }
  
  /**
   * Process blockquote indentation
   */
  private processBlockquoteIndentation(lineText: string, lineStart: number, decorations: AtomicDecoration[]) {
    // Match blockquote structure: (leading spaces)(blockquote markers)(content)
    const match = lineText.match(/^(\s*)((?:>)(?:\s*)(?:>?\s*)*)(.*)/);
    if (!match) return;
    
    const leadingSpaces = match[1] || '';
    const blockquoteSection = match[2]; 
    const content = match[3];
    
    // Process leading spaces
    if (leadingSpaces.length > 0) {
      // Handle leading spaces in chunks of 4
      for (let i = 0; i < Math.floor(leadingSpaces.length / 4) * 4; i += 4) {
        decorations.push({
          from: lineStart + i,
          to: lineStart + i + 4,
          decoration: Decoration.mark({
            class: "cm-atomic-indent",
            inclusive: true,
            atomic: true
          })
        });
      }
      
      // Handle remaining spaces if any
      const remainingSpaces = leadingSpaces.length % 4;
      if (remainingSpaces > 0) {
        decorations.push({
          from: lineStart + leadingSpaces.length - remainingSpaces,
          to: lineStart + leadingSpaces.length,
          decoration: Decoration.mark({
            class: "cm-atomic-indent",
            inclusive: true,
            atomic: true
          })
        });
      }
    }
    
    // Process blockquote markers (make only the '>' character atomic, not spaces)
    let pos = lineStart + leadingSpaces.length;
    let inMarker = false;
    
    for (let i = 0; i < blockquoteSection.length; i++) {
      const char = blockquoteSection[i];
      if (char === '>') {
        // Make the '>' character atomic
        decorations.push({
          from: pos,
          to: pos + 1,
          decoration: Decoration.mark({
            class: "cm-atomic-indent cm-blockquote-indent",
            inclusive: true,
            atomic: true
          })
        });
      }
      // Spaces are intentionally left non-atomic for navigation
      pos++;
    }
  }
}

/**
 * ViewPlugin that creates and manages the atomic indent functionality
 */
const atomicIndentPlugin = ViewPlugin.fromClass(AtomicIndentPluginValue);

/**
 * Facet provider that supplies the atomic ranges to the editor view
 */
const atomicRangesFacetProvider = CMEditorView.atomicRanges.of(view => {
  const pluginValue = view.plugin(atomicIndentPlugin);
  if (pluginValue) {
    return pluginValue.atomicRanges || RangeSet.empty;
  }
  return RangeSet.empty;
});

/**
 * The CSS styles for atomic indents
 */
const atomicIndentsStyle = CMEditorView.baseTheme({
  ".cm-atomic-indent": {
    caretColor: "transparent",
  },
  ".cm-list-indent": {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  ".cm-blockquote-indent": {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  }
});

/**
 * Combined extension for atomic indents
 */
export const atomicIndents = [
  atomicIndentPlugin,
  atomicRangesFacetProvider,
  atomicIndentsStyle
];

export default atomicIndents;
