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
 * - HTML_TAG_REGEX: Matches paired tags like <div>...</div>
 * - HTML_VOID_TAG_REGEX: Matches void elements like <img> that don't need a closing tag
 * - HTML_SELF_CLOSING_REGEX: Matches explicitly self-closed tags like <source />
 */
const HTML_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*)>([\s\S]*?)<\/\1>/g;
const HTML_VOID_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)>(?!\s*<\/\1>)/g;
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
  constructor(readonly html: string, readonly inline: boolean = false, readonly fullRender: boolean = false) {
    super();
  }

  toDOM() {
    console.log("HTMLContentWidget.toDOM called", {
      html: this.html?.substring(0, 100),
      inline: this.inline,
      fullRender: this.fullRender,
      length: this.html?.length || 0
    });
    
    // Create a cleaner wrapper focused on rendering
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-html-content-widget';
    
    // More subtle styling that prioritizes content
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.border = '1px solid #e0e0e0';
    wrapper.style.borderLeft = '4px solid #4285f4';
    wrapper.style.borderRadius = '4px';
    wrapper.style.padding = '15px';
    wrapper.style.margin = '10px 0';
    wrapper.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    wrapper.style.position = 'relative';
    wrapper.style.fontSize = '16px';
    wrapper.style.width = 'calc(100% - 32px)'; // Account for padding
    
    // Create toggle button for source/preview 
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'View Source';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '8px';
    toggleButton.style.right = '8px';
    toggleButton.style.fontSize = '12px';
    toggleButton.style.padding = '4px 8px';
    toggleButton.style.backgroundColor = '#f5f5f5';
    toggleButton.style.border = '1px solid #ddd';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.zIndex = '2';
    
    // Create containers for both source and rendered views
    const sourceView = document.createElement('div');
    sourceView.className = 'cm-html-source-view';
    sourceView.style.display = 'none'; // Hidden by default
    
    const renderedView = document.createElement('div');
    renderedView.className = 'cm-html-rendered-view';
    
    // Add toggle functionality
    toggleButton.addEventListener('click', () => {
      if (sourceView.style.display === 'none') {
        sourceView.style.display = 'block';
        renderedView.style.display = 'none';
        toggleButton.textContent = 'View Rendered';
      } else {
        sourceView.style.display = 'none';
        renderedView.style.display = 'block';
        toggleButton.textContent = 'View Source';
      }
    });
    
    // Add source code view with syntax highlighting
    const codeBlock = document.createElement('pre');
    codeBlock.style.margin = '0';
    codeBlock.style.padding = '10px';
    codeBlock.style.backgroundColor = '#f8f8f8';
    codeBlock.style.border = '1px solid #eee';
    codeBlock.style.borderRadius = '3px';
    codeBlock.style.overflow = 'auto';
    codeBlock.style.fontSize = '12px';
    codeBlock.style.fontFamily = 'monospace';
    codeBlock.style.whiteSpace = 'pre-wrap';
    codeBlock.style.color = '#333';
    
    // Format HTML with syntax highlighting
    const tagRegex = /(&lt;\/?[^\s&]+)(?=[^&]*&gt;)/g;
    const formattedHtml = this.html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(tagRegex, '<span style="color:#4285f4;font-weight:bold">$1</span>')
      .replace(/(&gt;)/g, '<span style="color:#4285f4;font-weight:bold">$1</span>');
    
    codeBlock.innerHTML = formattedHtml;
    sourceView.appendChild(codeBlock);
    
    // Content container for rendered HTML
    const contentContainer = document.createElement('div');
    contentContainer.className = 'cm-html-rendered-content';
    contentContainer.style.backgroundColor = 'white';
    contentContainer.style.minHeight = '20px';
    
    // Try to render the HTML content
    try {
      // Sanitize the HTML first
      const sanitizedHtml = this.html.replace(/javascript:/gi, '');
      contentContainer.innerHTML = sanitizedHtml;
      
      // Add event listeners to prevent navigation
      const links = contentContainer.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', (e) => e.preventDefault());
        link.style.pointerEvents = 'none';
      });
      
      // Handle media elements specially
      this.enhanceEmbeddedElements(contentContainer);
      
    } catch (error: any) {
      console.error("Error rendering HTML content:", error);
      contentContainer.textContent = "Error rendering HTML content: " + (error.message || String(error));
    }
    
    // Add everything to the wrapper in the right order
    renderedView.appendChild(contentContainer);
    wrapper.appendChild(toggleButton);
    wrapper.appendChild(renderedView); // Show rendered view by default
    wrapper.appendChild(sourceView);   // Source view hidden by default
    
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
      } catch (e: any) {
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
    
    // Create a prominent indicator for audio content
    const audioHeader = document.createElement('div');
    audioHeader.textContent = '🔊 Audio Player';
    audioHeader.style.fontWeight = 'bold';
    audioHeader.style.marginBottom = '6px';
    audioHeader.style.color = 'var(--text-normal, #333)';
    container.appendChild(audioHeader);
    
    // Create a proper audio player with enhanced styling
    const audioPlayer = document.createElement('div');
    audioPlayer.className = 'cm-audio-player';
    audioPlayer.style.backgroundColor = 'var(--background-secondary, #f5f5f5)';
    audioPlayer.style.border = '2px solid var(--interactive-accent, #5c7aff)';
    audioPlayer.style.borderRadius = '6px';
    audioPlayer.style.padding = '12px';
    audioPlayer.style.margin = '8px 0';
    audioPlayer.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
    
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.style.width = '100%';
    audio.style.minWidth = '250px';
    audio.style.minHeight = '40px';
    
    // Extract sources from the original audio element
    let hasSources = false;
    const sources = audioEl.getElementsByTagName('source');
    
    // If no sources found directly, try parsing the raw HTML for source tags
    // This helps when the DOMParser might not correctly nest tags
    if (sources.length === 0 && this.html.includes('<source')) {
      // Extract source tags manually
      const sourceRegex = /<source\s+([^>]*)\s*\/?>/gi;
      let sourceMatch;
      
      while ((sourceMatch = sourceRegex.exec(this.html)) !== null) {
        hasSources = true;
        const sourceAttributes = sourceMatch[1];
        const srcMatch = /src\s*=\s*["']([^"']*)["']/i.exec(sourceAttributes);
        const typeMatch = /type\s*=\s*["']([^"']*)["']/i.exec(sourceAttributes);
        
        if (srcMatch) {
          const newSource = document.createElement('source');
          newSource.src = srcMatch[1];
          if (typeMatch) newSource.type = typeMatch[1];
          audio.appendChild(newSource);
        }
      }
    } else {
      // Use the sources found by the DOM parser
      Array.from(sources).forEach(source => {
        hasSources = true;
        const newSource = document.createElement('source');
        if (source.src) newSource.src = source.src;
        if (source.type) newSource.type = source.type;
        audio.appendChild(newSource);
      });
    }
    
    // If direct src is available on the audio element
    if (audioEl.src) {
      audio.src = audioEl.src;
    }
    
    audioPlayer.appendChild(audio);
    container.appendChild(audioPlayer);
    
    // Add a label to identify it as an audio element
    const label = document.createElement('div');
    label.className = 'cm-audio-label';
    label.style.fontSize = 'smaller';
    label.style.marginTop = '4px';
    label.style.color = 'var(--text-muted, #999)';
    label.textContent = '🔊 Audio Player';
    audioPlayer.appendChild(label);
    
    // Add fallback text if present in the original
    const innerContent = audioEl.innerHTML;
    if (innerContent && innerContent.trim() && !innerContent.includes('source') || innerContent.includes("browser does not support")) {
      const fallback = document.createElement('div');
      fallback.className = 'cm-html-fallback';
      fallback.textContent = innerContent.includes("browser does not support") ? 
        'Your browser does not support the audio element.' : innerContent.trim();
      fallback.style.fontSize = 'smaller';
      fallback.style.fontStyle = 'italic';
      audioPlayer.appendChild(fallback);
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
    return this.html === other.html && this.inline === other.inline && this.fullRender === other.fullRender;
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
 * Identifies HTML regions in the document content using a stack-based approach for proper nesting
 */
function identifyHtmlRegions(view: EditorView): HtmlRegion[] {
  const regions: HtmlRegion[] = [];
  
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
    
    console.log("[identifyHtmlRegions] Starting HTML detection");
    
    // Log the first 100 characters of the document for debugging
    console.log(`Document content (first 100 chars): "${fullText.substring(0, 100).replace(/\n/g, '\\n')}"`);
    
    // First, identify HTML comments and exclude them from processing
    const commentRegex = /<!--[\s\S]*?-->/g;
    let comments = [];
    let commentMatch;
    while ((commentMatch = commentRegex.exec(fullText)) !== null) {
      comments.push({
        start: commentMatch.index,
        end: commentMatch.index + commentMatch[0].length
      });
      console.log(`Found HTML comment: "${commentMatch[0].substring(0, 30).replace(/\n/g, '\\n')}..."`);
    }
    
    // We'll use a stack-based approach to handle nested tags properly
    const tagStack: Array<{tagName: string, openPos: number, openTagEnd: number}> = [];
    
    // Match all HTML tags (opening, closing, self-closing) with their positions
    // Enhanced regex for more reliable tag detection, including attributes with quotes
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z0-9_\-:]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?)>/g;
    let match: RegExpExecArray | null;
    
    // Debug: manually check for common tags
    const manualTagCheck = (tag: string) => {
      const tagIndex = fullText.indexOf(`<${tag}`);
      if (tagIndex >= 0) {
        console.log(`Manual check found <${tag}> tag at position ${tagIndex}`);
        const endIndex = fullText.indexOf('>', tagIndex);
        if (endIndex > tagIndex) {
          console.log(`  Tag content: "${fullText.substring(tagIndex, endIndex + 1)}"`);
        }
      }
    };
    
    // Check for specific tags
    ['div', 'span', 'audio', 'source'].forEach(manualTagCheck);
    
    // Now proceed with regex matching
    while ((match = tagRegex.exec(fullText)) !== null) {
      const fullMatch = match[0];
      const tagName = match[1].toLowerCase();
      const matchIndex = match.index;
      
      // Debug output
      console.log(`Found tag: <${tagName}> at position ${matchIndex}, content: "${fullMatch.substring(0, 30)}${fullMatch.length > 30 ? '...' : ''}"`);
      
      // Skip if this match is inside a comment
      const isInComment = comments.some(c => matchIndex >= c.start && matchIndex < c.end);
      if (isInComment) {
        console.log(`Skipping HTML tag inside comment: ${fullMatch}`);
        continue;
      }
      
      const attributes = match[2];
      const isSelfClosing = match[3] === '/' || VOID_TAGS.has(tagName);
      const isClosingTag = fullMatch.startsWith('</');
      const position = match.index;
      
      // Handle self-closing tags immediately
      if (isSelfClosing && !isClosingTag) {
        regions.push({
          from: position,
          to: position + fullMatch.length,
          isMultiLine: false,
          content: fullMatch,
          tagName,
          openTagEnd: position + fullMatch.length,
          closeTagStart: position + fullMatch.length,
          isSelfClosing: true
        });
        continue;
      }
      
      // Handle opening tags - push to stack
      if (!isClosingTag) {
        tagStack.push({
          tagName,
          openPos: position,
          openTagEnd: position + fullMatch.length
        });
      } 
      // Handle closing tags - match with most recent opening tag of same type
      else {
        // Find the matching opening tag (from the end of the stack)
        for (let i = tagStack.length - 1; i >= 0; i--) {
          if (tagStack[i].tagName === tagName) {
            const openTag = tagStack.splice(i, 1)[0]; // Remove and get the matching opening tag
            const htmlContent = fullText.substring(openTag.openPos, position + fullMatch.length);
            
            // Determine if it spans multiple lines
            const isMultiLine = htmlContent.includes('\n');
            
            regions.push({
              from: openTag.openPos,
              to: position + fullMatch.length,
              isMultiLine,
              content: htmlContent,
              tagName,
              openTagEnd: openTag.openTagEnd,
              closeTagStart: position,
              isSelfClosing: false
            });
            
            console.log(`[identifyHtmlRegions] Found HTML tag pair: ${tagName} at ${openTag.openPos}-${position + fullMatch.length}, multiline: ${isMultiLine}`);
            break;
          }
        }
      }
    }
    
    // Sort regions by starting position
    regions.sort((a, b) => a.from - b.from);
    
    // Remove any nested regions (child tags inside parent tags)
    const standaloneRegions = [];
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
    
    console.log(`[identifyHtmlRegions] Found ${regions.length} total HTML regions, ${standaloneRegions.length} standalone regions`);
    return standaloneRegions;
  } catch (err) {
    console.error("Fatal error in identifyHtmlRegions:", err);
    return regions;
  }
}

/**
 * Checks if the cursor is directly within or adjacent to an HTML region
 */
function isCursorNearRegion(view: EditorView, region: HtmlRegion): boolean {
  const { state } = view;
  const selection = state.selection.main;
  const cursor = selection.head;
  
  // Enable cursor detection on ENTIRE LINES containing HTML
  // This makes the region much more navigable
  const doc = view.state.doc;
  const startLine = doc.lineAt(region.from);
  const endLine = region.to < doc.length ? doc.lineAt(region.to) : doc.line(doc.lines);
  
  // Check if cursor is on ANY line containing the HTML region
  const cursorLine = doc.lineAt(cursor);
  if (cursorLine.number >= startLine.number && cursorLine.number <= endLine.number) {
    return true;
  }
  
  // Check if cursor is inside the HTML region (exact check)
  if (cursor >= region.from && cursor <= region.to) {
    return true;
  }
  
  // Check tag boundaries
  if (cursor === region.from || cursor === region.to || 
      cursor === region.openTagEnd || cursor === region.closeTagStart) {
    return true;
  }
  
  // For self-closing tags, check cursor position
  if (region.isSelfClosing) {
    // Be more forgiving with position detection
    const slashPos = region.to - 2;
    if (cursor >= region.from - 2 && cursor <= region.to + 2) { // Allow 2 chars of slack
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
  const decorations: {from: number, to: number, decoration: Decoration}[] = [];
  
  try {
    // Identify HTML regions
    const htmlRegions = identifyHtmlRegions(view);
    
    // Debug output to show what regions were found
    if (htmlRegions && htmlRegions.length > 0) {
      console.debug(`Found ${htmlRegions.length} HTML regions:`, 
        htmlRegions.map(r => ({
          tag: r.tagName,
          isMultiLine: r.isMultiLine, 
          content: r.content.substring(0, 20) + (r.content.length > 20 ? '...' : '')
        }))
      );
    } else {
      console.debug("No HTML regions found");
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
          if (isCursorNear) {
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
          // In view/preview mode, we NEED EXTREME VISIBILITY for multiline HTML
          else {
            console.log(`Rendering multiline HTML (${region.tagName}) at positions ${region.from}-${region.to}: ${region.content.substring(0, 50)}...`);
            
            // ALWAYS use widget approach for any HTML content
            console.log("Using widget approach for HTML content");
            
            // FIRST: Add the rendered HTML widget at the beginning
            decorations.push({
              from: startLine.from,
              to: startLine.from,
              decoration: Decoration.widget({
                widget: new HTMLContentWidget(region.content, false, true),
                side: -1,
                block: true
              })
            });
            
            // SECOND: Style the original HTML source to be nearly invisible but still navigable
            // This ensures the content is both rendered AND navigable with keyboard
            for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
              const line = doc.line(lineNum);
              if (line.from >= line.to) continue;
              
              const lineFrom = Math.max(line.from, region.from);
              const lineTo = Math.min(line.to, region.to);
              
              if (lineFrom < lineTo) {
                decorations.push({
                  from: lineFrom,
                  to: lineTo,
                  decoration: Decoration.mark({
                    class: 'cm-html-multiline-content',
                    attributes: {
                      'data-html-tag': region.tagName,
                      // Make the content nearly invisible but keep it accessible for keyboard navigation
                      'style': 'color: rgba(0,0,0,0.03); font-size: 1px; pointer-events: none; user-select: none; position: relative;'
                    }
                  })
                });
              }
            }
            
            // Add another spacer widget at the end for better navigation
            decorations.push({
              from: region.to,
              to: region.to,
              decoration: Decoration.widget({
                widget: new class extends WidgetType {
                  toDOM() {
                    const endMarker = document.createElement('div');
                    endMarker.className = 'cm-html-end-marker';
                    endMarker.textContent = `/${region.tagName}`;
                    endMarker.style.color = '#4285f4';
                    endMarker.style.fontSize = '12px';
                    endMarker.style.fontWeight = 'bold';
                    endMarker.style.marginTop = '10px';
                    endMarker.style.borderTop = '1px dashed #4285f4';
                    endMarker.style.paddingTop = '5px';
                    endMarker.style.width = '100%';
                    return endMarker;
                  }
                  
                  eq() { return true; }
                },
                side: 1,
                block: true
              })
            });
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
    
    // Log decoration data before sorting
    console.debug("Decorations before sorting:", 
      decorations.map(d => ({from: d.from, to: d.to, isWidget: d.decoration.spec?.widget !== undefined}))
    );
    
    // Ensure decorations are properly sorted before adding to builder
    decorations.sort((a, b) => {
      // First sort by from position
      if (a.from !== b.from) return a.from - b.from;
      
      // If from positions are equal, determine startSide based on decoration type
      // Following CodeMirror's convention: widget decorations need special handling
      const aIsWidget = a.decoration.spec?.widget !== undefined;
      const bIsWidget = b.decoration.spec?.widget !== undefined;
      
      if (aIsWidget && !bIsWidget) return -1;
      if (!aIsWidget && bIsWidget) return 1;
      
      // If both are widgets or both are not, sort by 'to' position
      return a.to - b.to;
    });
    
    // Log decoration data after sorting to verify order
    console.debug("Decorations after sorting:", 
      decorations.map(d => ({from: d.from, to: d.to, isWidget: d.decoration.spec?.widget !== undefined}))
    );
  } catch (e) {
    console.error("Error in buildHTMLTagDecorations:", e);
    return Decoration.none;
  }
  
  // Now add them to the builder in sorted order
  const builder = new RangeSetBuilder<Decoration>();
  for (const {from, to, decoration} of decorations) {
    if (from < to && decoration) {
      try {
        // Add all decorations regardless of type - disable cross-line boundary check for testing
        builder.add(from, to, decoration);
        
        // Log successful decoration addition
        const isWidget = decoration.spec?.widget !== undefined;
        const widget = isWidget ? decoration.spec?.widget : null;
        const widgetType = widget ? widget.constructor.name : 'None';
        
        console.log(`Added decoration: ${from}-${to}, type: ${isWidget ? 'widget' : 'mark'}, widgetType: ${widgetType}`);
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
