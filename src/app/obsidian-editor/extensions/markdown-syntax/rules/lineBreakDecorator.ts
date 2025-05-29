import { Decoration, WidgetType, EditorView, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { markdownSyntaxStateField } from '../index'; // Assuming index.ts is one level up
import { syntaxTree } from '@codemirror/language';

const LINE_BREAK_REGEX = /\s{2,}$/m; // Matches two spaces at the end of a line

// Widget for preview mode (renders a <br> tag)
class LineBreakPreviewWidget extends WidgetType {
  toDOM() {
    const br = document.createElement('br');
    return br;
  }

  ignoreEvent() {
    return false;
  }
}

// Decoration for live mode (subtly indicates the two spaces)
const liveLineBreakMark = Decoration.mark({
  class: 'cm-line-break-syntax',
  // attributes: { 'data-two-spaces': 'true' } // Optional: for debugging or more specific styling
});

function buildLineBreakDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const modeState = view.state.field(markdownSyntaxStateField, false);
  const currentMode = modeState ? modeState.currentMode : 'live'; // Default to 'live' if state field is not ready

  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos < to; ) {
      const line = view.state.doc.lineAt(pos);
      const match = LINE_BREAK_REGEX.exec(line.text);

      if (match) {
        const lineBreakStart = line.from + match.index;
        const lineBreakEnd = line.to; // The two spaces are at the very end of the line content

        // Ensure we don't process already decorated or non-editable areas if necessary
        // For simplicity, we're not adding complex checks here, but in a real scenario, you might.

        if (currentMode === 'preview') {
          // In preview, replace the two spaces with a <br> widget
          // The widget should be placed *after* the text, effectively replacing the spaces
          builder.add(
            lineBreakEnd - 2, // Position of the first space
            lineBreakEnd,     // Position after the second space
            Decoration.replace({ widget: new LineBreakPreviewWidget() })
          );
        } else {
          // In live mode, mark the two spaces
          builder.add(
            lineBreakEnd - 2, // Position of the first space
            lineBreakEnd,     // Position after the second space
            liveLineBreakMark
          );
        }
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

export const LineBreakDecorator = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildLineBreakDecorations(view);
    }

    update(update: ViewUpdate) {
      const modeStateChanged = update.startState.field(markdownSyntaxStateField, false)?.currentMode !== update.state.field(markdownSyntaxStateField, false)?.currentMode;
      if (update.docChanged || update.viewportChanged || update.selectionSet || modeStateChanged) {
        this.decorations = buildLineBreakDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
