import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext } from '../types';

// Helper to create the copy button and its functionality
function createCopyButton(textToCopy: string): HTMLElement {
  const button = document.createElement('button');
  button.className = 'cm-indent-copy-button';
  button.innerHTML = '<span>Copy</span>'; // Replace with an icon if you have one
  button.title = 'Copy code block';
  button.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent editor focus or other side effects
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Optional: Show a temporary 'Copied!' message or change button appearance
      const originalText = button.innerHTML;
      button.innerHTML = '<span>Copied!</span>';
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Optional: Show an error message
    });
  });
  return button;
}

class CodeBlockWidget extends WidgetType {
  constructor(readonly codeLines: string[], readonly language: string | null, readonly fullBlockRawText: string) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cm-preview-indent-block cm-fenced-code-block-preview'; // Added specific class

    const preElement = document.createElement('pre');
    preElement.className = 'cm-preview-indent-text'; // Keep for consistency, or use a new one
    
    const codeElement = document.createElement('code');
    if (this.language) {
      codeElement.className = `language-${this.language.toLowerCase()}`;
    }
    codeElement.textContent = this.codeLines.join('\n');
    
    preElement.appendChild(codeElement);
    container.appendChild(preElement);
    container.appendChild(createCopyButton(this.fullBlockRawText));

    return container;
  }

  ignoreEvent(event: Event): boolean {
    // Allow clicks on the copy button
    if (event.type === 'click' && (event.target as HTMLElement).closest('.cm-indent-copy-button')) {
      return false;
    }
    // Ignore other events to make it non-editable
    return true;
  }
}

export class FencedCodeBlockDecorator implements SyntaxRule {
  process(context: SyntaxRuleContext): void {
    const { state, docText, textSliceFrom, decorations, currentMode } = context;

    if (!decorations) {
      return;
    }

    const lines = docText.split('\n');
    
    if (currentMode === 'preview') {
      // --- PREVIEW MODE LOGIC (existing) ---
      let i = 0; 
      while (i < lines.length) {
        const lineText = lines[i];
        const fenceMatch = lineText.match(/^(\s*)(`{3,}|~{3,})(.*)$/);

        if (fenceMatch) {
          const leadingWhitespace = fenceMatch[1];
          const fenceType = fenceMatch[2];
          const langSpecifierRaw = fenceMatch[3].trim();
          const language = langSpecifierRaw.split(/\s+/)[0] || null;
          const blockStartLineIndex = i;

          let currentPosInSliceOffset = 0;
          for (let k = 0; k < blockStartLineIndex; k++) {
            currentPosInSliceOffset += lines[k].length + 1;
          }
          const blockStartPosInDoc = textSliceFrom + currentPosInSliceOffset;
          
          let currentBlockRawLines: string[] = [lineText];
          let codeContentLines: string[] = [];
          
          i++; 
          let blockEndLineIndex = -1;

          while (i < lines.length) {
            const currentLineText = lines[i];
            currentBlockRawLines.push(currentLineText);
            const closingFenceMatch = currentLineText.match(/^(\s*)(`{3,}|~{3,})\s*$/);

            if (closingFenceMatch && closingFenceMatch[1] === leadingWhitespace && closingFenceMatch[2] === fenceType) {
              blockEndLineIndex = i;
              currentPosInSliceOffset = 0;
              for (let k = 0; k <= blockEndLineIndex; k++) {
                currentPosInSliceOffset += lines[k].length + 1;
              }
              let blockEndPosInDoc = textSliceFrom + currentPosInSliceOffset;
              if (blockEndLineIndex === lines.length - 1 && !docText.endsWith('\n')) {
                   blockEndPosInDoc = textSliceFrom + currentPosInSliceOffset - 1;
              }
              const fullBlockRawText = currentBlockRawLines.join('\n');
              const widget = new CodeBlockWidget(codeContentLines, language, fullBlockRawText);
              decorations.push({
                from: blockStartPosInDoc, to: blockEndPosInDoc,
                decoration: Decoration.replace({ widget: widget, block: true })
              });
              break; 
            } else {
              if (leadingWhitespace.length > 0 && currentLineText.startsWith(leadingWhitespace)) {
                codeContentLines.push(currentLineText.substring(leadingWhitespace.length));
              } else if (leadingWhitespace.length === 0) {
                codeContentLines.push(currentLineText);
              } else {
                codeContentLines.push(currentLineText);
              }
            }
            i++; 
          }
          if (blockEndLineIndex === -1) { /* unclosed block */ }
        }
        i++; 
      }
    } else if (currentMode === 'live') {
      // --- LIVE MODE LOGIC (new) ---
      let lineStartIndexInSlice = 0; // Start char offset of the current line within docText slice

      for (let i = 0; i < lines.length; /* i incremented inside or at end */) {
        const lineText = lines[i];
        const currentLineActualStartInDoc = textSliceFrom + lineStartIndexInSlice;
        const currentLineActualEndInDoc = currentLineActualStartInDoc + lineText.length;

        const fenceMatch = lineText.match(/^(\s*)(`{3,}|~{3,})(.*)$/);

        if (fenceMatch) {
          const leadingWhitespace = fenceMatch[1];
          const fenceType = fenceMatch[2];
          const langSpecifierRaw = fenceMatch[3].trim();

          // Decorate opening fence line (current line `i`)
          // Apply line decoration for full-width background
          decorations.push({
            from: currentLineActualStartInDoc,
            to: currentLineActualStartInDoc, // For Decoration.line
            decoration: Decoration.line({ attributes: { class: 'cm-live-fenced-code-fence-line' } })
          });
          // Decorate language specifier
          if (langSpecifierRaw) {
              const langSpecOffsetInLine = leadingWhitespace.length + fenceType.length;
              decorations.push({
                  from: currentLineActualStartInDoc + langSpecOffsetInLine,
                  to: currentLineActualStartInDoc + langSpecOffsetInLine + langSpecifierRaw.length,
                  decoration: Decoration.mark({ class: 'cm-live-fenced-code-lang' })
              });
          }

          let nextLineStartInSliceForInnerLoop = lineStartIndexInSlice + lineText.length + 1; 

          // Inner loop for content and closing fence
          let foundClosingFence = false;
          for (let j = i + 1; j < lines.length; j++) {
            const innerLineText = lines[j];
            const innerLineActualStartInDoc = textSliceFrom + nextLineStartInSliceForInnerLoop;
            const innerLineActualEndInDoc = innerLineActualStartInDoc + innerLineText.length;

            const closingFenceMatch = innerLineText.match(/^(\s*)(`{3,}|~{3,})\s*$/);
            if (closingFenceMatch && closingFenceMatch[1] === leadingWhitespace && closingFenceMatch[2] === fenceType) {
              // Decorate closing fence line
              // Apply line decoration for full-width background
              decorations.push({
                from: innerLineActualStartInDoc,
                to: innerLineActualStartInDoc, // For Decoration.line
                decoration: Decoration.line({ attributes: { class: 'cm-live-fenced-code-fence-line' } })
              });
              lineStartIndexInSlice = nextLineStartInSliceForInnerLoop + innerLineText.length + 1; 
              i = j + 1; 
              foundClosingFence = true;
              break; 
            } else {
              // This is a content line
              decorations.push({
                from: innerLineActualStartInDoc, 
                to: innerLineActualStartInDoc, // For Decoration.line, 'to' is same as 'from'
                decoration: Decoration.line({ 
                  attributes: { class: 'cm-live-fenced-code-content-line' },
                  atomic: true // Prevent other Markdown rules from processing inside
                })
              });
              nextLineStartInSliceForInnerLoop += innerLineText.length + 1;
            }
          }
          
          if (!foundClosingFence) {
            // Block is unclosed, extends to the end of the slice
            // All subsequent lines until end of slice were processed as content by the inner loop.
            lineStartIndexInSlice = nextLineStartInSliceForInnerLoop; // Should be end of slice
            i = lines.length; // Terminate outer loop
          }
          continue; // Processed a block (or unclosed block), restart outer loop
        }

        // No fence match on current line `i`, advance for outer loop
        lineStartIndexInSlice += lineText.length + 1;
        i++;
      }
    }
  }
}
