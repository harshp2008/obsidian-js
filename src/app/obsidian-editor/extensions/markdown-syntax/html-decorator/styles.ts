/**
 * CSS styles for HTML rendering and code highlighting
 */

/**
 * Add global CSS styles for HTML rendering and code modes
 */
export function addHtmlStyles(): void {
  if (typeof document === 'undefined') return;
  
  // Check if styles already exist
  if (document.getElementById('cm-html-decorator-styles')) return;
  
  // Create style element
  const style = document.createElement('style');
  style.id = 'cm-html-decorator-styles';
  style.textContent = `
    /* Editor container - ensure it can display overflow */
    .cm-editor {
      position: relative !important;
      z-index: 1 !important;
      overflow: visible !important;
    }
    
    /* Editor content - ensure proper positioning for widgets */
    .cm-content {
      position: relative !important;
      z-index: 1 !important;
      overflow: visible !important;
    }
    
    /* HTML Code Edit Mode - when cursor is near or in HTML */
    .cm-html-code-mode {
      color: #a626a4 !important;
      font-family: monospace !important;
      background-color: rgba(166, 38, 164, 0.06) !important; 
      border-radius: 3px !important;
      padding: 0 1px !important;
    }
    
    /* Special syntax highlighting classes */
    .cm-html-tag-name {
      color: #e45649 !important;
      font-weight: bold !important;
    }
    
    .cm-html-attribute {
      color: #986801 !important;
    }
    
    .cm-html-attribute-value {
      color: #50a14f !important;
    }
    
    .cm-html-bracket {
      color: #0184bc !important;
      font-weight: bold !important;
    }
    
    /* HTML Rendered Preview Widget */
    .cm-html-preview-widget {
      background-color: #ffffff !important;
      border: 1px solid #e0e0e0 !important;
      border-left: 4px solid #4285f4 !important;
      border-radius: 4px !important;
      padding: 15px !important;
      margin: 15px 0 !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      position: relative !important;
      font-size: 16px !important;
      width: 100% !important;
      max-width: calc(100% - 30px) !important;
      display: block !important;
      z-index: 5 !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-height: 30px !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }
    
    /* HTML Preview Label */
    .cm-html-preview-label {
      position: absolute !important;
      top: -10px !important;
      left: 10px !important;
      background-color: #4285f4 !important;
      color: white !important;
      font-size: 12px !important;
      font-weight: bold !important;
      padding: 2px 8px !important;
      border-radius: 3px !important;
      z-index: 6 !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
    }
    
    /* HTML Content Container */
    .cm-html-content-container {
      width: 100% !important;
      min-height: 20px !important;
      overflow: auto !important;
      max-width: 100% !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
      box-sizing: border-box !important;
    }
    
    /* Fix for images */
    .cm-html-content-container img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      margin: 5px 0 !important;
    }
    
    /* Fix for media elements */
    .cm-html-content-container audio,
    .cm-html-content-container video {
      max-width: 100% !important;
      display: block !important;
      margin: 10px 0 !important;
    }
    
    /* Fix for iframes */
    .cm-html-content-container iframe {
      max-width: 100% !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 3px !important;
    }
    
    /* Multiline HTML - style when showing original code but not editing */
    .cm-html-multiline-code {
      opacity: 0.4 !important;
      color: #666 !important;
      font-family: monospace !important;
      white-space: pre-wrap !important;
      font-size: 0.9em !important;
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* Inline HTML code - style when showing original code but rendered above */
    .cm-html-inline-code {
      opacity: 0.4 !important;
      color: #666 !important;
      font-family: monospace !important;
      font-size: 0.9em !important;
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* Error messages in HTML widgets */
    .cm-html-error {
      color: #f44336 !important;
      padding: 8px !important;
      margin: 5px 0 !important;
      border: 1px solid #f44336 !important;
      border-radius: 3px !important;
      background-color: #ffebee !important;
      font-family: monospace !important;
      white-space: pre-wrap !important;
    }
    
    /* Security warning for dangerous elements */
    .cm-html-security-warning {
      padding: 5px 10px !important;
      margin: 5px 0 !important;
      border: 1px solid #f57c00 !important;
      border-left-width: 5px !important;
      border-radius: 3px !important;
      background-color: #fff3e0 !important;
      color: #f57c00 !important;
      font-weight: bold !important;
    }
  `;
  
  // Add to document head
  document.head.appendChild(style);
  console.log("HTML decorator styles added to document");
} 