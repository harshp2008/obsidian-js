import { Decoration } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext, DecorationItem } from '../types';
import { isCursorNearRange } from './utils';

export class OldBoldDecorator implements SyntaxRule {
  // Regex for __bold__ (old style markdown)
  private oldBoldRegex = /(?<!_)_{2}(?!\s)([^_]+?)(?<!\s)_{2}(?!_)/g;

  process(context: SyntaxRuleContext): void {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    const markerLen = 2; // Length of "__"
    // Create a new RegExp instance to reset lastIndex
    const localRegex = new RegExp(this.oldBoldRegex.source, 'g');
    let match;

    while ((match = localRegex.exec(docText)) !== null) {
      const matchStartIndexInSlice = match.index;
      const fullMatchText = match[0];

      // Skip escaped markers (e.g., \__text__)
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

      // Check if cursor is near the entire bold span or its markers
      const isNearSyntax = isCursorNearRange(cursorPositions, openMarkerStartInDoc, closeMarkerEndInDoc);

      const syntaxClass = isNearSyntax ? 'markdown-syntax-active' : 'markdown-syntax-dim';

      // If we have a decorations collector, use it instead of the builder directly
      if (decorations) {
        // Collect opening marker decoration
        decorations.push({
          from: openMarkerStartInDoc,
          to: openMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
        
        // Collect content decoration with red styling for old markers
        if (contentStartInDoc < contentEndInDoc) { // Ensure there's content
          decorations.push({
            from: contentStartInDoc,
            to: contentEndInDoc,
            decoration: Decoration.mark({ 
              class: isNearSyntax ? 'markdown-bold-active' : 'markdown-old-syntax-red' 
            })
          });
        }

        // Collect closing marker decoration
        decorations.push({
          from: closeMarkerStartInDoc,
          to: closeMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
      } else {
        // Fallback to using the builder directly
        builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        
        if (contentStartInDoc < contentEndInDoc) {
          builder.add(
            contentStartInDoc, 
            contentEndInDoc, 
            Decoration.mark({ 
              class: isNearSyntax ? 'markdown-bold-active' : 'markdown-old-syntax-red' 
            })
          );
        }
        
        builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
      }
    }
  }
}
