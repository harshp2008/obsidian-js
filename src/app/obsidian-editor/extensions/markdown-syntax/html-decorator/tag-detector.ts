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
    
    // Use stack-based approach for nested tag handling
    const tagStack: Array<{
      tagName: string, 
      openPos: number, 
      openTagEnd: number
    }> = [];
    
    // Match all potential HTML tags in the document
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)(\/?)>/g;
    let match: RegExpExecArray | null;
    
    while ((match = tagRegex.exec(fullText)) !== null) {
      const [fullTag, tagName, attributes, selfClosingMark] = match;
      const lowerTagName = tagName.toLowerCase();
      const position = match.index;
      const tagEnd = position + fullTag.length;
      
      // Skip if this match is inside a comment
      const isInComment = commentRegions.some(c => 
        position >= c.from && position < c.to
      );
      
      if (isInComment) continue;
      
      // Check if it's a closing tag
      const isClosingTag = fullTag.startsWith('</');
      
      // Check if it's self-closing (either explicit "/" or void element)
      const isSelfClosing = selfClosingMark === '/' || VOID_TAGS.has(lowerTagName);
      
      // Handle self-closing tags
      if (!isClosingTag && isSelfClosing) {
        regions.push({
          from: position,
          to: tagEnd,
          tagName: lowerTagName,
          isMultiline: false, // Self-closing tags are typically single line
          content: fullTag,
          openTagEnd: tagEnd,
          closeTagStart: tagEnd,
          isSelfClosing: true
        });
        continue;
      }
      
      // Handle opening tags - push to stack
      if (!isClosingTag) {
        tagStack.push({
          tagName: lowerTagName,
          openPos: position,
          openTagEnd: tagEnd
        });
      } 
      // Handle closing tags - match with most recent opening tag of same name
      else {
        // Find the matching opening tag
        for (let i = tagStack.length - 1; i >= 0; i--) {
          if (tagStack[i].tagName === lowerTagName) {
            const openTag = tagStack.splice(i, 1)[0]; // Remove and get the matching opening tag
            const htmlContent = fullText.substring(openTag.openPos, tagEnd);
            
            // Detect if this spans multiple lines
            const isMultiline = htmlContent.includes('\n');
            
            // Create HTML region
            regions.push({
              from: openTag.openPos,
              to: tagEnd,
              tagName: lowerTagName,
              isMultiline,
              content: htmlContent,
              openTagEnd: openTag.openTagEnd,
              closeTagStart: position,
              isSelfClosing: false
            });
            break;
          }
        }
      }
    }
    
    // Process any leftover tags in the stack as incomplete/unmatched tags
    // We'll treat them as valid regions for highlighting purposes
    for (const unmatched of tagStack) {
      const from = unmatched.openPos;
      const to = Math.min(from + 100, fullText.length); // Reasonable boundary
      
      regions.push({
        from,
        to,
        tagName: unmatched.tagName,
        isMultiline: fullText.substring(from, to).includes('\n'),
        content: fullText.substring(from, to),
        openTagEnd: unmatched.openTagEnd,
        closeTagStart: to,
        isSelfClosing: false
      });
    }
    
    // Sort by start position
    regions.sort((a, b) => a.from - b.from);
    
    // Filter out nested regions (only parent tags)
    return filterNestedRegions(regions);
  } catch (error) {
    console.error("Error detecting HTML regions:", error);
    return [];
  }
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
 * Filter out nested regions to avoid duplicate rendering
 */
function filterNestedRegions(regions: HtmlRegion[]): HtmlRegion[] {
  const standaloneRegions: HtmlRegion[] = [];
  
  for (let i = 0; i < regions.length; i++) {
    let isNested = false;
    for (let j = 0; j < regions.length; j++) {
      if (i !== j && 
          regions[i].from > regions[j].from && 
          regions[i].to < regions[j].to) {
        isNested = true;
        break;
      }
    }
    if (!isNested) {
      standaloneRegions.push(regions[i]);
    }
  }
  
  return standaloneRegions;
}

/**
 * Determine if cursor is near or within an HTML region
 */
export function isCursorNearRegion(view: EditorView, region: HtmlRegion): boolean {
  const selection = view.state.selection.main;
  const cursor = selection.head;
  const doc = view.state.doc;
  
  // Check if cursor is on any line containing the HTML region
  const startLine = doc.lineAt(region.from);
  const endLine = doc.lineAt(region.to);
  const cursorLine = doc.lineAt(cursor);
  
  // Enhanced cursor detection:
  // 1. Inside the HTML region
  if (cursor >= region.from && cursor <= region.to) {
    return true;
  }
  
  // 2. On the same line as HTML start/end tags
  if (cursorLine.number === startLine.number || 
      cursorLine.number === endLine.number) {
    return true;
  }
  
  // 3. Within reasonable distance of HTML boundaries
  const distanceThreshold = 5; // characters
  if (Math.abs(cursor - region.from) <= distanceThreshold || 
      Math.abs(cursor - region.to) <= distanceThreshold) {
    return true;
  }
  
  // 4. Has a selection that overlaps the HTML region
  for (const range of view.state.selection.ranges) {
    if (range.from <= region.to && range.to >= region.from) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if the editor is in preview/read-only mode
 */
export function isEditorInPreviewMode(view: EditorView): boolean {
  // Check if editor is in read-only mode
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