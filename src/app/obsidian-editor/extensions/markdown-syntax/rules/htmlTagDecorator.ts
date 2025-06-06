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
 * Regex patterns to match HTML tag pairs
 */
const HTML_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*)>([\s\S]*?)<\/\1>/g;
const HTML_VOID_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(?:\s*\/)?>(?!\s*<\/\1>)/g;

/**
 * List of common self-closing HTML tags
 */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr', 'command', 'keygen'
]);

/**
 * Decoration for HTML syntax highlighting
 */
const htmlTagMark = Decoration.mark({
  class: 'cm-html-tag-syntax',
});

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
      // Check for common elements that need special handling
      if (this.hasSpecialElement(this.html)) {
        this.renderSpecialElement(wrapper, this.html);
      } else {
        // For regular HTML, use the formatHTML utility
        wrapper.innerHTML = formatHTML(this.html);
        this.enhanceEmbeddedElements(wrapper);
      }
    } catch (error) {
      console.error('Error rendering HTML:', error);
      wrapper.textContent = this.html;
    }
    
    return wrapper;
  }
  
  /**
   * Check if HTML contains elements that need special handling
   */
  private hasSpecialElement(html: string): boolean {
    const lowerHtml = html.toLowerCase();
    // Don't treat script tags as special elements - they should be shown as code
    if (lowerHtml.includes('<script')) return false;
    
    return lowerHtml.includes('<iframe') || 
           lowerHtml.includes('<audio') || 
           lowerHtml.includes('<video');
  }
  
  /**
   * Render special HTML elements with enhanced styling
   */
  private renderSpecialElement(container: HTMLElement, html: string) {
    // For script tags, use the formatHTML function which handles them specially
    if (html.toLowerCase().includes('<script')) {
      container.innerHTML = formatHTML(html);
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rootElement = doc.body.firstElementChild;
    
    if (!rootElement) {
      container.innerHTML = formatHTML(html);
      return;
    }
    
    const tagName = rootElement.tagName.toLowerCase();
    
    switch (tagName) {
      case 'iframe':
        this.renderIframe(container, rootElement as HTMLIFrameElement);
        break;
      case 'audio':
        this.renderAudio(container, rootElement as HTMLAudioElement);
        break;
      case 'video':
        this.renderVideo(container, rootElement as HTMLVideoElement);
        break;
      default:
        container.innerHTML = formatHTML(html);
        break;
    }
  }
  
  /**
   * Render iframe with obsidian-like styling
   */
  private renderIframe(container: HTMLElement, iframeEl: HTMLIFrameElement) {
    container.classList.add('cm-html-iframe-container');
    
    const iframe = document.createElement('iframe');
    
    // Copy sanitized attributes
    if (iframeEl.src) iframe.src = iframeEl.src;
    if (iframeEl.width) iframe.width = iframeEl.width;
    if (iframeEl.height) iframe.height = iframeEl.height;
    
    // Default dimensions
    if (!iframe.width) iframe.width = '100%';
    if (!iframe.height) iframe.height = '300';
    
    // Security attributes
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
    iframe.setAttribute('loading', 'lazy');
    
    container.appendChild(iframe);
    
    // Create subtle loading indicator
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
   * Render audio with obsidian-like styling
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
    
    // If there's a direct src on the audio element
    if (audioEl.src) {
      audio.src = audioEl.src;
    }
    
    container.appendChild(audio);
  }
  
  /**
   * Render video with obsidian-like styling
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
    
    // If there's a direct src
    if (videoEl.src) {
      video.src = videoEl.src;
    }
    
    // Add poster if available
    if (videoEl.poster) {
      video.poster = videoEl.poster;
    }
    
    container.appendChild(video);
  }
  
  /**
   * Adds enhanced styling to embedded elements
   */
  private enhanceEmbeddedElements(container: HTMLElement): void {
    // Process inline styling for span elements
    const spans = container.querySelectorAll('span');
    spans.forEach(span => {
      span.classList.add('cm-html-span');
    });
    
    // Enhance anchor tags for better visibility
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
 * Widget for rendering HTML content that spans multiple lines (first line)
 */
class MultiLineHtmlStartWidget extends WidgetType {
  constructor(readonly html: string, readonly fullHtml: string) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-html-multiline-start';
    
    try {
      const sanitizedHtml = DOMPurify.sanitize(this.html);
      wrapper.innerHTML = sanitizedHtml;
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
 * Widget for rendering HTML content that spans multiple lines (middle lines)
 */
class MultiLineHtmlMiddleWidget extends WidgetType {
  constructor(readonly html: string) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-html-multiline-middle';
    
    try {
      const sanitizedHtml = DOMPurify.sanitize(this.html);
      wrapper.innerHTML = sanitizedHtml;
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
 * Widget for rendering HTML content that spans multiple lines (last line)
 */
class MultiLineHtmlEndWidget extends WidgetType {
  constructor(readonly html: string) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-html-multiline-end';
    
    try {
      const sanitizedHtml = DOMPurify.sanitize(this.html);
      wrapper.innerHTML = sanitizedHtml;
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
 * Identifies HTML regions in the visible document
 * @param view - The editor view
 * @returns An array of HTML regions
 */
function identifyHtmlRegions(view: EditorView): HtmlRegion[] {
  try {
    const regions: HtmlRegion[] = [];
    const { state } = view;
    const doc = state.doc;
    
    // Process each visible range of the document
    for (const { from, to } of view.visibleRanges) {
      if (from >= to) continue; // Skip empty ranges
      
      // Get text for this range with some safety checks
      let text: string;
      try {
        text = state.doc.sliceString(from, to);
      } catch (e) {
        console.error("Error getting text range:", e);
        continue;
      }
      
      if (!text || text.length === 0) continue;
      
      // Match paired HTML tags
      try {
        HTML_TAG_REGEX.lastIndex = 0;
        let match;
        while ((match = HTML_TAG_REGEX.exec(text))) {
          const fullMatch = match[0];
          const tagName = match[1];
          const tagAttrs = match[2];
          const tagContent = match[3];
          
          if (!fullMatch || !tagName) continue;
          
          const tagStart = from + match.index;
          const tagEnd = tagStart + fullMatch.length;
          
          // Validate positions
          if (tagEnd <= tagStart || tagStart < from || tagEnd > to) continue;
          
          const openTagEnd = tagStart + `<${tagName}${tagAttrs}>`.length;
          const closeTagStart = tagEnd - `</${tagName}>`.length;
          
          // Validate tag boundaries
          if (openTagEnd >= closeTagStart) continue;
          
          // Determine if this HTML tag spans multiple lines
          let startLine, endLine;
          try {
            startLine = doc.lineAt(tagStart);
            endLine = doc.lineAt(tagEnd - 1);
          } catch (e) {
            console.error("Error getting line info:", e);
            continue;
          }
          
          const isMultiLine = startLine.number !== endLine.number;
          
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
        }
      } catch (e) {
        console.error("Error processing HTML tags:", e);
      }
      
      // Match self-closing/void HTML tags
      try {
        HTML_VOID_TAG_REGEX.lastIndex = 0;
        let match;
        while ((match = HTML_VOID_TAG_REGEX.exec(text))) {
          const fullMatch = match[0];
          const tagName = match[1];
          const tagAttrs = match[2];
          
          // Skip if not a known void tag or invalid match
          if (!tagName || !VOID_TAGS.has(tagName.toLowerCase())) {
            continue;
          }
          
          const tagStart = from + match.index;
          const tagEnd = tagStart + fullMatch.length;
          
          // Validate positions
          if (tagEnd <= tagStart || tagStart < from || tagEnd > to) continue;
          
          // Determine if this tag is on a single line
          let startLine, endLine;
          try {
            startLine = doc.lineAt(tagStart);
            endLine = doc.lineAt(tagEnd - 1);
          } catch (e) {
            console.error("Error getting line info:", e);
            continue;
          }
          
          const isMultiLine = startLine.number !== endLine.number;
          
          regions.push({
            from: tagStart,
            to: tagEnd,
            isMultiLine,
            content: fullMatch,
            tagName,
            openTagEnd: tagEnd, // Self-closing tags don't have a separate close tag
            closeTagStart: tagEnd,
            isSelfClosing: true
          });
        }
      } catch (e) {
        console.error("Error processing void HTML tags:", e);
      }
    }
    
    return regions;
  } catch (e) {
    console.error("Error in identifyHtmlRegions:", e);
    return [];
  }
}

/**
 * Checks if the cursor is near an HTML region
 * @param view - The editor view
 * @param region - The HTML region to check
 * @returns True if the cursor is near the region
 */
function isCursorNearRegion(view: EditorView, region: HtmlRegion): boolean {
  const { state } = view;
  const selection = state.selection.main;
  const cursor = selection.head;
  const doc = state.doc;
  
  const cursorLine = doc.lineAt(cursor);
  const startLine = doc.lineAt(region.from);
  const endLine = doc.lineAt(region.to - 1);
  
  // Consider the cursor near if it's within one line of the region
  return cursorLine.number >= startLine.number - 1 && 
         cursorLine.number <= endLine.number + 1;
}

/**
 * Builds line-aware decorations for HTML tags in the editor
 * @param view - The editor view
 * @returns A set of decorations for HTML tags
 */
function buildHTMLTagDecorations(view: EditorView): DecorationSet {
  try {
    const builder = new RangeSetBuilder<Decoration>();
    
    // Identify HTML regions
    let htmlRegions: HtmlRegion[] = [];
    try {
      htmlRegions = identifyHtmlRegions(view);
    } catch (e) {
      console.error("Failed to identify HTML regions:", e);
      return builder.finish();
    }
    
    // If no regions, return empty decoration set
    if (htmlRegions.length === 0) {
      return builder.finish();
    }
    
    // Sort regions by 'from' position to ensure proper range ordering
    htmlRegions.sort((a, b) => a.from - b.from);
    
    // Collect all decorations first so we can sort them properly
    const decorations: Array<{ from: number, to: number, deco: Decoration }> = [];
    
    // Process each HTML region
    for (const region of htmlRegions) {
      try {
        // Skip invalid regions
        if (region.to <= region.from) continue;
        
        const isCursorNear = isCursorNearRegion(view, region);
        
        if (isCursorNear) {
          // When cursor is nearby, show raw HTML with syntax highlighting
          if (region.isSelfClosing) {
            decorations.push({
              from: region.from,
              to: region.to,
              deco: htmlTagMark
            });
          } else {
            // Only add valid tag boundaries
            if (region.openTagEnd > region.from) {
              decorations.push({
                from: region.from,
                to: region.openTagEnd,
                deco: htmlTagMark
              });
            }
            
            if (region.closeTagStart < region.to) {
              decorations.push({
                from: region.closeTagStart,
                to: region.to,
                deco: htmlTagMark
              });
            }
          }
        } else if (!region.isMultiLine) {
          // For single-line HTML, use inline widget
          decorations.push({
            from: region.from,
            to: region.to,
            deco: Decoration.replace({
              widget: new HTMLContentWidget(region.content, true)
            })
          });
        } else {
          // For multi-line HTML, collect line-by-line decorations
          const doc = view.state.doc;
          
          try {
            const startLine = doc.lineAt(region.from);
            const endLine = doc.lineAt(region.to - 1);
            
            // First line (opening tag with content)
            if (startLine.to > region.from) {
              const firstLineContent = doc.sliceString(region.from, startLine.to);
              decorations.push({
                from: region.from, 
                to: startLine.to,
                deco: Decoration.replace({
                  widget: new MultiLineHtmlStartWidget(firstLineContent, region.content)
                })
              });
            }
            
            // Process middle lines if any
            for (let lineNum = startLine.number + 1; lineNum < endLine.number; lineNum++) {
              try {
                const line = doc.line(lineNum);
                if (line.from < line.to) {  // Skip empty lines
                  const lineContent = line.text;
                  decorations.push({
                    from: line.from, 
                    to: line.to,
                    deco: Decoration.replace({
                      widget: new MultiLineHtmlMiddleWidget(lineContent)
                    })
                  });
                }
              } catch (e) {
                console.error(`Error processing middle line ${lineNum}:`, e);
              }
            }
            
            // Process last line (closing tag with content)
            if (startLine.number !== endLine.number && endLine.from < region.to) {
              const lastLineContent = doc.sliceString(endLine.from, region.to);
              decorations.push({
                from: endLine.from, 
                to: region.to,
                deco: Decoration.replace({
                  widget: new MultiLineHtmlEndWidget(lastLineContent)
                })
              });
            }
          } catch (e) {
            console.error("Error processing multi-line HTML:", e);
          }
        }
      } catch (e) {
        console.error("Error processing HTML region:", e);
      }
    }
    
    // Make sure we handle the case where no decorations were created
    if (decorations.length === 0) {
      return builder.finish();
    }
    
    // Sort the decorations by 'from' position
    decorations.sort((a, b) => {
      if (a.from !== b.from) return a.from - b.from;
      return a.to - b.to;  // Secondary sort by 'to' if 'from' is the same
    });
    
    // Add sorted decorations to the builder
    try {
      for (const { from, to, deco } of decorations) {
        if (from < to) { // Skip invalid ranges
          builder.add(from, to, deco);
        }
      }
    } catch (e) {
      console.error("Error adding decorations to builder:", e);
    }
    
    return builder.finish();
  } catch (e) {
    console.error("Error in buildHTMLTagDecorations:", e);
    return new RangeSetBuilder<Decoration>().finish();
  }
}

/**
 * ViewPlugin that decorates HTML tags in markdown
 */
export const HTMLTagDecorator = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildHTMLTagDecorations(view);
    }

    update(update: ViewUpdate) {
      const modeStateChanged = update.startState.field(markdownSyntaxStateField, false)?.currentMode !== 
                              update.state.field(markdownSyntaxStateField, false)?.currentMode;
      
      if (update.docChanged || update.viewportChanged || update.selectionSet || modeStateChanged) {
        this.decorations = buildHTMLTagDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations
  }
);
