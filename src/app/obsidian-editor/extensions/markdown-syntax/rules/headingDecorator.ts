import { Decoration } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext, DecorationItem } from '../types';
import { isCursorNearRange } from './utils';

export class HeadingDecorator implements SyntaxRule {
  private headingRegex = /^(#{1,6})\s(.*)$/gm;

  process(context: SyntaxRuleContext): void {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    let match;

    // Iterate over matches in the relevant text slice
    // We use docText here which might be the full document text or a visible part.
    // The `textSliceFrom` tells us the offset of this slice from the document start.
    const localRegex = new RegExp(this.headingRegex.source, 'gm'); // Reset lastIndex for local use

    while ((match = localRegex.exec(docText)) !== null) {
      const matchStartIndexInSlice = match.index;
      const lineStartInDoc = textSliceFrom + matchStartIndexInSlice;

      // Skip escaped heading markers (e.g., \\# heading)
      if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === '\\') {
        continue;
      }

      const hashMarks = match[1]; // e.g., "###"
      const headingTextContent = match[2]; // e.g., "Heading Title"
      const hashCount = hashMarks.length;

      const hashStartInDoc = lineStartInDoc;
      const hashEndInDoc = hashStartInDoc + hashCount;
      const spaceAfterHashInDoc = hashEndInDoc + 1; // Assumes one space after hashes
      const lineEndInDoc = lineStartInDoc + match[0].length;
      const headingTextStartInDoc = spaceAfterHashInDoc;
      const headingTextEndInDoc = lineEndInDoc;

      // Determine if cursor is near the markdown syntax (hashes and the following space)
      const isNearSyntax = isCursorNearRange(cursorPositions, hashStartInDoc, spaceAfterHashInDoc);

      // Style for the hash marks and the space
      const syntaxClass = isNearSyntax ? 'markdown-syntax-active' : 'markdown-syntax-dim';
      
      // If we have a decorations collector, use it
      if (decorations) {
        // Add hash marks and space decoration
        decorations.push({
          from: hashStartInDoc,
          to: spaceAfterHashInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
        
        // Add heading text content decoration
        if (headingTextContent.trim().length > 0) {
          decorations.push({
            from: headingTextStartInDoc,
            to: headingTextEndInDoc,
            decoration: Decoration.mark({ class: `markdown-heading-${hashCount}` })
          });
        }
      } else {
        // Fallback to direct builder usage
        builder.add(hashStartInDoc, spaceAfterHashInDoc, Decoration.mark({ class: syntaxClass }));
        
        // Style for the heading text content
        if (headingTextContent.trim().length > 0) {
          builder.add(
            headingTextStartInDoc,
            headingTextEndInDoc,
            Decoration.mark({ class: `markdown-heading-${hashCount}` })
          );
        }
      }
    }
  }
}
