import { Decoration, WidgetType, EditorView, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { markdownSyntaxStateField } from '../index'; // Assuming index.ts is one level up
import { syntaxTree } from '@codemirror/language';

/**
 * Regular expression to match two or more spaces at the end of a line (markdown line break)
 * This pattern is more specific to find exactly two spaces followed by nothing or a newline
 */
const LINE_BREAK_REGEX = /\s{2,}(?=$|\n)/gm;

/**
 * Widget for preview mode that renders a visual indicator for line breaks
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

  // Process each visible line in the document
  for (const { from, to } of view.visibleRanges) {
    // Go through line by line for more precise control
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      
      // Check for trailing spaces at the end of the line
      let lineText = line.text;
      let trailingSpacesMatch = lineText.match(/(\s{2,})$/);
      
      if (trailingSpacesMatch && trailingSpacesMatch[1]) {
        const trailingSpaces = trailingSpacesMatch[1];
        const spacesStartPos = line.to - trailingSpaces.length;
        
        // In preview mode, we want to show a visual line break indicator
        if (currentMode === 'preview') {
          // Style the trailing spaces
          builder.add(
            spacesStartPos,
            line.to,
            liveLineBreakMark
          );
          
          // Add a visual indicator (↵) right after the spaces
          builder.add(
            line.to,
            line.to,
            Decoration.widget({
              widget: new LineBreakVisualIndicator(),
              side: -1 // Position before the newline
            })
          );
          
          // Also ensure the next line gets proper paragraph styling in preview mode
          // by adding extra space after
          if (pos < view.state.doc.length) {
            builder.add(
              line.to,
              line.to,
              Decoration.mark({
                class: 'cm-line-break-after',
                attributes: { 'data-line-break': 'true' }
              })
            );
          }
        } else {
          // In live mode, just subtly highlight the spaces
          builder.add(
            spacesStartPos,
            line.to,
            Decoration.mark({
              class: 'cm-line-break-syntax',
              attributes: { 'data-line-break': 'true' }
            })
          );
        }
      }
      
      // Move to the next line
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
      // Check if mode has changed or document/viewport has changed
      const modeStateChanged = update.startState.field(markdownSyntaxStateField, false)?.currentMode !== 
                              update.state.field(markdownSyntaxStateField, false)?.currentMode;
                              
      if (update.docChanged || update.viewportChanged || update.selectionSet || modeStateChanged) {
        this.decorations = buildLineBreakDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
