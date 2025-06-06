import { Decoration, WidgetType, EditorView, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { markdownSyntaxStateField } from '../index'; // Assuming index.ts is one level up
import { syntaxTree } from '@codemirror/language';

/**
 * Regular expression to match two or more spaces at the end of a line (markdown line break)
 */
const LINE_BREAK_REGEX = /\s{2,}$/m;

/**
 * Widget for preview mode that renders a visual indicator for line breaks.
 * Instead of actually replacing the breaks, which causes issues, we just
 * style them differently.
 */
class LineBreakVisualIndicator extends WidgetType {
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-line-break-indicator';
    span.innerHTML = '↵'; // Visual indicator for line break
    span.style.color = '#888';
    span.style.fontSize = '0.85em';
    span.style.verticalAlign = 'text-top';
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Decoration for live mode (subtly indicates the two spaces)
 */
const liveLineBreakMark = Decoration.mark({
  class: 'cm-line-break-syntax'
});

/**
 * Builds decorations for line breaks in the document
 * @param view - The editor view
 * @returns A set of decorations
 */
function buildLineBreakDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const modeState = view.state.field(markdownSyntaxStateField, false);
  const currentMode = modeState ? modeState.currentMode : 'live';

  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos < to; ) {
      const line = view.state.doc.lineAt(pos);
      const match = LINE_BREAK_REGEX.exec(line.text);

      if (match) {
        const lineBreakStart = line.from + match.index;
        const lineBreakEnd = line.to; 
        
        if (currentMode === 'preview') {
          // Instead of replacing the spaces with a widget that includes line breaks,
          // we'll mark the spaces and add a widget after them
          builder.add(
            lineBreakEnd - 2,
            lineBreakEnd,
            liveLineBreakMark
          );
          
          // Add a visual indicator (↵) after the spaces but before actual line break
          builder.add(
            lineBreakEnd,
            lineBreakEnd,
            Decoration.widget({
              widget: new LineBreakVisualIndicator(),
              side: -1 // Position before the line break
            })
          );
        } else {
          // In live mode, just mark the spaces
          builder.add(
            lineBreakEnd - 2,
            lineBreakEnd,
            liveLineBreakMark
          );
        }
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

/**
 * ViewPlugin that handles decorating line breaks in markdown
 */
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
