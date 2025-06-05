import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext } from '../types';

function stripBlockquoteMarkers(line: string) {
  // Returns [level, content, markerStart, markerEnd]
  const match = line.match(/^(\s*)(>+)(\s?)(.*)$/);
  if (!match) return [0, line, 0, 0];
  const markerStart = 0;
  const markerEnd = match[1].length + match[2].length + match[3].length;
  return [match[2].length, match[4], markerStart, markerEnd];
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

export class BlockquoteDecorator implements SyntaxRule {
  process(context: SyntaxRuleContext): void {
    const { docText, textSliceFrom, decorations, currentMode, cursorPositions } = context;
    if (!decorations) return;
    const lines = docText.split('\n');
    if (currentMode === 'preview') {
      // Group blockquote lines for preview mode
      let i = 0;
      while (i < lines.length) {
        const [level, content] = stripBlockquoteMarkers(lines[i]);
        if (level > 0) {
          let blockStart = i;
          let blockLevel = level;
          let blockLines: string[] = [content];
          let blockEnd = i + 1;
          while (blockEnd < lines.length) {
            const [nextLevel] = stripBlockquoteMarkers(lines[blockEnd]);
            if (nextLevel > 0) {
              blockLines.push(lines[blockEnd].replace(/^\s*>+\s?/, ''));
              blockEnd++;
            } else {
              break;
            }
          }
          let charStart = 0;
          for (let k = 0; k < blockStart; k++) charStart += lines[k].length + 1;
          let charEnd = charStart;
          for (let k = blockStart; k < blockEnd; k++) charEnd += lines[k].length + 1;
          if (charEnd > charStart) {
            const widget = new BlockquoteWidget(blockLines.join('\n'), blockLevel);
            decorations.push({
              from: textSliceFrom + charStart,
              to: textSliceFrom + charEnd,
              decoration: Decoration.replace({ widget, block: true })
            });
          }
          i = blockEnd;
        } else {
          i++;
        }
      }
    } else {
      // LIVE MODE: For each blockquote line, hide '>' markers, apply nesting class and calculated padding.
      let charPos = 0;
      const lineSpacingEm = 0.8;
      const lineWidthPx = 4;
      const textPaddingEm = 0.4;

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const match = lineText.match(/^(\s*)(>+)(\s?)(.*)$/);

        if (match && lineText.length > 0) {
          const level = match[2].length;
          const lineStartInDoc = charPos; 
          const lineEndInDoc = charPos + lineText.length;
          const isActive = cursorPositions.some(pos => pos >= lineStartInDoc && pos <= lineEndInDoc);

          if (!isActive && level > 0) {
            // For each '>' in the marker, replace with a vertical bar widget
            let markerStart = lineStartInDoc + match[1].length;
            for (let j = 0; j < level; j++) {
              decorations.push({
                from: markerStart + j,
                to: markerStart + j + 1,
                decoration: Decoration.replace({ widget: new VerticalBarWidget() })
              });
            }
            // Optionally, if there's a space after the last '>', you can also replace it with a spacer widget or leave as is
          }
        }
        charPos += lineText.length + 1; 
      }
    }
  }
}

// Note: For full markdown rendering inside blockquotes, you could use a markdown renderer or recursively apply syntaxRules in the widget. 