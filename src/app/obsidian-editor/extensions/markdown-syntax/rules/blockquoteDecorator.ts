import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext } from '../types';
import { StateEffect } from '@codemirror/state';

function stripBlockquoteMarkers(line: string) {
  // Returns [level, content, markerStart, markerEnd]
  // Allow spaces between '>' markers, e.g., '> > >'
  const match = line.match(/^(\s*)((?:>\s*)+)(.*)$/);
  if (!match) return [0, line, 0, 0];
  // Count number of '>' (ignore spaces)
  const level = (match[2].match(/>/g) || []).length;
  const markerStart = 0;
  const markerEnd = match[1].length + match[2].length;
  // Remove all '>' and spaces from the start
  const content = match[3].replace(/^\s*/, '');
  return [level, content, markerStart, markerEnd];
}

class BlockquoteWidget extends WidgetType {
  constructor(readonly content: string, readonly level: number) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const container = document.createElement('blockquote');
    container.className = 'markdown-blockquote-dim';
    container.style.margin = '0';
    container.style.padding = '0 0 0 1em';
    container.style.borderLeft = `${this.level * 4}px solid #e0d9ce`;
    container.style.background = '#fcfaf7';
    container.style.color = '#6b5c3e';
    container.style.borderRadius = '4px';
    container.style.marginBottom = '0.5em';
    container.textContent = this.content;
    return container;
  }
}

class VerticalBarWidget extends WidgetType {
  toDOM() {
    const bar = document.createElement('span');
    bar.className = 'cm-blockquote-bar';
    return bar;
  }
  ignoreEvent() { return true; }
}

class EmptyWidget extends WidgetType {
  toDOM() {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    span.style.width = '1ch';
    span.style.height = '1em';
    span.style.verticalAlign = 'middle';
    return span;
  }
  ignoreEvent() { return true; }
}

class BlockquoteBarWidget extends WidgetType {
  constructor(readonly level: number) {
    super();
  }
  toDOM() {
    const span = document.createElement('span');
    for (let i = 0; i < this.level; i++) {
      const bar = document.createElement('span');
      bar.className = 'cm-blockquote-bar';
      span.appendChild(bar);
    }
    return span;
  }
  ignoreEvent() { return true; }
}

export class BlockquoteDecorator implements SyntaxRule {
  process(context: SyntaxRuleContext): void {
    const { docText, textSliceFrom, decorations, currentMode, cursorPositions, view } = context;
    if (!decorations) return;
    const lines = docText.split('\n');
    if (currentMode === 'preview') {
      // Render each blockquote line with uniform bars (no space between bars)
      let charPos = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const match = lineText.match(/^(\s*)((?:>\s*)+)(.*)$/);
        if (match && lineText.length > 0) {
          const markerStr = String(match[2]);
          const barCount = (markerStr.match(/>/g) || []).length;
          const lineStartInDoc = charPos;
          const markerStart = lineStartInDoc + match[1].length;
          // Replace the entire marker region with a widget of bars
          decorations.push({
            from: markerStart,
            to: markerStart + markerStr.length,
            decoration: Decoration.replace({ widget: new BlockquoteBarWidget(barCount) })
          });
        }
        charPos += lineText.length + 1;
      }
    } else {
      // LIVE MODE: For each blockquote line, hide '>' markers, apply nesting class and calculated padding.
      let charPos = 0;
      const lineSpacingEm = 0.8;
      const lineWidthPx = 4;
      const textPaddingEm = 0.4;

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const match = lineText.match(/^(\s*)((?:>\s*)+)(.*)$/);
        if (match && lineText.length > 0) {
          const markerStr = String(match[2]);
          const level = (markerStr.match(/>/g) || []).length;
          const lineStartInDoc = charPos;
          const lineEndInDoc = charPos + lineText.length;
          const isActive = cursorPositions.some(pos => pos >= lineStartInDoc && pos <= lineEndInDoc);
          if (!isActive && level > 0) {
            const markerStart = lineStartInDoc + match[1].length;
            // Render a bar only at the actual positions of '>' in the marker region
            for (let k = 0; k < markerStr.length; k++) {
              if (markerStr[k] === '>') {
                decorations.push({
                  from: markerStart + k,
                  to: markerStart + k + 1,
                  decoration: Decoration.replace({ widget: new VerticalBarWidget() })
                });
              }
            }
          }
        }
        charPos += lineText.length + 1;
      }
    }
  }
}

// Note: For full markdown rendering inside blockquotes, you could use a markdown renderer or recursively apply syntaxRules in the widget. 