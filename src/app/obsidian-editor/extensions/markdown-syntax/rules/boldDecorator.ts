import { Decoration } from '@codemirror/view';
import { SyntaxRuleContext } from '../types';
import { BaseDecorator } from './baseDecorator';

/**
 * Decorator for bold text in markdown (**bold** or __bold__)
 */
export class BoldDecorator extends BaseDecorator {
  /**
   * Regular expression to match bold text
   * Matches **bold text** or __bold text__
   */
  private readonly regex = /(\*\*|__)([^\s*_]|[^\s*_].*?[^\s*_])\1/g;

  /**
   * Process the document and add decorations for bold text
   * @param context - Context containing document state and decoration builder
   */
  process(context: SyntaxRuleContext): void {
    // Extract data from context
    const { docText, textSliceFrom, decorations, htmlEditRegions } = context;
    
    // Find all bold text matches
    let match;
    while ((match = this.regex.exec(docText)) !== null) {
      // Calculate positions in the document
      const matchFrom = textSliceFrom + match.index;
      const matchTo = textSliceFrom + match.index + match[0].length;
      
      // Skip if this range overlaps with an HTML edit region
      if (this.rangeOverlapsHtmlEditRegion(matchFrom, matchTo, htmlEditRegions)) {
        continue;
      }
      
      // The format markers (** or __) at beginning
      const startMarkerFrom = matchFrom;
      const startMarkerTo = startMarkerFrom + match[1].length;
      
      // The content between the markers
      const contentFrom = startMarkerTo;
      const contentTo = matchTo - match[1].length;
      
      // The format markers (** or __) at the end
      const endMarkerFrom = contentTo;
      const endMarkerTo = matchTo;
      
      // Add decorations for the markers
      decorations.push({
        from: startMarkerFrom, 
        to: startMarkerTo,
        decoration: Decoration.mark({ class: 'cm-formatting-strong' })
      });
      
      decorations.push({
        from: endMarkerFrom, 
        to: endMarkerTo,
        decoration: Decoration.mark({ class: 'cm-formatting-strong' })
      });
      
      // Add decoration for the content
      decorations.push({
        from: contentFrom, 
        to: contentTo,
        decoration: Decoration.mark({ class: 'cm-strong' })
      });
    }
  }
}
