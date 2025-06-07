/**
 * Core types and constants for HTML tag handling
 */

/**
 * Type definitions for HTML decorator extension
 */

/**
 * Represents an HTML region in the document with positions and metadata
 */
export interface HtmlRegion {
  /**
   * Start position (inclusive)
   */
  from: number;

  /**
   * End position (inclusive)
   */
  to: number;

  /**
   * Tag name, like 'div', 'span', etc.
   */
  tagName: string;

  /**
   * Whether this HTML spans multiple lines
   */
  isMultiline: boolean;

  /**
   * The entire HTML content as a string
   */
  content: string;

  /**
   * Position where the opening tag ends (where content starts)
   */
  openTagEnd: number;

  /**
   * Position where the closing tag starts
   */
  closeTagStart: number;

  /**
   * Whether this is a self-closing tag like <br/> or <img/>
   */
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
 * Set of HTML void elements (self-closing tags)
 * These tags do not have closing tags in HTML
 */
export const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Set of potentially dangerous HTML tags that might execute scripts
 * These will be sanitized when rendering HTML
 */
export const DANGEROUS_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'base',
  'form',
  'frame',
  'frameset'
]); 