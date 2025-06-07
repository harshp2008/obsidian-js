/**
 * CSS styles for HTML rendering and code highlighting
 */

/**
 * Add global CSS styles for HTML rendering and code modes
 */
export function addHtmlStyles(): void {
  if (typeof document === 'undefined') return;
  
  // Check if styles already exist
  if (document.getElementById('cm-html-decorator-styles')) {
    // Remove existing styles to ensure we have the latest
    const oldStyles = document.getElementById('cm-html-decorator-styles');
    if (oldStyles && oldStyles.parentNode) {
      oldStyles.parentNode.removeChild(oldStyles);
    }
  }
  
  console.log("Adding HTML decorator styles");
  
  // Create style element
  const style = document.createElement('style');
  style.id = 'cm-html-decorator-styles';
  style.textContent = `
    /* Editor container - ensure it can display overflow */
    .cm-editor {
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* HTML decoration core styles */
    .cm-html-preview {
      position: relative;
      background-color: #f5f5f5;
      border: 2px solid #4285f4;
      border-radius: 8px;
      padding: 15px;
      margin: 5px 0;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      min-height: 20px;
      max-width: 100%;
      width: calc(100% - 20px);
      display: block;
      visibility: visible !important;
      color: black;
      z-index: 9999;
    }
    
    /* HTML preview label */
    .cm-html-preview-label {
      position: absolute;
      top: -12px;
      left: 10px;
      background: #4285f4;
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      z-index: 10000;
    }
    
    /* HTML content container */
    .cm-html-content {
      background: white;
      padding: 10px;
      border-radius: 4px;
      color: black;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      line-height: 1.5;
      min-height: 10px;
    }
    
    /* HTML code syntax highlighting */
    .cm-html-code-mode {
      color: #a626a4 !important;
      font-family: monospace !important;
      background-color: rgba(166, 38, 164, 0.08) !important;
      border-radius: 3px !important;
    }
    
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
    
    /* Force visibility of HTML elements inside the preview */
    .cm-html-preview * {
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Block element defaults */
    .cm-html-preview div,
    .cm-html-preview p,
    .cm-html-preview h1,
    .cm-html-preview h2,
    .cm-html-preview h3,
    .cm-html-preview h4,
    .cm-html-preview h5,
    .cm-html-preview h6,
    .cm-html-preview ul,
    .cm-html-preview ol {
      display: block !important;
      margin: 0.5em 0 !important;
    }
    
    /* Heading styles */
    .cm-html-preview h1,
    .cm-html-preview h2,
    .cm-html-preview h3,
    .cm-html-preview h4,
    .cm-html-preview h5,
    .cm-html-preview h6 {
      font-weight: bold !important;
      color: #333 !important;
    }
    
    .cm-html-preview h1 { font-size: 1.5em !important; }
    .cm-html-preview h2 { font-size: 1.3em !important; }
    .cm-html-preview h3 { font-size: 1.2em !important; }
    
    /* Debug info */
    .cm-html-debug-info {
      position: absolute;
      bottom: -15px;
      right: 5px;
      font-size: 8px;
      color: #666;
      background: rgba(255,255,255,0.7);
      padding: 1px 3px;
      border-radius: 2px;
    }
    
    /* Editorial indicator when in edit mode */
    .cm-editing-html {
      position: relative;
    }
    
    .cm-editing-html::before {
      content: "Editing HTML";
      position: absolute;
      top: -18px;
      right: 10px;
      background-color: #ff7043;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      opacity: 0.8;
    }
  `;
  
  // Add to document head
  document.head.appendChild(style);
  console.log("HTML decorator styles added to document");
} 