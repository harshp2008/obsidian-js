import { Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { HtmlRegion, VOID_TAGS } from './types';

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
    
    // Add base HTML code highlighting class
    decorations.push({
      from: region.from,
      to: region.to,
      decoration: Decoration.mark({ 
        class: 'cm-html-code-mode' 
      })
    });
    
    // Parse HTML using the tokenizer for more accurate highlighting
    this.tokenizeHtml(html, baseOffset, decorations);
    
    // Sort decorations by position
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
  
  /**
   * Tokenize HTML content for better highlighting
   */
  private static tokenizeHtml(html: string, baseOffset: number, decorations: DecorationItem[]): void {
    // Track tag nesting level for each tag name
    const tagStack: {name: string, level: number}[] = [];
    let currentLevel = 0;
    
    // Regular expressions for different HTML parts
    const tokenRegex = /<\/?([a-zA-Z][a-zA-Z0-9\-_:]*)|\s([a-zA-Z][a-zA-Z0-9\-_:]*)(?:=(?:(['"]).*?\3|\S+))?|(['"])(.*?)\4|(\/?>)/g;
    let match;
    
    while ((match = tokenRegex.exec(html)) !== null) {
      const [full, tagName, attrName, q1, q2, attrValue, bracket] = match;
      const start = baseOffset + match.index;
      
      // Handle opening and closing tags with proper level tracking
      if (tagName) {
        const isClosing = full.startsWith('</');
        const tagStart = start;
        const tagEnd = start + (isClosing ? 2 : 1) + tagName.length;
        
        // Add bracket highlighting
        decorations.push({
          from: tagStart,
          to: tagStart + (isClosing ? 2 : 1),
          decoration: Decoration.mark({ 
            class: `cm-html-bracket cm-html-bracket-level-${currentLevel % 6}` 
          })
        });
        
        // Add tag name highlighting
        decorations.push({
          from: tagStart + (isClosing ? 2 : 1),
          to: tagEnd,
          decoration: Decoration.mark({ 
            class: `cm-html-tag-name cm-html-tag-level-${currentLevel % 6}` 
          })
        });
        
        // Track nesting
        if (isClosing) {
          // Match this closing tag with its opening tag
          for (let i = tagStack.length - 1; i >= 0; i--) {
            if (tagStack[i].name === tagName.toLowerCase()) {
              currentLevel = tagStack[i].level;
              // Remove this and all nested unmatched tags
              tagStack.splice(i);
              break;
            }
          }
          // If we exit the loop without finding a match, just use current level
        } else {
          // Push this tag onto the stack
          tagStack.push({
            name: tagName.toLowerCase(),
            level: currentLevel
          });
          // Increase nesting level for content
          currentLevel = (currentLevel + 1) % 6;
        }
      }
      
      // Handle attributes
      else if (attrName) {
        const attrStart = start + 1; // Skip the whitespace
        const attrEnd = attrStart + attrName.length;
        
        // Add attribute name highlighting
        decorations.push({
          from: attrStart,
          to: attrEnd,
          decoration: Decoration.mark({ class: 'cm-html-attribute' })
        });
      }
      
      // Handle attribute values
      else if (attrValue !== undefined && (q1 || q2)) {
        const quote = q1 || q2;
        const valueStart = start;
        const valueEnd = start + quote.length + attrValue.length + quote.length;
        
        // Add attribute value highlighting (including quotes)
        decorations.push({
          from: valueStart,
          to: valueEnd,
          decoration: Decoration.mark({ class: 'cm-html-attribute-value' })
        });
      }
      
      // Handle closing brackets
      else if (bracket) {
        const bracketStart = start;
        const bracketEnd = start + bracket.length;
        
        // Determine if this is a self-closing tag
        const isSelfClosing = bracket === '/>' || bracket === '>' && tagStack.length > 0 && 
          VOID_TAGS.has(tagStack[tagStack.length - 1].name);
          
        // Add bracket highlighting
        decorations.push({
          from: bracketStart,
          to: bracketEnd,
          decoration: Decoration.mark({ 
            class: `cm-html-bracket cm-html-bracket-level-${Math.max(0, currentLevel - (isSelfClosing ? 1 : 0)) % 6}` 
          })
        });
        
        // If self-closing, adjust the level
        if (isSelfClosing && tagStack.length > 0) {
          currentLevel = tagStack[tagStack.length - 1].level;
          tagStack.pop();
        }
      }
    }
  }
} 