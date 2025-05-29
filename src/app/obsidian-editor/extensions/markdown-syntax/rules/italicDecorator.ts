import { Decoration } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext, DecorationItem } from '../types';
import { isCursorNearRange } from './utils';

export class ItalicDecorator implements SyntaxRule {
  // Regex for *italic* and _italic_
  // It avoids matching parts of **bold** or __bold__ by ensuring the characters immediately
  // outside the single markers are not the same marker character.
  // It also ensures the content is not empty, e.g. ** or __
  private italicPatterns = [
    // Matches *italic* but not **bold** or ***italicbold*** components directly
    { marker: '*', regex: /(?<!\*\*|\*)(?:^|[^\*])\*(?!\s|\*\*)([^\*\n]+?)(?<!\s)\*(?!\*)/g }, 
    // Matches _italic_ but not __bold__ or ___italicbold___ components directly
    { marker: '_', regex: /(?<!__|_)(?:^|[^_])_(?!\s|__)([^_\n]+?)(?<!\s)_(?!_)/g }
  ];

  process(context: SyntaxRuleContext): void {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;

    this.italicPatterns.forEach(patternInfo => {
      const marker = patternInfo.marker;
      const markerLen = marker.length; // Should be 1 for italics
      const localRegex = new RegExp(patternInfo.regex.source, 'g');
      let match;

      while ((match = localRegex.exec(docText)) !== null) {
        let fullMatchText = match[0];
        let contentText = match[1];
        let matchStartIndexInSlice = match.index;

        // Adjust for lookbehind/lookahead consuming characters not part of the actual markers
        // This is a common issue when regex includes context characters (like [^\*] or [^_])
        // We need to ensure 'openMarkerStartInDoc' points to the actual '*' or '_'
        if (fullMatchText.startsWith(marker) === false && fullMatchText.length > contentText.length + 2) {
            // This implies the regex included a leading context character (e.g. space or non-marker char)
            matchStartIndexInSlice += (fullMatchText.indexOf(marker + contentText + marker));
            fullMatchText = marker + contentText + marker;
        }

        // Skip escaped markers (e.g., \*text\*)
        if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === '\\') {
          continue;
        }
        
        // Additional check to prevent matching inside words like test_ing_example
        // This is complex with regex alone, so a post-match check can help.
        const charBeforeOpenMarker = matchStartIndexInSlice > 0 ? docText.charAt(matchStartIndexInSlice -1) : ' ';
        const charAfterCloseMarker = (matchStartIndexInSlice + fullMatchText.length) < docText.length ? docText.charAt(matchStartIndexInSlice + fullMatchText.length) : ' ';
        const wordCharRegex = /[a-zA-Z0-9]/;
        if (wordCharRegex.test(charBeforeOpenMarker) && wordCharRegex.test(charAfterCloseMarker)) {
            if(docText.charAt(matchStartIndexInSlice + markerLen) !== ' ' && docText.charAt(matchStartIndexInSlice + fullMatchText.length - markerLen -1) !== ' '){
                 //This is likely an intra-word underscore/asterisk, skip unless it's a common case like C*++
                 //This rule is a bit simplistic and might need refinement for specific edge cases desired.
                 //For now, we assume typical markdown usage where italics are space-bound or punctuation-bound.
                 // continue; // Commented out as it might be too restrictive. The regex tries to handle this.
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
          
          // Add content decoration
          decorations.push({
            from: contentStartInDoc,
            to: contentEndInDoc,
            decoration: Decoration.mark({ class: 'markdown-italic-active' })
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
          builder.add(contentStartInDoc, contentEndInDoc, Decoration.mark({ class: 'markdown-italic-active' }));
          builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        }
      }
    });
  }
}
