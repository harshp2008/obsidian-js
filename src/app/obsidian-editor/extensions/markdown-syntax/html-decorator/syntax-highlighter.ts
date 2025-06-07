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
    
    // Improved regex for better token detection
    // Process tag by tag using regex that handles all HTML elements more precisely
    const tokenRegex = /<\/?([a-zA-Z][a-zA-Z0-9\-_:]*)|\s([a-zA-Z][a-zA-Z0-9\-_:]*)(=(?:(['"]).*?\4|\S+))?|(['"])(.*?)\5|(\/?>)/g;
    let match;
    
    // Create an array of tokens before adding to builder
    const tokens: {from: number, to: number, class: string}[] = [];
    
    // Process tokens in order of appearance (which maintains from order)
    while ((match = tokenRegex.exec(html)) !== null) {
      try {
        const [full, tagName, attrName, fullAttr, q1, attrValue, q2, bracket] = match;
        const start = baseOffset + match.index;
        
        // Handle opening and closing tags
        if (tagName) {
          const isClosing = full.startsWith('</');
          const tagStart = start;
          const tagEnd = start + (isClosing ? 2 : 1) + tagName.length;
          
          // Add bracket highlighting
          tokens.push({
            from: tagStart,
            to: tagStart + (isClosing ? 2 : 1),
            class: `cm-html-bracket cm-html-bracket-level-${currentLevel % 6}`
          });
          
          // Add tag name highlighting
          tokens.push({
            from: tagStart + (isClosing ? 2 : 1),
            to: tagEnd,
            class: `cm-html-tag-name cm-html-tag-level-${currentLevel % 6}`
          });
          
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
          
          tokens.push({
            from: attrStart,
            to: attrEnd,
            class: 'cm-html-attribute'
          });
          
          // If attribute has a value, highlight it
          if (fullAttr && fullAttr.includes('=')) {
            const equalsPos = fullAttr.indexOf('=');
            const valueStart = attrStart + attrName.length + 1; // +1 for equals sign
            
            if (q1) { // Quoted value
              const quoteLen = q1.length;
              tokens.push({
                from: valueStart,
                to: valueStart + fullAttr.length - equalsPos - 1,
                class: 'cm-html-attribute-value'
              });
            } else if (fullAttr.length > equalsPos + 1) { // Unquoted value
              tokens.push({
                from: valueStart,
                to: valueStart + fullAttr.length - equalsPos - 1,
                class: 'cm-html-attribute-value'
              });
            }
          }
        }
        
        // Handle attribute values with explicit quotes
        else if (attrValue !== undefined && q2) {
          const valueStart = start;
          const valueEnd = start + q2.length + attrValue.length + q2.length;
          
          tokens.push({
            from: valueStart,
            to: valueEnd,
            class: 'cm-html-attribute-value'
          });
        }
        
        // Handle closing brackets
        else if (bracket) {
          const bracketStart = start;
          const bracketEnd = start + bracket.length;
          
          const isSelfClosing = bracket === '/>' || 
              (bracket === '>' && tagStack.length > 0 && 
               VOID_TAGS.has(tagStack[tagStack.length - 1].name));
            
          tokens.push({
            from: bracketStart,
            to: bracketEnd,
            class: `cm-html-bracket cm-html-bracket-level-${Math.max(0, currentLevel - (isSelfClosing ? 1 : 0)) % 6}`
          });
          
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
    
    // Sort tokens by position to ensure they're added in the correct order
    tokens.sort((a, b) => {
      if (a.from !== b.from) return a.from - b.from;
      return a.to - b.to;
    });
    
    // Add all tokens to the builder
    for (const token of tokens) {
      builder.add(
        token.from,
        token.to,
        Decoration.mark({ class: token.class })
      );
    }
  }
} 