import { Decoration, WidgetType, EditorView, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder, EditorState } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import DOMPurify from 'dompurify';
import { markdownSyntaxStateField } from '../index';
import { formatHTML } from '../../../utils/formatting/html-formatter';

/**
 * Register DOMPurify hooks only on the client-side for security
 */
if (typeof window !== 'undefined') {
  // Set default DOMPurify configuration with stricter security
  DOMPurify.setConfig({
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_TAGS: ['iframe', 'script', 'style', 'link', 'meta', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onunload', 'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onkeypress', 'onkeydown', 'onkeyup']
  });

  DOMPurify.addHook('afterSanitizeAttributes', function (node: Element) {
    // Set all elements owning target to target=_blank
    if ('target' in node) {
      node.setAttribute('target', '_blank');
      // Prevent XSS via window.opener
      node.setAttribute('rel', 'noopener noreferrer');
    }
    // Set sandbox attribute on iframes
    if (node.nodeName === 'IFRAME') {
      node.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms allow-same-origin');
    }
  });
}

/**
 * Regex patterns to match HTML tag pairs and self-closing tags
 */
const HTML_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*)>([\s\S]*?)<\/\1>/g;
const HTML_VOID_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(?:\s*\/?)>(?!\s*<\/\1>)/g;
const HTML_SELF_CLOSING_REGEX = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\s*\/>/g;

/**
 * List of common self-closing HTML tags
 */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr', 'command', 'keygen'
]);

/**
 * Decorations for HTML syntax highlighting
 */
const htmlTagMark = Decoration.mark({ class: 'cm-html-tag-syntax' });

/**
 * Interface for HTML region information
 */
interface HtmlRegion {
  from: number;
  to: number;
  isMultiLine: boolean;
  content: string;
  tagName: string;
  openTagEnd: number;
  closeTagStart: number;
  isSelfClosing: boolean;
}

/**
 * Base widget for rendering HTML content
 */
class HTMLContentWidget extends WidgetType {
  constructor(readonly html: string, readonly inline: boolean = false) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement(this.inline ? 'span' : 'div');
    wrapper.className = `cm-html-rendered ${this.inline ? 'cm-html-inline' : 'cm-html-block'}`;
    
    try {
      // Safety check for html content
      if (!this.html || typeof this.html !== 'string') {
        console.warn("Invalid HTML content in HTMLContentWidget:", this.html);
        wrapper.textContent = String(this.html);
        return wrapper;
      }
      
      // Check if we should handle this element specially
      if (this.hasSpecialElement(this.html)) {
        this.renderSpecialElement(wrapper, this.html);
      } else {
        // Standard HTML rendering with sanitization
        try {
          const sanitizedHtml = formatHTML(this.html);
          wrapper.innerHTML = sanitizedHtml;
          
          // If wrapper is empty after sanitization or contains self-closing tags, show the raw HTML
          if (wrapper.innerHTML === '' || 
              (this.html.includes('/>') && this.html.match(/<[^>]+\/>/))) {
            // For self-closing tags, add a special class and show raw HTML
            if (this.html.includes('/>')) {
              wrapper.classList.add('cm-html-self-closing');
              const code = document.createElement('code');
              code.textContent = this.html;
              wrapper.appendChild(code);
            } else {
              wrapper.textContent = this.html;
            }
          }
        } catch (sanitizeError) {
          console.error("Error sanitizing HTML:", sanitizeError);
          wrapper.textContent = this.html;
        }
        
        // Add extra styling to embedded elements
        try {
          this.enhanceEmbeddedElements(wrapper);
        } catch (enhanceError) {
          console.error("Error enhancing embedded elements:", enhanceError);
        }
      }
    } catch (error) {
      console.error('Error rendering HTML:', error);
      wrapper.textContent = this.html || '';
    }
    
    return wrapper;
  }
  
  /**
   * Check if HTML contains elements that need special handling
   */
  private hasSpecialElement(html: string): boolean {
    const lowerHtml = html.toLowerCase().trim();
    // Don't treat script tags as special - they should be shown as code
    if (lowerHtml.includes('<script')) return false;
    
    return lowerHtml.includes('<iframe') || 
           lowerHtml.includes('<audio') || 
           lowerHtml.includes('<video');
  }
  
  /**
   * Render special HTML elements with enhanced styling
   */
  private renderSpecialElement(container: HTMLElement, html: string) {
    if (!html || typeof html !== 'string') {
      console.warn("Invalid HTML passed to renderSpecialElement");
      container.textContent = String(html);
      return;
    }
    
    // Handle script tags with the formatter
    if (html.toLowerCase().includes('<script')) {
      try {
        container.innerHTML = formatHTML(html);
      } catch (e) {
        console.error("Error formatting script HTML:", e);
        container.textContent = html;
      }
      return;
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Handle audio elements
      if (html.toLowerCase().includes('<audio')) {
        const audioElements = doc.getElementsByTagName('audio');
        if (audioElements.length > 0) {
          try {
            this.renderAudio(container, audioElements[0] as HTMLAudioElement);
            return;
          } catch (e) {
            console.error("Error rendering audio:", e);
          }
        }
      }
      
      // Handle video elements
      if (html.toLowerCase().includes('<video')) {
        const videoElements = doc.getElementsByTagName('video');
        if (videoElements.length > 0) {
          try {
            this.renderVideo(container, videoElements[0] as HTMLVideoElement);
            return;
          } catch (e) {
            console.error("Error rendering video:", e);
          }
        }
      }
      
      // Handle iframes
      if (html.toLowerCase().includes('<iframe')) {
        const iframeElements = doc.getElementsByTagName('iframe');
        if (iframeElements.length > 0) {
          try {
            this.renderIframe(container, iframeElements[0] as HTMLIFrameElement);
            return;
          } catch (e) {
            console.error("Error rendering iframe:", e);
          }
        }
      }
      
      // Default rendering for other elements
      container.innerHTML = formatHTML(html);
    } catch (error) {
      console.error("Error parsing HTML:", error);
      // Safe fallback
      try {
        container.innerHTML = formatHTML(html);
      } catch (e) {
        console.error("Error in fallback HTML formatting:", e);
        container.textContent = html;
      }
    }
  }
  
  /**
   * Render iframe with appropriate styling
   */
  private renderIframe(container: HTMLElement, iframeEl: HTMLIFrameElement) {
    container.classList.add('cm-html-iframe-container');
    
    const iframe = document.createElement('iframe');
    
    // Copy sanitized attributes
    if (iframeEl.src) iframe.src = iframeEl.src;
    if (iframeEl.width) iframe.width = iframeEl.width;
    if (iframeEl.height) iframe.height = iframeEl.height;
    
    // Default dimensions if not specified
    if (!iframe.width) iframe.width = '100%';
    if (!iframe.height) iframe.height = '300';
    
    // Security attributes
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
    iframe.setAttribute('loading', 'lazy');
    
    container.appendChild(iframe);
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'cm-html-loading';
    loadingIndicator.textContent = 'Loading...';
    container.appendChild(loadingIndicator);
    
    iframe.addEventListener('load', () => {
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
    });
  }
  
  /**
   * Render audio with appropriate styling
   */
  private renderAudio(container: HTMLElement, audioEl: HTMLAudioElement) {
    container.classList.add('cm-html-audio-container');
    
    const audio = document.createElement('audio');
    audio.controls = true;
    
    // Copy sources
    Array.from(audioEl.getElementsByTagName('source')).forEach(source => {
      const newSource = document.createElement('source');
      if (source.src) newSource.src = source.src;
      if (source.type) newSource.type = source.type;
      audio.appendChild(newSource);
    });
    
    // If direct src is available
    if (audioEl.src) {
      audio.src = audioEl.src;
    }
    
    container.appendChild(audio);
    
    // Don't show fallback text by default since most modern browsers support audio
    // Only add fallback if specifically set in the original HTML
    if (audioEl.innerHTML.includes("browser does not support")) {
      const fallback = document.createElement('div');
      fallback.className = 'cm-html-fallback';
      fallback.textContent = 'Your browser does not support the audio element.';
      container.appendChild(fallback);
    }
  }
  
  /**
   * Render video with appropriate styling
   */
  private renderVideo(container: HTMLElement, videoEl: HTMLVideoElement) {
    container.classList.add('cm-html-video-container');
    
    const video = document.createElement('video');
    video.controls = true;
    
    // Copy sources
    Array.from(videoEl.getElementsByTagName('source')).forEach(source => {
      const newSource = document.createElement('source');
      if (source.src) newSource.src = source.src;
      if (source.type) newSource.type = source.type;
      video.appendChild(newSource);
    });
    
    // If direct src is available
    if (videoEl.src) {
      video.src = videoEl.src;
    }
    
    // Add poster if available
    if (videoEl.poster) {
      video.poster = videoEl.poster;
    }
    
    container.appendChild(video);
    
    // Only add fallback if specifically set in the original HTML
    if (videoEl.innerHTML.includes("browser does not support")) {
      const fallback = document.createElement('div');
      fallback.className = 'cm-html-fallback';
      fallback.textContent = 'Your browser does not support the video element.';
      container.appendChild(fallback);
    }
  }
  
  /**
   * Add enhanced styling to embedded elements
   */
  private enhanceEmbeddedElements(container: HTMLElement): void {
    // Style spans
    const spans = container.querySelectorAll('span');
    spans.forEach(span => {
      span.classList.add('cm-html-span');
    });
    
    // Enhance links for security
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }

  eq(other: HTMLContentWidget) {
    return this.html === other.html && this.inline === other.inline;
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Widget for multiline HTML first line
 */
class MultiLineHtmlStartWidget extends WidgetType {
  constructor(readonly html: string, readonly fullHtml: string) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-html-multiline-start';
    
    try {
      // Show just the HTML without rendering it
      const codeElement = document.createElement('code');
      codeElement.textContent = this.html;
      wrapper.appendChild(codeElement);
      
      // Add a preview button
      const previewButton = document.createElement('button');
      previewButton.textContent = 'Preview';
      previewButton.className = 'cm-html-preview-button';
      previewButton.onclick = () => {
        // Toggle preview mode
        const previewContainer = wrapper.querySelector('.cm-html-preview-container');
        if (previewContainer) {
          previewContainer.remove();
          previewButton.textContent = 'Preview';
        } else {
          const newPreview = document.createElement('div');
          newPreview.className = 'cm-html-preview-container';
          newPreview.innerHTML = formatHTML(this.fullHtml);
          wrapper.appendChild(newPreview);
          previewButton.textContent = 'Hide Preview';
        }
      };
      wrapper.appendChild(previewButton);
    } catch (error) {
      console.error('Error rendering HTML start:', error);
      wrapper.textContent = this.html;
    }
    
    return wrapper;
  }
  
  eq(other: MultiLineHtmlStartWidget) {
    return this.html === other.html && this.fullHtml === other.fullHtml;
  }
}

/**
 * Widget for multiline HTML middle lines
 */
class MultiLineHtmlMiddleWidget extends WidgetType {
  constructor(readonly html: string) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-html-multiline-middle cm-html-folded';
    
    try {
      // Just show code in middle lines
      const codeElement = document.createElement('code');
      codeElement.textContent = this.html;
      wrapper.appendChild(codeElement);
    } catch (error) {
      console.error('Error rendering HTML middle:', error);
      wrapper.textContent = this.html;
    }
    
    return wrapper;
  }
  
  eq(other: MultiLineHtmlMiddleWidget) {
    return this.html === other.html;
  }
}

/**
 * Widget for multiline HTML last line
 */
class MultiLineHtmlEndWidget extends WidgetType {
  constructor(readonly html: string) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-html-multiline-end';
    
    try {
      // Show code for the last line
      const codeElement = document.createElement('code');
      codeElement.textContent = this.html;
      wrapper.appendChild(codeElement);
    } catch (error) {
      console.error('Error rendering HTML end:', error);
      wrapper.textContent = this.html;
    }
    
    return wrapper;
  }
  
  eq(other: MultiLineHtmlEndWidget) {
    return this.html === other.html;
  }
}

/**
 * Identifies HTML regions in the document content
 */
function identifyHtmlRegions(view: EditorView): HtmlRegion[] {
  const regions: HtmlRegion[] = [];
  const nestedRegions = new Set<number>(); // Track indices of nested tags to skip them
  
  try {
    const { state } = view;
    if (!state || !state.doc) {
      console.warn("Invalid editor state in identifyHtmlRegions");
      return regions;
    }
    
    const doc = state.doc;
    
    // Get the entire document content for better matching across lines
    const fullText = doc.toString();
    if (!fullText || typeof fullText !== 'string') {
      console.warn("Invalid document text in identifyHtmlRegions");
      return regions;
    }
    
    // Debug document content
    console.debug("Document content length:", fullText.length);
    
    // Match paired HTML tags
    try {
      HTML_TAG_REGEX.lastIndex = 0;
      let match;
      while ((match = HTML_TAG_REGEX.exec(fullText))) {
        if (!match || !Array.isArray(match) || match.length < 4) {
          console.warn("Invalid match in HTML_TAG_REGEX:", match);
          continue;
        }
        
        const fullMatch = match[0];
        const tagName = match[1];
        const tagAttrs = match[2];
        const tagContent = match[3];
        
        if (!fullMatch || !tagName) {
          console.debug("Skipping match with invalid tag name:", match);
          continue;
        }
        
        // Calculate absolute positions in the document
        const tagStart = match.index;
        const tagEnd = tagStart + fullMatch.length;
        
        if (tagEnd <= tagStart) {
          console.debug("Skipping match with invalid positions:", tagStart, tagEnd);
          continue;
        }
        
        const openTagEnd = tagStart + `<${tagName}${tagAttrs}>`.length;
        const closeTagStart = tagEnd - `</${tagName}>`.length;
        
        if (openTagEnd >= closeTagStart) {
          console.debug("Skipping match with overlapping open/close tags:", openTagEnd, closeTagStart);
          continue;
        }
        
        try {
          const startLine = doc.lineAt(tagStart);
          const endLine = doc.lineAt(tagEnd - 1);
          const isMultiLine = startLine.number !== endLine.number;
          
          console.debug(`Found ${isMultiLine ? 'multiline' : 'single-line'} HTML tag:`, tagName, `at line ${startLine.number}-${endLine.number}`);
          
          // Look for self-closing tags within this parent tag's content
          const innerContent = tagContent;
          let selfClosingMatch;
          HTML_SELF_CLOSING_REGEX.lastIndex = 0;
          while ((selfClosingMatch = HTML_SELF_CLOSING_REGEX.exec(innerContent))) {
            if (selfClosingMatch && selfClosingMatch.index !== undefined) {
              // Calculate the absolute position in the document
              const nestedTagPos = tagStart + openTagEnd - tagStart + selfClosingMatch.index;
              nestedRegions.add(nestedTagPos);
            }
          }
          
          regions.push({
            from: tagStart,
            to: tagEnd,
            isMultiLine,
            content: fullMatch,
            tagName,
            openTagEnd,
            closeTagStart,
            isSelfClosing: false
          });
        } catch (docErr) {
          console.error("Error getting line info:", docErr);
        }
      }
    } catch (e) {
      console.error("Error processing HTML tags:", e);
    }
    
    // Match explicit self-closing tags like <tag />
    try {
      HTML_SELF_CLOSING_REGEX.lastIndex = 0;
      let match;
      while ((match = HTML_SELF_CLOSING_REGEX.exec(fullText))) {
        if (!match || !Array.isArray(match) || match.length < 3) {
          console.warn("Invalid match in HTML_SELF_CLOSING_REGEX:", match);
          continue;
        }
        
        const fullMatch = match[0];
        const tagName = match[1];
        const tagAttrs = match[2];
        
        if (!tagName) {
          console.debug("Skipping self-closing tag match with invalid tag name:", match);
          continue;
        }
        
        const tagStart = match.index;
        const tagEnd = tagStart + fullMatch.length;
        
        if (tagEnd <= tagStart) {
          console.debug("Skipping self-closing tag match with invalid positions:", tagStart, tagEnd);
          continue;
        }
        
        // Skip if this is a nested tag that should be handled by its parent
        if (nestedRegions.has(tagStart)) {
          console.debug("Skipping nested self-closing tag:", tagName);
          continue;
        }
        
        try {
          const startLine = doc.lineAt(tagStart);
          const endLine = doc.lineAt(tagEnd - 1);
          const isMultiLine = startLine.number !== endLine.number;
          
          console.debug(`Found ${isMultiLine ? 'multiline' : 'single-line'} self-closing HTML tag:`, tagName, `at line ${startLine.number}`);
          
          // For source tags and other important self-closing tags, ensure they're always visible
          const isSourceTag = tagName.toLowerCase() === 'source';
          
          regions.push({
            from: tagStart,
            to: tagEnd,
            isMultiLine,
            content: fullMatch,
            tagName,
            openTagEnd: tagEnd,
            closeTagStart: tagEnd,
            isSelfClosing: true
          });
        } catch (docErr) {
          console.error("Error getting line info for self-closing tag:", docErr);
        }
      }
    } catch (e) {
      console.error("Error processing self-closing HTML tags:", e);
    }
    
    // Match void HTML tags (that don't need closing tag)
    try {
      HTML_VOID_TAG_REGEX.lastIndex = 0;
      let match;
      while ((match = HTML_VOID_TAG_REGEX.exec(fullText))) {
        if (!match || !Array.isArray(match) || match.length < 3) {
          console.warn("Invalid match in HTML_VOID_TAG_REGEX:", match);
          continue;
        }
        
        const fullMatch = match[0];
        const tagName = match[1];
        const tagAttrs = match[2];
        
        // Skip if not a known void tag and not a self-closing tag (already handled above)
        if (!VOID_TAGS.has(tagName.toLowerCase()) || fullMatch.trim().endsWith('/>')) {
          continue;
        }
        
        const tagStart = match.index;
        const tagEnd = tagStart + fullMatch.length;
        
        if (tagEnd <= tagStart) {
          console.debug("Skipping void tag match with invalid positions:", tagStart, tagEnd);
          continue;
        }
        
        try {
          const startLine = doc.lineAt(tagStart);
          const endLine = doc.lineAt(tagEnd - 1);
          const isMultiLine = startLine.number !== endLine.number;
          
          console.debug(`Found ${isMultiLine ? 'multiline' : 'single-line'} void HTML tag:`, tagName, `at line ${startLine.number}`);
          
          regions.push({
            from: tagStart,
            to: tagEnd,
            isMultiLine,
            content: fullMatch,
            tagName,
            openTagEnd: tagEnd,
            closeTagStart: tagEnd,
            isSelfClosing: true
          });
        } catch (docErr) {
          console.error("Error getting line info for void tag:", docErr);
        }
      }
    } catch (e) {
      console.error("Error processing void HTML tags:", e);
    }
  } catch (err) {
    console.error("Fatal error in identifyHtmlRegions:", err);
  }
  
  return regions;
}

/**
 * Checks if the cursor is directly within or adjacent to an HTML region
 */
function isCursorNearRegion(view: EditorView, region: HtmlRegion): boolean {
  const { state } = view;
  const selection = state.selection.main;
  const cursor = selection.head;
  
  // Check if cursor is inside the HTML region
  if (cursor >= region.from && cursor <= region.to) {
    return true;
  }
  
  // Check if cursor is immediately at the tag start position only
  // Further reduced proximity - only recognize cursor exactly at the start
  if (cursor === region.from) {
    return true;
  }
  
  // For self-closing tags, check if cursor is right at the closing bracket
  // Reduced proximity - only checking exact positions not nearby
  if (region.isSelfClosing) {
    // Locate position of the / character
    const slashPos = region.to - 2;
    if (cursor === slashPos || cursor === region.to) {
      return true;
    }
  } else {
    // For normal tags, check if cursor is at closing tag
    // Reduced proximity - only checking exact positions
    if (cursor === region.closeTagStart || 
        cursor === region.to) {
      return true;
    }
  }
  
  // Check all selections, not just the main one
  for (const sel of state.selection.ranges) {
    if (sel.from <= region.to && sel.to >= region.from) {
      return true;
    }
  }
  
  return false;
}

/**
 * Determine if we're in preview mode based on document state
 */
function isInPreviewMode(view: EditorView): boolean {
  // Check for preview mode class on any parent element
  let element: HTMLElement | null = view.dom;
  while (element) {
    if (element.classList && element.classList.contains('preview-mode')) {
      return true;
    }
    element = element.parentElement;
  }
  
  // Default to true if in a read-only editor
  // Use the state.facet to check if the editor is editable
  return !view.state.facet(EditorView.editable);
}

/**
 * Builds HTML tag decorations for the editor
 */
function buildHTMLTagDecorations(view: EditorView): DecorationSet {
  if (!view || !view.state || !view.state.doc) {
    console.warn("Invalid view in buildHTMLTagDecorations");
    return Decoration.none;
  }

  // Check if we're in edit mode (not preview) - we'll use this to decide whether to show raw HTML
  const isEditMode = !isInPreviewMode(view);

  // Collect all decorations in an array first so we can sort them
  const decorations: Array<{from: number, to: number, decoration: Decoration}> = [];
  
  try {
    // Identify HTML regions
    const htmlRegions = identifyHtmlRegions(view);
    if (!htmlRegions || htmlRegions.length === 0) {
      return Decoration.none;
    }
    
    // Sort regions by 'from' position
    htmlRegions.sort((a, b) => a.from - b.from);
    
    // Preview mode state
    const inPreviewMode = isInPreviewMode(view);
    
    // Process each HTML region
    for (const region of htmlRegions) {
      try {
        if (!region || region.to <= region.from) continue;
        
        const isCursorNear = isCursorNearRegion(view, region);
        const doc = view.state.doc;
        
        // If it's a multiline region, we need special handling
        if (region.isMultiLine) {
          const startLine = doc.lineAt(region.from);
          const endLine = doc.lineAt(region.to - 1);
          
          // Always show raw HTML when in edit mode or cursor is nearby
          // This ensures all content is visible during editing
          if (isCursorNear || !inPreviewMode) {
            // Use mark to ensure proper cursor navigation within HTML
            for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
              const line = doc.line(lineNum);
              if (line.from >= line.to) continue;
              
              // Add each line individually with mark decoration to preserve text editing
              const lineFrom = Math.max(line.from, region.from);
              const lineTo = Math.min(line.to, region.to);
              
              if (lineFrom < lineTo) {
                decorations.push({
                  from: lineFrom,
                  to: lineTo,
                  decoration: htmlTagMark
                });
              }
            }
          }
          // Only render HTML in preview mode
          else {
            // For self-closing tags in multiline HTML, still treat all lines as raw text
            if (region.isSelfClosing) {
              // Process each line individually to preserve self-closing tags
              for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
                const line = doc.line(lineNum);
                if (line.from >= line.to) continue;
                
                const lineFrom = Math.max(line.from, region.from);
                const lineTo = Math.min(line.to, region.to);
                
                // Just mark the lines for syntax highlighting, don't render
                decorations.push({
                  from: lineFrom,
                  to: lineTo,
                  decoration: htmlTagMark
                });
              }
            } else {
              // For regular tags, show all HTML content in the first line
              decorations.push({
                from: startLine.from,
                to: startLine.to,
                decoration: Decoration.replace({
                  widget: new HTMLContentWidget(region.content, false)
                })
              });
              
              // Hide subsequent lines if they exist
              for (let lineNum = startLine.number + 1; lineNum <= endLine.number; lineNum++) {
                const line = doc.line(lineNum);
                
                // Skip lines that would yield empty decorations
                if (line.from >= line.to) continue;
                
                decorations.push({
                  from: line.from,
                  to: line.to,
                  decoration: Decoration.replace({
                    widget: new class extends WidgetType {
                      toDOM() {
                        const span = document.createElement('span');
                        span.style.display = 'none';
                        return span;
                      }
                      eq() { return true; }
                    }
                  })
                });
              }
            }
          }
        }
        // For single-line HTML (including self-closing tags), simpler handling
        else {
          if (isCursorNear) {
            // Show syntax highlighting for the entire HTML tag
            decorations.push({
              from: region.from,
              to: region.to,
              decoration: htmlTagMark
            });
          } else {
            // Render HTML in place
            decorations.push({
              from: region.from,
              to: region.to,
              decoration: Decoration.replace({
                widget: new HTMLContentWidget(region.content, true)
              })
            });
          }
        }
      } catch (e) {
        console.error("Error processing HTML region:", e, region);
      }
    }
    
    // Sort the decorations by from position before adding to builder
    decorations.sort((a, b) => {
      if (a.from !== b.from) return a.from - b.from;
      return a.to - b.to;
    });
  } catch (e) {
    console.error("Error in buildHTMLTagDecorations:", e);
    return Decoration.none;
  }
  
  // Now add them to the builder in sorted order
  const builder = new RangeSetBuilder<Decoration>();
  for (const {from, to, decoration} of decorations) {
    if (from < to && decoration) {
      try {
        // For replace decorations, make sure they don't span line boundaries
        // Use a safer property check instead of instanceof
        const isReplaceDecoration = decoration.spec?.widget !== undefined;
        
        if (isReplaceDecoration) {
          const fromLine = view.state.doc.lineAt(from);
          const toLine = view.state.doc.lineAt(to);
          
          if (fromLine.number === toLine.number) {
            builder.add(from, to, decoration);
          } else {
            console.warn("Skipping replace decoration that would cross line boundaries", from, to);
          }
        } else {
          // Non-replace decorations (like marks) can span lines
          builder.add(from, to, decoration);
        }
      } catch (err) {
        console.error("Error adding decoration:", err, { from, to, decoration });
      }
    }
  }
  
  try {
    return builder.finish();
  } catch (e) {
    console.error("Error finishing decoration builder:", e);
    return Decoration.none;
  }
}

/**
 * ViewPlugin that decorates HTML tags in markdown
 */
export const HTMLTagDecorator = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      try {
        this.decorations = buildHTMLTagDecorations(view);
      } catch (e) {
        console.error("Error initializing HTML tag decorations:", e);
        this.decorations = Decoration.none;
      }
    }

    update(update: ViewUpdate) {
      try {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = buildHTMLTagDecorations(update.view);
        }
      } catch (e) {
        console.error("Error updating HTML tag decorations:", e);
        this.decorations = Decoration.none;
      }
    }
  },
  {
    decorations: v => v.decorations
  }
);
