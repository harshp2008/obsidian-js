import { Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { HtmlRegion } from './types';

// Interface for storing decoration ranges before sorting
interface DecorationRange {
  from: number;
  to: number;
  decoration: Decoration;
}

/**
 * Enhanced syntax highlighting for HTML code in edit mode
 */
export class HtmlSyntaxHighlighter {
  /**
   * Create syntax highlighting decorations for an HTML region
   */
  static highlight(region: HtmlRegion): DecorationSet {
    try {
      const builder = new RangeSetBuilder<Decoration>();
      const decorations: DecorationRange[] = [];
      const content = region.content;
      
      // First mark the whole region as HTML
      if (region.from < region.to) {
        decorations.push({
          from: region.from, 
          to: region.to, 
          decoration: Decoration.mark({ class: 'cm-html-code-mode' })
        });
      }
      
      // Highlight tag names
      this.highlightTagNames(content, region.from, decorations);
      
      // Highlight attributes
      this.highlightAttributes(content, region.from, decorations);
      
      // Highlight brackets
      this.highlightBrackets(content, region.from, decorations);
      
      // Sort all decorations by from position before adding to the builder
      decorations.sort((a, b) => a.from - b.from);
      
      // Add the sorted decorations to the builder
      for (const { from, to, decoration } of decorations) {
        if (from < to) {
          builder.add(from, to, decoration);
        }
      }
      
      return builder.finish();
    } catch (error) {
      console.error('Error in HTML syntax highlighting:', error);
      return Decoration.none;
    }
  }
  
  /**
   * Highlight HTML tag names
   */
  private static highlightTagNames(
    content: string, 
    offset: number, 
    decorations: DecorationRange[]
  ): void {
    // Match tag names: <tag and </tag
    const tagNameRegex = /<\/?([a-zA-Z][a-zA-Z0-9\-_:]*)/g;
    let match: RegExpExecArray | null;
    
    while ((match = tagNameRegex.exec(content)) !== null) {
      try {
        const fullMatch = match[0];
        const tagName = match[1];
        
        // Position just after < or </
        const startPos = match.index + fullMatch.length - tagName.length;
        const endPos = startPos + tagName.length;
        
        decorations.push({
          from: offset + startPos,
          to: offset + endPos,
          decoration: Decoration.mark({ class: 'cm-html-tag-name' })
        });
      } catch (e) {
        console.error('Error highlighting tag name:', e);
      }
    }
  }
  
  /**
   * Highlight HTML attributes and values
   */
  private static highlightAttributes(
    content: string, 
    offset: number, 
    decorations: DecorationRange[]
  ): void {
    // Match attributes: name="value" or name='value' or name=value
    const attrRegex = /(\s+)([a-zA-Z][a-zA-Z0-9\-_:]*)(\s*=\s*)((['"]).*?\5|[^\s>]*)/g;
    let match: RegExpExecArray | null;
    
    while ((match = attrRegex.exec(content)) !== null) {
      try {
        const attrName = match[2];
        const equals = match[3];
        const value = match[4];
        
        // Attribute name
        const nameStart = match.index + match[1].length;
        const nameEnd = nameStart + attrName.length;
        decorations.push({
          from: offset + nameStart,
          to: offset + nameEnd,
          decoration: Decoration.mark({ class: 'cm-html-attribute' })
        });
        
        // Attribute value (if present)
        if (value) {
          const valueStart = nameEnd + equals.length;
          const valueEnd = valueStart + value.length;
          decorations.push({
            from: offset + valueStart,
            to: offset + valueEnd,
            decoration: Decoration.mark({ class: 'cm-html-attribute-value' })
          });
        }
      } catch (e) {
        console.error('Error highlighting attribute:', e);
      }
    }
  }
  
  /**
   * Highlight HTML angle brackets
   */
  private static highlightBrackets(
    content: string, 
    offset: number, 
    decorations: DecorationRange[]
  ): void {
    // Match opening and closing brackets: < > </ />
    const bracketRegex = /<\/?|\/?>|\/>/g;
    let match: RegExpExecArray | null;
    
    while ((match = bracketRegex.exec(content)) !== null) {
      try {
        const bracket = match[0];
        const start = match.index;
        const end = start + bracket.length;
        
        decorations.push({
          from: offset + start,
          to: offset + end,
          decoration: Decoration.mark({ class: 'cm-html-bracket' })
        });
      } catch (e) {
        console.error('Error highlighting bracket:', e);
      }
    }
  }
} 