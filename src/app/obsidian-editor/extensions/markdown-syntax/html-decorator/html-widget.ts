import { WidgetType } from '@codemirror/view';
import { DANGEROUS_TAGS } from './types';

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
      // Create container
      const wrapper = document.createElement('div');
      wrapper.className = 'cm-html-preview-widget';
      
      // Add label
      const label = document.createElement('div');
      label.className = 'cm-html-preview-label';
      label.textContent = 'HTML PREVIEW';
      wrapper.appendChild(label);
      
      // Create content container
      const contentContainer = document.createElement('div');
      contentContainer.className = 'cm-html-content-container';
      
      // Apply sanitized HTML content
      try {
        // Check for potential security issues first
        const securityWarnings = this.checkSecurityIssues(this.content);
        if (securityWarnings.length > 0) {
          // Add security warnings if any found
          securityWarnings.forEach(warning => {
            const warningElement = document.createElement('div');
            warningElement.className = 'cm-html-security-warning';
            warningElement.innerHTML = `⚠️ ${warning}`;
            contentContainer.appendChild(warningElement);
          });
        }
        
        // Render the sanitized HTML
        const sanitized = this.sanitizeHtml(this.content);
        
        // Create an inner container for the actual HTML content
        const htmlContainer = document.createElement('div');
        htmlContainer.innerHTML = sanitized;
        contentContainer.appendChild(htmlContainer);
        
        // Disable interactive elements
        this.disableInteractiveElements(htmlContainer);
      } catch (error) {
        console.error('Error rendering HTML:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'cm-html-error';
        errorDiv.textContent = `Error rendering HTML: ${error.message || 'Unknown error'}`;
        contentContainer.appendChild(errorDiv);
      }
      
      wrapper.appendChild(contentContainer);
      return wrapper;
    } catch (error) {
      // Create a minimal error display if the main rendering fails
      console.error('Fatal error in HTML widget:', error);
      const errorElement = document.createElement('div');
      errorElement.className = 'cm-html-error';
      errorElement.textContent = 'Fatal error rendering HTML content';
      return errorElement;
    }
  }

  /**
   * Checks for security issues in HTML content
   * Returns array of warning messages
   */
  private checkSecurityIssues(html: string): string[] {
    const warnings = [];
    
    // Check for dangerous tags
    DANGEROUS_TAGS.forEach(tag => {
      const tagRegex = new RegExp(`<${tag}[\\s>]`, 'i');
      if (tagRegex.test(html)) {
        warnings.push(`${tag.toUpperCase()} tag detected and will be sanitized for security`);
      }
    });
    
    // Check for event handlers
    if (/\son\w+\s*=/i.test(html)) {
      warnings.push('Event handlers (onclick, onload, etc.) detected and will be removed');
    }
    
    // Check for javascript: URLs
    if (/javascript:/i.test(html)) {
      warnings.push('JavaScript URLs detected and will be removed');
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
        return `<div style="color:#d73a49;border-left:3px solid #d73a49;padding-left:8px;margin:5px 0;">
                  [${tagName} tag removed]
                </div>`;
      });
      
      // Handle self-closing versions
      const selfClosingRegex = new RegExp(`<${tag}([^>]*?)\\s*\\/>`, 'gi');
      sanitized = sanitized.replace(selfClosingRegex, `<div style="color:#d73a49;">[${tagName} tag removed]</div>`);
    });
    
    return sanitized;
  }

  /**
   * Disable interactive elements like links and forms
   */
  private disableInteractiveElements(container: HTMLElement): void {
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
  }

  /**
   * Allow events from the content (like scrolling in a div)
   */
  ignoreEvent(): boolean {
    return false;
  }
} 