// src/components/obsidian-editor/extensions/markdown-syntax/rules/horizontalRuleDecorator.ts
import { EditorView, Decoration, DecorationSet, WidgetType, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { markdownSyntaxStateField } from '../index'; // Ensure this path is correct

const HR_REGEX = /^(?:---|___|\*\*\*)\s*$/;

class HorizontalRuleWidget extends WidgetType {
  get estimatedHeight(): number {
    return 26; // Target line height of 25.6px, rounded up
  }

  toDOM() {
    const hr = document.createElement('hr');
    hr.className = 'cm-rendered-hr'; // Used by CSS to style the <hr>
    return hr;
  }
  ignoreEvent() {
    return false;
  }
}

export const HorizontalRuleDecorator = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet || // Rebuild if selection changes (cursor moves)
        update.state.field(markdownSyntaxStateField, false) !== update.startState.field(markdownSyntaxStateField, false)
      ) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const { state } = view;
      const currentMode = state.field(markdownSyntaxStateField).currentMode;
      const cursorPos = state.selection.main.head;

      if (currentMode === 'live') {
        for (const { from, to } of view.visibleRanges) {
          for (let pos = from; pos <= to; ) {
            const line = state.doc.lineAt(pos);
            // Handle case where loop might go past last line if last line is empty
            if (line.length === 0 && pos === to && line.from !== line.to) { 
                 pos = line.to + 1;
                 continue;
            }
            const match = HR_REGEX.exec(line.text);
            if (match) {
              const lineStart = line.from;
              const lineEnd = line.to;
              let showSyntaxAsText = false;
              // 1. Check if cursor is on the line
              if (cursorPos >= lineStart && cursorPos <= lineEnd) {
                showSyntaxAsText = true;
              } else {
                // 2. Check if the HR line is part of any selection
                for (const selectionRange of state.selection.ranges) {
                  // Check for overlap: selection starts before/at HR line end AND selection ends after/at HR line start
                  if (selectionRange.from <= lineEnd && selectionRange.to >= lineStart) {
                    showSyntaxAsText = true;
                    break; // Found an overlap, no need to check other selection ranges
                  }
                }
              }

              if (showSyntaxAsText) {
                // Cursor is on the HR line: show the syntax, style it as active
                builder.add(lineStart, lineEnd, Decoration.mark({ class: 'cm-hr-syntax-active' }));
              } else {
                // Cursor is NOT on the HR line: hide syntax, show widget (visual line)
                builder.add(lineStart, lineEnd, Decoration.replace({ widget: new HorizontalRuleWidget() }));
              }
            }
            pos = line.to + 1; // Move to the start of the next line
          }
        }
      } else if (currentMode === 'preview') {
        // Preview mode: always replace with <hr> widget if syntax matches
        for (const { from, to } of view.visibleRanges) {
          for (let pos = from; pos <= to; ) {
            const line = state.doc.lineAt(pos);
            if (line.length === 0 && pos === to && line.from !== line.to) { 
                 pos = line.to + 1;
                 continue;
            }
            const match = HR_REGEX.exec(line.text);
            if (match) {
              builder.add(line.from, line.to, Decoration.replace({ widget: new HorizontalRuleWidget() }));
            }
            pos = line.to + 1;
          }
        }
      }
      return builder.finish();
    }
  },
  {
    decorations: v => v.decorations,
  }
);
