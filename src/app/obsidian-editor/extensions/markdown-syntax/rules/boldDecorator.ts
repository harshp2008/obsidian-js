import { Decoration } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext } from '../types';
import { isCursorNearRange, escapeRegExp } from './utils';

// Get the extended context type that includes the decorations array
interface DecorationItem {
  from: number;
  to: number;
  decoration: Decoration;
}

type ExtendedContext = SyntaxRuleContext & {
  decorations?: DecorationItem[];
};

export class BoldDecorator implements SyntaxRule {
  // Regex for **bold** and __bold__
  // It looks for non-greedy content between the markers.
  // It also ensures that the character before the opening marker and after the closing marker
  // is not the marker character itself, to avoid matching parts of ***italicbold*** or similar.
  // And it avoids matching if the content is empty, e.g. **** or ____
  private boldPatterns = [
    { marker: '**', regex: /(?<!\*)\*\*(?!\s)([^\*]+?)(?<!\s)\*\*(?!\*)/g }, // **bold**
    { marker: '__', regex: /(?<!_)_{2}(?!\s)([^_]+?)(?<!\s)_{2}(?!_)/g }    // __bold__
  ];

  process(context: SyntaxRuleContext): void {
    const { builder, docText, textSliceFrom, cursorPositions } = context;
    // Cast to get access to the decorations array
    const extContext = context as ExtendedContext;
    const decorations = extContext.decorations || [];

    this.boldPatterns.forEach(patternInfo => {
      const marker = patternInfo.marker;
      const markerLen = marker.length;
      // Create a new RegExp instance for each use to reset lastIndex
      const localRegex = new RegExp(patternInfo.regex.source, 'g');
      let match;

      while ((match = localRegex.exec(docText)) !== null) {
        const matchStartIndexInSlice = match.index;
        const fullMatchText = match[0];

        // Skip escaped markers (e.g., \**text**)
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
          
          // Collect content decoration as bold
          if (contentStartInDoc < contentEndInDoc) { // Ensure there's content
            decorations.push({
              from: contentStartInDoc,
              to: contentEndInDoc,
              decoration: Decoration.mark({ class: 'markdown-bold-active' })
            });
          }

          // Collect closing marker decoration
          decorations.push({
            from: closeMarkerStartInDoc,
            to: closeMarkerEndInDoc,
            decoration: Decoration.mark({ class: syntaxClass })
          });
        } else {
          // Fallback to using the builder directly (shouldn't happen with new system)
          builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
          
          if (contentStartInDoc < contentEndInDoc) {
            builder.add(contentStartInDoc, contentEndInDoc, Decoration.mark({ class: 'markdown-bold-active' }));
          }
          
          builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        }
      }
    });
  }
}
