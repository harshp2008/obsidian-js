'use client';

import { ViewPlugin, ViewUpdate, Decoration, EditorView as CMEditorView } from '@codemirror/view';
import { RangeSet, RangeSetBuilder } from '@codemirror/state';
import { Extension } from '@codemirror/state';

// Define the indent unit (must match FormattingFunctions.ts)
const NBSP = '\u00A0'; // Non-breaking space
const INDENT_UNIT = NBSP.repeat(4);

// The class that holds the state and logic for our plugin
class AtomicIndentPluginValue {
  atomicRanges: RangeSet<Decoration>;

  constructor(view: CMEditorView) {
    this.atomicRanges = this.buildAtomicRanges(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.atomicRanges = this.buildAtomicRanges(update.view);
    }
  }

  buildAtomicRanges(view: CMEditorView): RangeSet<Decoration> {
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      let pos = from;
      while (pos <= to) {
        const line = view.state.doc.lineAt(pos);
        let match;
        const lineText = line.text;
        let searchPosInLine = 0;
        while ((match = lineText.indexOf(INDENT_UNIT, searchPosInLine)) !== -1) {
          const matchStart = line.from + match;
          const matchEnd = matchStart + INDENT_UNIT.length;
          if (matchStart < to && matchEnd > from) {
            builder.add(matchStart, matchEnd, Decoration.mark({})); 
          }
          searchPosInLine = match + INDENT_UNIT.length;
          if (searchPosInLine >= line.length) break;
        }
        pos = line.to + 1;
      }
    }
    const result = builder.finish();
    return result;
  }
}

// Create the ViewPlugin from our class. No `provide` in the spec here for atomicRanges.
const atomicIndentPlugin = ViewPlugin.fromClass(AtomicIndentPluginValue);

// Create the facet provider for atomicRanges.
const atomicRangesFacetProvider = CMEditorView.atomicRanges.of(view => {
  const pluginValue = view.plugin(atomicIndentPlugin); // Get the instance of AtomicIndentPluginValue for this view
  if (pluginValue) {
    return pluginValue.atomicRanges || RangeSet.empty;
  }
  // Should not happen if the plugin is correctly added to extensions
  return RangeSet.empty;
});

// Export both the plugin and its facet provider as a single extension array.
export const atomicIndents: Extension = [
  atomicIndentPlugin,
  atomicRangesFacetProvider
];
