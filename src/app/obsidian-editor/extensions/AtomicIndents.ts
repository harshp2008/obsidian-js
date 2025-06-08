'use client';

import { ViewPlugin, ViewUpdate, Decoration, EditorView as CMEditorView } from '@codemirror/view';
import { RangeSet, RangeSetBuilder } from '@codemirror/state';
import { Extension } from '@codemirror/state';
import { isListItem } from '../utils/formatting/linkAndListFormatting';
import { isBlockquote } from '../utils/formatting/indentationUtils';

/**
 * Non-breaking space character used for indentation
 */
const NBSP = '\u00A0'; // Non-breaking space

/**
 * Standard indentation unit (4 spaces)
 */
const INDENT_UNIT = NBSP.repeat(4);

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
   * @param update - The view update object
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
    const builder = new RangeSetBuilder<Decoration>();
    
    for (const { from, to } of view.visibleRanges) {
      let pos = from;
      while (pos <= to) {
        const line = view.state.doc.lineAt(pos);
        const lineText = line.text;
        
        // Handle non-breaking space indents
        let searchPosInLine = 0;
        while ((searchPosInLine = lineText.indexOf(INDENT_UNIT, searchPosInLine)) !== -1) {
          const matchStart = line.from + searchPosInLine;
          const matchEnd = matchStart + INDENT_UNIT.length;
          if (matchStart < to && matchEnd > from) {
            builder.add(matchStart, matchEnd, Decoration.mark({
              class: "cm-atomic-indent"
            })); 
          }
          searchPosInLine = searchPosInLine + INDENT_UNIT.length;
          if (searchPosInLine >= line.length) break;
        }
        
        // Handle list item indentation with regular spaces
        if (isListItem(lineText)) {
          // Find leading spaces in list items
          const leadingSpacesMatch = lineText.match(/^(\s+)/);
          if (leadingSpacesMatch && leadingSpacesMatch[1]) {
            const spaces = leadingSpacesMatch[1];
            // Make groups of 4 spaces atomic
            for (let i = 0; i < spaces.length; i += 4) {
              const chunkSize = Math.min(4, spaces.length - i);
              if (chunkSize === 4) {
                builder.add(
                  line.from + i, 
                  line.from + i + 4, 
                  Decoration.mark({ 
                    class: "cm-atomic-indent cm-list-indent" 
                  })
                );
              }
            }
          }
        }
        
        // Handle blockquote indentation
        if (isBlockquote(lineText)) {
          // Make each "> " marker atomic
          const blockquoteMatches = lineText.matchAll(/>\s*/g);
          let offset = 0;
          for (const match of blockquoteMatches) {
            if (match.index !== undefined) {
              const matchPos = line.from + match.index;
              const matchLen = match[0].length;
              builder.add(
                matchPos,
                matchPos + matchLen,
                Decoration.mark({ 
                  class: "cm-atomic-indent cm-blockquote-indent" 
                })
              );
              offset += matchLen;
            }
          }
        }
        
        pos = line.to + 1;
      }
    }
    
    const result = builder.finish();
    return result;
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
 * Extension that provides atomic indentation behavior
 * This makes groups of non-breaking spaces behave as a single unit
 * for cursor movement and selection
 */
export const atomicIndents: Extension = [
  atomicIndentPlugin,
  atomicRangesFacetProvider,
  atomicIndentsStyle
];
