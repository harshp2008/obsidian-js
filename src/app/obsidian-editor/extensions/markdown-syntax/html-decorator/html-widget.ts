import { WidgetType } from '@codemirror/view';
import { DANGEROUS_TAGS } from './types';

// Debug helper
const DEBUG = true;

/**
 * Widget for rendering HTML content in preview mode
 */
export class HtmlPreviewWidget extends WidgetType {
  private content: string;
  private isMultiline: boolean;

  constructor(content: string, isMultiline = false) {
    super();
    this.content = content;
    this.isMultiline = isMultiline;
    
    console.log("Creating HTML widget:", { 
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      isMultiline 
    });
  }

  eq(other: HtmlPreviewWidget): boolean {
    return this.content === other.content && 
           this.isMultiline === other.isMultiline;
  }

  /**
   * Renders the HTML content as a DOM element
   */
  toDOM(): HTMLElement {
    try {
      console.log("Rendering HTML widget", this.isMultiline ? "multiline" : "inline");
      
      // Create container
      const wrapper = document.createElement('div');
      wrapper.className = 'cm-html-preview-widget';
      
      // Add special class for multiline widgets
      if (this.isMultiline) {
        wrapper.classList.add('cm-html-preview-multiline');
      } else {
        wrapper.classList.add('cm-html-preview-inline');
      }
      
      // Create content container
      const contentContainer = document.createElement('div');
      contentContainer.className = 'cm-html-content-container';
      contentContainer.style.cssText = `
        padding: 10px;
        border: 1px solid #e0e0e0;
        background: white;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      `;
      
      try {
        // Process content and check for security issues
        const securityWarnings = this.checkSecurityIssues(this.content);
        if (securityWarnings.length > 0) {
          // Add security warnings if found
          securityWarnings.forEach(warning => {
            const warningElement = document.createElement('div');
            warningElement.className = 'cm-html-security-warning';
            warningElement.innerHTML = `⚠️ ${warning}`;
            contentContainer.appendChild(warningElement);
          });
        }
        
        // Extract content from the HTML if we have both opening and closing tags
        let htmlToRender = this.content;
        const match = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)>([\s\S]*?)<\/\1>/i.exec(this.content);
        if (match) {
          // Only render the inner content for specific tags that have wrappers
          const tagName = match[1].toLowerCase();
          const attributes = match[2];
          const innerContent = match[3];
          
          if (tagName === 'div' || tagName === 'span') {
            // Keep attributes for styling
            const attributesObj: Record<string, string> = {};
            const styleMatch = /style\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/i.exec(attributes);
            if (styleMatch) {
              const styleContent = styleMatch[1] || styleMatch[2] || styleMatch[3];
              contentContainer.setAttribute('style', contentContainer.getAttribute('style') + '; ' + styleContent);
            }
            
            // For these wrapper elements, we want to render the inner content
            htmlToRender = innerContent;
          }
        }
        
        // Create a container for the actual rendered HTML
        const htmlContainer = document.createElement('div');
        htmlContainer.innerHTML = this.sanitizeHtml(htmlToRender);
        
        // Make sure we can see the content by applying extra styles directly
        htmlContainer.querySelectorAll('*').forEach(element => {
          if (element instanceof HTMLElement) {
            if (!element.style.color) {
              element.style.color = 'black';
            }
            if (!element.style.backgroundColor && element.tagName === 'DIV') {
              element.style.backgroundColor = 'white';
            }
          }
        });
        
        contentContainer.appendChild(htmlContainer);
        
        // Disable any interactive elements
        this.disableInteractiveElements(htmlContainer);
      } catch (error: any) {
        console.error('Error rendering HTML:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'cm-html-error';
        errorDiv.textContent = `Error rendering HTML: ${error.message || 'Unknown error'}`;
        contentContainer.appendChild(errorDiv);
      }
      
      wrapper.appendChild(contentContainer);
      
      return wrapper;
    } catch (error: any) {
      console.error('Fatal error in HTML widget:', error);
      const errorElement = document.createElement('div');
      errorElement.className = 'cm-html-error';
      errorElement.textContent = 'Error rendering HTML content';
      return errorElement;
    }
  }

  /**
   * Check for potential security issues in HTML content
   */
  private checkSecurityIssues(html: string): string[] {
    const warnings: string[] = [];
    
    // Check for dangerous tags
    DANGEROUS_TAGS.forEach(tag => {
      const tagRegex = new RegExp(`<${tag}[\\s>]`, 'i');
      if (tagRegex.test(html)) {
        warnings.push(`${tag.toUpperCase()} tag detected and will be sanitized`);
      }
    });
    
    // Check for event handlers
    if (/\son\w+\s*=/i.test(html)) {
      warnings.push('Event handlers detected and removed');
    }
    
    // Check for javascript: URLs
    if (/javascript:/i.test(html)) {
      warnings.push('JavaScript URLs detected and removed');
    }
    
    return warnings;
  }

  /**
   * Sanitizes HTML to prevent XSS attacks
   */
  private sanitizeHtml(html: string): string {
    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers (onclick, onload, etc.)
    sanitized = sanitized.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, 'void:');
    
    // Handle dangerous tags by adding warnings
    DANGEROUS_TAGS.forEach(tag => {
      const tagName = tag.toUpperCase();
      
      // Handle opening/closing tag pairs
      const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, (match, attrs, content) => {
        return `<div class="cm-html-removed-tag">[${tagName} removed]</div>`;
      });
      
      // Handle self-closing versions
      const selfClosingRegex = new RegExp(`<${tag}([^>]*?)\\s*\\/>`, 'gi');
      sanitized = sanitized.replace(selfClosingRegex, 
        `<div class="cm-html-removed-tag">[${tagName} removed]</div>`);
    });
    
    return sanitized;
  }

  /**
   * Disable interactive elements like links and forms
   */
  private disableInteractiveElements(container: HTMLElement): void {
    try {
      // Disable links
      const links = container.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', e => e.preventDefault());
        link.style.pointerEvents = 'none';
        if (link.hasAttribute('href')) {
          link.setAttribute('data-href', link.getAttribute('href') || '');
          link.removeAttribute('href');
        }
      });
      
      // Disable forms
      const forms = container.querySelectorAll('form');
      forms.forEach(form => {
        form.addEventListener('submit', e => e.preventDefault());
        form.setAttribute('onsubmit', 'return false;');
      });
      
      // Disable buttons
      const buttons = container.querySelectorAll('button, input[type="submit"], input[type="button"]');
      buttons.forEach(button => {
        button.setAttribute('disabled', 'disabled');
        button.addEventListener('click', e => e.preventDefault());
      });
    } catch (error: any) {
      console.error('Error disabling interactive elements:', error);
    }
  }

  /**
   * Allow events from the content (like scrolling in a div)
   */
  ignoreEvent(): boolean {
    return false;
  }
} 