import { Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { HtmlRegion } from './types';

/**
 * Interface for tracking decoration items before sorting
 */
interface DecorationItem {
  from: number;
  to: number;
  decoration: Decoration;
}

/**
 * Service for providing syntax highlighting to HTML code
 */
export class HtmlSyntaxHighlighter {
  /**
   * Highlight HTML code with appropriate syntax classes
   */
  static highlight(region: HtmlRegion): DecorationSet {
    // Store decorations in array before adding to builder
    const decorations: DecorationItem[] = [];
    
    // Get the content for this region
    const html = region.content;
    const baseOffset = region.from;
    
    // Regular expressions for HTML parts
    const tagOpenRegex = /<\/?([a-zA-Z][a-zA-Z0-9\-_:]*)/g;
    const tagCloseRegex = /\/?>/g;
    const attributeRegex = /\s([a-zA-Z][a-zA-Z0-9\-_:]*)(=(?:(['"]).*?\3|\S+))?/g;
    const attributeValueRegex = /=(['"])(.*?)\1/g;
    
    // Add base HTML code highlighting class
    decorations.push({
      from: region.from,
      to: region.to,
      decoration: Decoration.mark({ 
        class: 'cm-html-code-mode cm-editing-html' 
      })
    });
    
    // Find and highlight all tag names
    let tagMatch;
    while ((tagMatch = tagOpenRegex.exec(html)) !== null) {
      const [fullTag, tagName] = tagMatch;
      const tagStart = baseOffset + tagMatch.index;
      const tagNameStart = tagStart + (fullTag.startsWith('</') ? 2 : 1); // Account for </
      const tagNameEnd = tagNameStart + tagName.length;
      
      // Add tag name decoration
      decorations.push({
        from: tagNameStart,
        to: tagNameEnd,
        decoration: Decoration.mark({ class: 'cm-html-tag-name' })
      });
      
      // Add brackets decoration
      decorations.push({
        from: tagStart,
        to: tagNameStart,
        decoration: Decoration.mark({ class: 'cm-html-bracket' })
      });
    }
    
    // Find and highlight all closing brackets '>' or '/>'
    tagCloseRegex.lastIndex = 0;
    let closeBracketMatch;
    while ((closeBracketMatch = tagCloseRegex.exec(html)) !== null) {
      const closeStart = baseOffset + closeBracketMatch.index;
      const closeEnd = closeStart + closeBracketMatch[0].length;
      
      decorations.push({
        from: closeStart,
        to: closeEnd,
        decoration: Decoration.mark({ class: 'cm-html-bracket' })
      });
    }
    
    // Find and highlight all attributes and their values
    let attrMatch;
    while ((attrMatch = attributeRegex.exec(html)) !== null) {
      const [fullAttr, attrName, hasValue] = attrMatch;
      const attrStart = baseOffset + attrMatch.index + 1; // +1 to skip whitespace
      const attrEnd = attrStart + attrName.length;
      
      // Add attribute name decoration
      decorations.push({
        from: attrStart,
        to: attrEnd,
        decoration: Decoration.mark({ class: 'cm-html-attribute' })
      });
      
      // If attribute has a value, highlight it
      if (hasValue) {
        // Reset lastIndex to start search from current attribute position
        attributeValueRegex.lastIndex = attrMatch.index + fullAttr.indexOf('=');
        
        const valueMatch = attributeValueRegex.exec(html);
        if (valueMatch) {
          const [fullValue, quote, value] = valueMatch;
          const valueStart = baseOffset + valueMatch.index + 1; // +1 for '='
          const valueEnd = valueStart + fullValue.length - 1; // -1 to exclude '='
          
          // Add attribute value decoration
          decorations.push({
            from: valueStart,
            to: valueEnd,
            decoration: Decoration.mark({ class: 'cm-html-attribute-value' })
          });
        }
      }
    }
    
    // Sort decorations by from position first, then by to position if from is equal
    decorations.sort((a, b) => {
      if (a.from !== b.from) return a.from - b.from;
      return a.to - b.to;
    });
    
    // Add sorted decorations to the builder
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to, decoration } of decorations) {
      // Ensure from < to to avoid empty ranges
      if (from < to) {
        builder.add(from, to, decoration);
      }
    }
    
    return builder.finish();
  }
} 