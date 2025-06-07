import { Text } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HtmlRegion, VOID_TAGS } from './types';

/**
 * Detects HTML regions in the document text
 */
export function detectHtmlRegions(view: EditorView): HtmlRegion[] {
  try {
    const regions: HtmlRegion[] = [];
    const { state } = view;
    const doc = state.doc;
    
    // Get the entire document text for proper tag matching
    const fullText = doc.toString();
    
    // First, identify HTML comments and exclude them from tag processing
    const commentRegions = findHtmlComments(fullText);
    
    // Parse HTML using a more robust stack-based approach
    const parsedRegions = parseHtmlHierarchy(fullText, commentRegions);
    
    // Convert parsed regions to our HtmlRegion format
    for (const region of parsedRegions) {
      try {
        const { from, to, tagName, content, isMultiline, isSelfClosing, openTagEnd, closeTagStart } = region;
        
        regions.push({
          from,
          to,
          tagName,
          isMultiline,
          content,
          openTagEnd,
          closeTagStart,
          isSelfClosing
        });
      } catch (error) {
        console.error("Error processing HTML region:", error);
      }
    }
    
    // Sort regions by start position
    regions.sort((a, b) => a.from - b.from);
    
    return regions;
  } catch (error) {
    console.error("Error detecting HTML regions:", error);
    return [];
  }
}

/**
 * Parse HTML using a stack-based approach to handle nested tags properly
 */
function parseHtmlHierarchy(text: string, commentRegions: Array<{from: number, to: number}>): HtmlRegion[] {
  const regions: HtmlRegion[] = [];
  
  // Stack to keep track of open tags
  interface TagStackItem {
    tagName: string;
    startIndex: number;
    openTagEnd: number;
    content: string;
  }
  
  const tagStack: TagStackItem[] = [];
  
  // Regex to find opening and closing tags
  const tagRegex = /<\/?\s*([a-zA-Z][a-zA-Z0-9\-_:]*)((?:\s+[a-zA-Z][a-zA-Z0-9\-_:]*(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?)>/g;
  let match: RegExpExecArray | null;
  
  while ((match = tagRegex.exec(text)) !== null) {
    const [fullMatch, tagName, attributes, selfClosing] = match;
    const position = match.index;
    const matchEnd = position + fullMatch.length;
    const lowerTagName = tagName.toLowerCase();
    
    // Skip if this match is inside a comment
    if (isPositionInRanges(position, commentRegions)) {
      continue;
    }
    
    const isClosingTag = fullMatch.startsWith('</');
    const isSelfClosingTag = selfClosing === '/' || VOID_TAGS.has(lowerTagName);
    
    if (isClosingTag) {
      // This is a closing tag, try to match it with the corresponding opening tag
      let foundMatchingTag = false;
      
      // Look for matching opening tag, starting from the most recent
      for (let i = tagStack.length - 1; i >= 0; i--) {
        const openTag = tagStack[i];
        
        if (openTag.tagName.toLowerCase() === lowerTagName) {
          // We found a matching opening tag!
          const from = openTag.startIndex;
          const to = matchEnd;
          const content = text.substring(from, to);
          const isMultiline = content.includes('\n');
          
          regions.push({
            from,
            to,
            tagName: lowerTagName,
            content,
            isMultiline,
            isSelfClosing: false,
            openTagEnd: openTag.openTagEnd,
            closeTagStart: position
          });
          
          // Remove this tag and all nested unclosed tags from the stack
          // (This handles cases where tags were not properly nested)
          tagStack.splice(i);
          
          foundMatchingTag = true;
          break;
        }
      }
      
      // If we didn't find a matching opening tag, this closing tag is orphaned
      if (!foundMatchingTag && VOID_TAGS.has(lowerTagName) === false) {
        // Orphaned closing tag, no need to log
      }
    } else if (isSelfClosingTag) {
      // This is a self-closing tag, add it directly to regions
      regions.push({
        from: position,
        to: matchEnd,
        tagName: lowerTagName,
        content: fullMatch,
        isMultiline: false,
        isSelfClosing: true,
        openTagEnd: matchEnd,
        closeTagStart: matchEnd
      });
    } else {
      // This is an opening tag, push to stack
      tagStack.push({
        tagName: lowerTagName,
        startIndex: position,
        openTagEnd: matchEnd,
        content: fullMatch
      });
    }
  }
  
  // Handle void elements that don't require closing tags
  const voidTagRegex = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)>/g;
  voidTagRegex.lastIndex = 0; // Reset regex
  
  while ((match = voidTagRegex.exec(text)) !== null) {
    const [fullTag, tagName, attributes] = match;
    const lowerTagName = tagName.toLowerCase();
    const position = match.index;
    const tagEnd = position + fullTag.length;
    
    // Only process if it's a void element and not already captured
    if (VOID_TAGS.has(lowerTagName) && 
        !regions.some(r => r.from === position) && 
        !isPositionInRanges(position, commentRegions)) {
      
      regions.push({
        from: position,
        to: tagEnd,
        tagName: lowerTagName,
        isMultiline: false,
        content: fullTag,
        openTagEnd: tagEnd,
        closeTagStart: tagEnd,
        isSelfClosing: true
      });
    }
  }
  
  return regions;
}

/**
 * Check if a position is within any of the specified ranges
 */
function isPositionInRanges(position: number, ranges: Array<{from: number, to: number}>): boolean {
  return ranges.some(range => position >= range.from && position < range.to);
}

/**
 * Find HTML comments in the document
 */
function findHtmlComments(text: string): Array<{from: number, to: number}> {
  const comments: Array<{from: number, to: number}> = [];
  const commentRegex = /<!--[\s\S]*?-->/g;
  let match: RegExpExecArray | null;
  
  while ((match = commentRegex.exec(text)) !== null) {
    comments.push({
      from: match.index,
      to: match.index + match[0].length
    });
  }
  
  return comments;
}

/**
 * Determine if cursor is near or within an HTML region
 */
export function isCursorNearRegion(view: EditorView, region: HtmlRegion): boolean {
  const selection = view.state.selection.main;
  const cursor = selection.head;
  const doc = view.state.doc;
  
  // Check if cursor is within the HTML region
  if (cursor > region.from && cursor < region.to) {
    return true;
  }
  
  // Check if cursor is exactly at the boundary of the HTML region
  if (cursor === region.from || cursor === region.to) {
    return true;
  }
  
  // Not near the HTML region - removed the line-before/line-after detection
  // that was causing edit mode to activate on adjacent lines
  return false;
}

/**
 * Check if the editor is in preview/read-only mode
 */
export function isEditorInPreviewMode(view: EditorView): boolean {
  // Check for editor being in read-only mode
  if (!view.state.facet(EditorView.editable)) {
    return true;
  }
  
  // Check for any parent element with "preview-mode" class
  let element: HTMLElement | null = view.dom;
  while (element) {
    if (element.classList && element.classList.contains('preview-mode')) {
      return true;
    }
    element = element.parentElement;
  }
  
  return false;
} 