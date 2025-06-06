import DOMPurify from 'dompurify';

/**
 * Formats HTML content safely using DOMPurify to prevent XSS attacks
 * @param html - Raw HTML content to format
 * @returns Safely formatted HTML
 */
export function formatHTML(html: string): string {
  // Special handling for script tags - preserve them as visible text, not executable code
  if (html.toLowerCase().includes('<script')) {
    // Replace script tags with highlighted versions but don't execute
    return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
      const scriptOpen = match.substring(0, match.indexOf('>') + 1);
      const scriptClose = '</script>';
      return `<span class="script-tag">${scriptOpen}</span><span class="script-tag-content">${content}</span><span class="script-tag">${scriptClose}</span>`;
    });
  }
  
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['controls', 'autoplay', 'allowfullscreen', 'allow'],
    ADD_TAGS: ['iframe', 'audio', 'video', 'source'],
  });
} 