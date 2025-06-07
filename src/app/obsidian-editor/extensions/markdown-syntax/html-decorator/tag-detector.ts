import { Text } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HtmlRegion, VOID_TAGS } from './types';

/**
 * Detects HTML regions in the document text
 */
export function detectHtmlRegions(view: EditorView): HtmlRegion[] {
  try {
    console.log("Detecting HTML regions");
    const regions: HtmlRegion[] = [];
    const { state } = view;
    const doc = state.doc;
    
    // Get the entire document text for proper tag matching
    const fullText = doc.toString();
    console.log("Document length:", fullText.length);
    
    // First, identify HTML comments and exclude them from tag processing
    const commentRegions = findHtmlComments(fullText);
    if (commentRegions.length) {
      console.log(`Found ${commentRegions.length} HTML comments`);
    }
    
    // Use a simpler regex approach to find HTML tags
    // This is more reliable for our specific use case
    const htmlTagRegex = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
    let match: RegExpExecArray | null;
    
    while ((match = htmlTagRegex.exec(fullText)) !== null) {
      try {
        const [fullTag, tagName, attributes, content] = match;
        const position = match.index;
        const tagEnd = position + fullTag.length;
        const lowerTagName = tagName.toLowerCase();
        
        // Skip if this match is inside a comment
        const isInComment = commentRegions.some(c => 
          position >= c.from && position < c.to
        );
        
        if (isInComment) {
          console.log(`Skipping HTML tag ${lowerTagName} inside comment`);
          continue;
        }
        
        // Check if it's self-closing
        const isSelfClosing = fullTag.endsWith('/>') || VOID_TAGS.has(lowerTagName);
        
        // Calculate positions for open and close tags
        const openTagEndPos = fullTag.indexOf('>') + 1 + position;
        const closeTagStartPos = isSelfClosing ? tagEnd : tagEnd - tagName.length - 3; // -3 for "</>"
        
        // Check if it spans multiple lines
        const isMultiline = fullTag.includes('\n');
        
        console.log(`Found HTML tag: ${lowerTagName} at pos ${position}-${tagEnd}, multiline: ${isMultiline}`);
        
        // Add region
        regions.push({
          from: position,
          to: tagEnd,
          tagName: lowerTagName,
          isMultiline,
          content: fullTag,
          openTagEnd: openTagEndPos,
          closeTagStart: closeTagStartPos,
          isSelfClosing
        });
      } catch (error) {
        console.error("Error processing HTML tag match:", error);
      }
    }
    
    // Also detect singleton tags <tag> without closing tags
    // which could be void elements like <br>, <img>, etc.
    const voidTagRegex = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)>/g;
    voidTagRegex.lastIndex = 0; // Reset regex
    
    while ((match = voidTagRegex.exec(fullText)) !== null) {
      try {
        const [fullTag, tagName, attributes] = match;
        const lowerTagName = tagName.toLowerCase();
        const position = match.index;
        const tagEnd = position + fullTag.length;
        
        // Only process if it's a void element and not already captured
        if (VOID_TAGS.has(lowerTagName) && 
            !regions.some(r => r.from === position && r.to === tagEnd)) {
          
          // Skip if this match is inside a comment
          const isInComment = commentRegions.some(c => 
            position >= c.from && position < c.to
          );
          
          if (isInComment) continue;
          
          console.log(`Found void HTML tag: ${lowerTagName} at pos ${position}-${tagEnd}`);
          
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
      } catch (error) {
        console.error("Error processing void HTML tag match:", error);
      }
    }
    
    // Sort regions by start position
    regions.sort((a, b) => a.from - b.from);
    
    console.log(`Total HTML regions detected: ${regions.length}`);
    
    return regions;
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
 * Determine if cursor is near or within an HTML region
 */
export function isCursorNearRegion(view: EditorView, region: HtmlRegion): boolean {
  const selection = view.state.selection.main;
  const cursor = selection.head;
  
  // 1. Precise check - cursor is inside the HTML region
  if (cursor >= region.from && cursor <= region.to) {
    return true;
  }
  
  // 2. Line proximity check - cursor is on the first or last line of the region
  const doc = view.state.doc;
  const startLine = doc.lineAt(region.from);
  const endLine = doc.lineAt(region.to);
  const cursorLine = doc.lineAt(cursor);
  
  // If cursor is on same line as start or end of HTML, consider it near
  if (cursorLine.number === startLine.number || 
      cursorLine.number === endLine.number) {
    return true;
  }
  
  // 3. Character proximity check - cursor is very close to the region boundaries
  const proximityThreshold = 5; // characters
  if (Math.abs(cursor - region.from) <= proximityThreshold || 
      Math.abs(cursor - region.to) <= proximityThreshold) {
    return true;
  }
  
  // 4. Selection overlap check - any part of the selection overlaps with the region
  for (const range of view.state.selection.ranges) {
    if (range.from <= region.to && range.to >= region.from) {
      return true;
    }
  }
  
  // If none of the above, the cursor is not near the region
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