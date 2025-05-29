import { Decoration } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext, DecorationItem } from '../types';
import { isCursorNearRange } from './utils';

export class OldItalicDecorator implements SyntaxRule {
  // Regex for *italic* (old style markdown)
  private oldItalicRegex = /(?<!\*\*|\*)(?:^|[^\*])\*(?!\s|\*\*)([^\*\n]+?)(?<!\s)\*(?!\*)/g;

  process(context: SyntaxRuleContext): void {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    const markerLen = 1; // Length of "*"
    const localRegex = new RegExp(this.oldItalicRegex.source, 'g');
    let match;

    while ((match = localRegex.exec(docText)) !== null) {
      let fullMatchText = match[0];
      let contentText = match[1];
      let matchStartIndexInSlice = match.index;

      // Adjust for lookbehind/lookahead consuming characters not part of the actual markers
      if (fullMatchText.startsWith('*') === false && fullMatchText.length > contentText.length + 2) {
        matchStartIndexInSlice += (fullMatchText.indexOf('*' + contentText + '*'));
        fullMatchText = '*' + contentText + '*';
      }

      // Skip escaped markers (e.g., \*text\*)
      if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === '\\') {
        continue;
      }
      
      // Additional check to prevent matching inside words like test*ing*example
      const charBeforeOpenMarker = matchStartIndexInSlice > 0 ? docText.charAt(matchStartIndexInSlice - 1) : ' ';
      const charAfterCloseMarker = (matchStartIndexInSlice + fullMatchText.length) < docText.length ? 
                                   docText.charAt(matchStartIndexInSlice + fullMatchText.length) : ' ';
      const wordCharRegex = /[a-zA-Z0-9]/;
      if (wordCharRegex.test(charBeforeOpenMarker) && wordCharRegex.test(charAfterCloseMarker)) {
        if(docText.charAt(matchStartIndexInSlice + markerLen) !== ' ' && 
           docText.charAt(matchStartIndexInSlice + fullMatchText.length - markerLen - 1) !== ' ') {
          // This is likely an intra-word asterisk, skip it
          continue;
        }
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
        
        // Add content decoration with red styling for old markers
        decorations.push({
          from: contentStartInDoc,
          to: contentEndInDoc,
          decoration: Decoration.mark({ 
            class: isNearSyntax ? 'markdown-italic-active' : 'markdown-old-syntax-red' 
          })
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
        builder.add(
          contentStartInDoc, 
          contentEndInDoc, 
          Decoration.mark({ 
            class: isNearSyntax ? 'markdown-italic-active' : 'markdown-old-syntax-red' 
          })
        );
        builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
      }
    }
  }
}
