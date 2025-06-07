/**
 * Core types and constants for HTML tag handling
 */

/**
 * Represents an HTML region in the document
 */
export interface HtmlRegion {
  /** Start position in the document */
  from: number;
  
  /** End position in the document */
  to: number;
  
  /** The HTML tag name (lowercase) */
  tagName: string;
  
  /** Whether this region spans multiple lines */
  isMultiline: boolean;
  
  /** Raw HTML content including tags */
  content: string;
  
  /** Position where the opening tag ends */
  openTagEnd: number;
  
  /** Position where the closing tag starts (if not self-closing) */
  closeTagStart: number;
  
  /** Whether this is a self-closing/void tag */
  isSelfClosing: boolean;
}

/**
 * HTML rendering modes
 */
export enum HtmlRenderMode {
  /** Show raw HTML code */
  CODE,
  
  /** Show rendered HTML content */
  RENDER
}

/**
 * Standard HTML void elements that don't need closing tags
 * @see https://html.spec.whatwg.org/multipage/syntax.html#void-elements
 */
export const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed',
  'hr', 'img', 'input', 'link', 'meta',
  'source', 'track', 'wbr'
]);

/**
 * Potentially dangerous HTML tags that should be handled with care
 */
export const DANGEROUS_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'applet'
]); 