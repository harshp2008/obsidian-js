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
    try {
      // For safety, return an empty decoration set if there's no content
      if (!region.content || region.content.length === 0) {
        return Decoration.none;
      }
      
      // Create a builder for decorations
      const builder = new RangeSetBuilder<Decoration>();
      
      // Add base HTML code highlighting decoration
      builder.add(
        region.from, 
        region.to, 
        Decoration.mark({ 
          class: 'cm-html-code-mode cm-disable-markdown-parsing cm-plain-text',
          inclusive: true
        })
      );
      
      // Add token-level decorations for HTML syntax highlighting
      this.addHtmlTokens(builder, region.content, region.from);
      
      return builder.finish();
    } catch (error) {
      console.error("Error in HTML syntax highlighter:", error);
      return Decoration.none;
    }
  }
  
  /**
   * Add HTML token decorations directly to builder
   */
  private static addHtmlTokens(builder: RangeSetBuilder<Decoration>, html: string, baseOffset: number): void {
    // Track tag nesting level for each tag name
    const tagStack: {name: string, level: number}[] = [];
    let currentLevel = 0;
    
    // Process tag by tag using regex
    const tokenRegex = /<\/?([a-zA-Z][a-zA-Z0-9\-_:]*)|\s([a-zA-Z][a-zA-Z0-9\-_:]*)(?:=(?:(['"]).*?\3|\S+))?|(['"])(.*?)\4|(\/?>)/g;
    let match;
    
    // Process tokens in order of appearance (which maintains from order)
    while ((match = tokenRegex.exec(html)) !== null) {
      try {
        const [full, tagName, attrName, q1, q2, attrValue, bracket] = match;
        const start = baseOffset + match.index;
        
        // Handle opening and closing tags
        if (tagName) {
          const isClosing = full.startsWith('</');
          const tagStart = start;
          const tagEnd = start + (isClosing ? 2 : 1) + tagName.length;
          
          // Add bracket highlighting
          builder.add(
            tagStart,
            tagStart + (isClosing ? 2 : 1),
            Decoration.mark({ 
              class: `cm-html-bracket cm-html-bracket-level-${currentLevel % 6}` 
            })
          );
          
          // Add tag name highlighting
          builder.add(
            tagStart + (isClosing ? 2 : 1),
            tagEnd,
            Decoration.mark({ 
              class: `cm-html-tag-name cm-html-tag-level-${currentLevel % 6}` 
            })
          );
          
          // Track nesting
          if (isClosing) {
            // Find matching opening tag
            for (let i = tagStack.length - 1; i >= 0; i--) {
              if (tagStack[i].name === tagName.toLowerCase()) {
                currentLevel = tagStack[i].level;
                tagStack.splice(i);
                break;
              }
            }
          } else {
            // Push this tag onto stack
            tagStack.push({
              name: tagName.toLowerCase(),
              level: currentLevel
            });
            currentLevel = (currentLevel + 1) % 6;
          }
        }
        
        // Handle attributes
        else if (attrName) {
          const attrStart = start + 1; // Skip whitespace
          const attrEnd = attrStart + attrName.length;
          
          builder.add(
            attrStart,
            attrEnd,
            Decoration.mark({ class: 'cm-html-attribute' })
          );
        }
        
        // Handle attribute values
        else if (attrValue !== undefined && (q1 || q2)) {
          const quote = q1 || q2;
          const valueStart = start;
          const valueEnd = start + quote.length + attrValue.length + quote.length;
          
          builder.add(
            valueStart,
            valueEnd,
            Decoration.mark({ class: 'cm-html-attribute-value' })
          );
        }
        
        // Handle closing brackets
        else if (bracket) {
          const bracketStart = start;
          const bracketEnd = start + bracket.length;
          
          const isSelfClosing = bracket === '/>' || 
              (bracket === '>' && tagStack.length > 0 && 
               VOID_TAGS.has(tagStack[tagStack.length - 1].name));
            
          builder.add(
            bracketStart,
            bracketEnd,
            Decoration.mark({ 
              class: `cm-html-bracket cm-html-bracket-level-${Math.max(0, currentLevel - (isSelfClosing ? 1 : 0)) % 6}` 
            })
          );
          
          if (isSelfClosing && tagStack.length > 0) {
            currentLevel = tagStack[tagStack.length - 1].level;
            tagStack.pop();
          }
        }
      } catch (tokenError) {
        // Skip this token if there was an error processing it
        console.warn("Error processing token:", tokenError);
      }
    }
  }
} 