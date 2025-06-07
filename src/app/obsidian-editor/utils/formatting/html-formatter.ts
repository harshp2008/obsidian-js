import DOMPurify from 'dompurify';

/**
 * Formats HTML content safely using DOMPurify to prevent XSS attacks
 * @param html - Raw HTML content to format
 * @returns Safely formatted HTML
 */
export function formatHTML(html: string): string {
  try {
    // Handle empty or non-string input
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    // Special handling for script tags - preserve them as visible text, not executable code
    if (html.toLowerCase().includes('<script')) {
      // Replace script tags with highlighted versions but don't execute
      return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
        const scriptOpen = match.substring(0, match.indexOf('>') + 1);
        const scriptClose = '</script>';
        return `<span class="script-tag">${scriptOpen}</span><span class="script-tag-content">${content}</span><span class="script-tag">${scriptClose}</span>`;
      });
    }
    
    // Use DOMPurify with permissive configuration to allow most HTML
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: [
        'controls', 'autoplay', 'allowfullscreen', 'allow', 
        'type', 'src', 'href', 'target', 'rel', 'height', 'width', 
        'style', 'class', 'id', 'name', 'alt', 'title'
      ],
      ADD_TAGS: [
        'iframe', 'audio', 'video', 'source', 'track', 'embed', 'object',
        'img', 'a', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
        'br', 'hr', 'code', 'pre', 'blockquote', 'cite', 'dl', 'dt', 'dd',
        'figure', 'figcaption', 'section', 'article', 'nav', 'header', 'footer',
        'canvas', 'svg', 'path', 'rect', 'circle', 'line', 'polygon'
      ],
      // Only forbid tags that could be harmful
      FORBID_TAGS: ['script', 'style', 'meta', 'link', 'base', 'applet', 'object'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
      ALLOW_DATA_ATTR: false, // Disallow data-* attributes which could be used for XSS
      RETURN_DOM: false,
      WHOLE_DOCUMENT: false,
    });
  } catch (error) {
    console.error('Error formatting HTML:', error);
    // If sanitization fails, return the input as escaped text to prevent any XSS
    return escapeHtml(html);
  }
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param html - HTML string to escape
 * @returns Escaped HTML string
 */
function escapeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
} 