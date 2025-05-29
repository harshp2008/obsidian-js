import { Decoration } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext, DecorationItem } from '../types';
import { isCursorNearRange } from './utils';

export class CodeDecorator implements SyntaxRule {
  // Regex for `code`
  // It looks for non-greedy content between single backticks.
  // It also tries to avoid matching parts of code blocks (```) by not allowing backticks right next to the content ones,
  // though full code block handling is typically a separate, more complex parser.
  private codeRegex = /(?<!\\)(?<!`)`(?=\S)([^`\n]+?)(?<=\S)`(?!`)/g;

  process(context: SyntaxRuleContext): void {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    const localRegex = new RegExp(this.codeRegex.source, 'g'); // Reset lastIndex
    let match;
    const markerLen = 1; // Length of "`"

    try {
      while ((match = localRegex.exec(docText)) !== null) {
        const matchStartIndexInSlice = match.index;
        const fullMatchText = match[0];

        // Skip escaped markers (e.g., \`text\`)
        if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === '\\') {
          continue;
        }

        const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
        const fullMatchEndInDoc = fullMatchStartInDoc + fullMatchText.length;

        const openMarkerStartInDoc = fullMatchStartInDoc;
        const openMarkerEndInDoc = openMarkerStartInDoc + markerLen;

        const contentStartInDoc = openMarkerEndInDoc;
        const contentEndInDoc = fullMatchEndInDoc - markerLen;

        const closeMarkerStartInDoc = contentEndInDoc;
        const closeMarkerEndInDoc = fullMatchEndInDoc;

        // Ensure the match is valid (e.g., not just empty markers)
        if (contentStartInDoc >= contentEndInDoc) {
          continue;
        }

        const isNearSyntax = isCursorNearRange(cursorPositions, openMarkerStartInDoc, closeMarkerEndInDoc);
        const syntaxClass = isNearSyntax ? 'markdown-syntax-active' : 'markdown-syntax-dim';

        // If we have a decorations collector, use it
        if (decorations) {
          // Add opening marker decoration
          decorations.push({
            from: openMarkerStartInDoc,
            to: openMarkerEndInDoc,
            decoration: Decoration.mark({ class: syntaxClass })
          });
          
          // Add content decoration
          decorations.push({
            from: contentStartInDoc,
            to: contentEndInDoc,
            decoration: Decoration.mark({ class: 'markdown-code-active' })
          });
          
          // Add closing marker decoration
          decorations.push({
            from: closeMarkerStartInDoc,
            to: closeMarkerEndInDoc,
            decoration: Decoration.mark({ class: syntaxClass })
          });
        } else {
          // Fallback to direct builder usage
          builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
          builder.add(contentStartInDoc, contentEndInDoc, Decoration.mark({ class: 'markdown-code-active' }));
          builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        }
      } // End of while loop
    } catch (error) {
      console.error('Error processing code syntax:', error);
    }
  } // End of process method
} // End of class
