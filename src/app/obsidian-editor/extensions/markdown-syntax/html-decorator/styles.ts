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
      background-color: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      margin: 4px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      min-height: 20px;
      max-width: 100%;
      width: calc(100% - 16px);
      display: block;
      visibility: visible !important;
      color: #333333;
      z-index: 9999;
    }
    
    /* HTML preview label */
    .cm-html-preview-label {
      position: absolute;
      top: -10px;
      left: 8px;
      background: #e3e3e3;
      color: #333333;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      z-index: 10000;
    }
    
    /* HTML content container */
    .cm-html-content {
      background: white;
      padding: 8px;
      border-radius: 3px;
      color: #333333;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      line-height: 1.5;
      min-height: 10px;
    }
    
    /* HTML code syntax highlighting */
    .cm-editor .cm-html-code-mode {
      color: #333333 !important;
      font-family: monospace !important;
      background-color: transparent !important;
      border-radius: 0 !important;
    }
    
    .cm-editor .cm-html-tag-name {
      color: #d73a49 !important;  /* Softer red like Obsidian */
      font-weight: 600 !important;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important;
    }
    
    .cm-editor .cm-html-attribute {
      color: #e36209 !important;  /* Brownish-orange like Obsidian */
      font-style: normal !important;
    }
    
    .cm-editor .cm-html-attribute-value {
      color: #22863a !important;  /* Softer green like Obsidian */
      font-style: normal !important;
    }
    
    .cm-editor .cm-html-bracket {
      color: #909090 !important;  /* Lighter gray like Obsidian */
      font-weight: normal !important;
      opacity: 1 !important;
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
      margin: 0.4em 0 !important;
    }
    
    /* Heading styles */
    .cm-html-preview h1,
    .cm-html-preview h2,
    .cm-html-preview h3,
    .cm-html-preview h4,
    .cm-html-preview h5,
    .cm-html-preview h6 {
      font-weight: 600 !important;
      color: #333333 !important;
    }
    
    .cm-html-preview h1 { font-size: 1.4em !important; }
    .cm-html-preview h2 { font-size: 1.2em !important; }
    .cm-html-preview h3 { font-size: 1.1em !important; }
    
    /* Debug info */
    .cm-html-debug-info {
      position: absolute;
      bottom: -12px;
      right: 4px;
      font-size: 8px;
      color: #999999;
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
      top: -16px;
      right: 8px;
      background-color: #f0f0f0;
      color: #555555;
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 2px;
      opacity: 0.8;
    }
  `;
  
  // Add to document head
  document.head.appendChild(style);
  console.log("HTML decorator styles added to document");
} 