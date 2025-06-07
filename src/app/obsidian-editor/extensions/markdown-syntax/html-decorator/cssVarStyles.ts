/**
 * HTML decorator styles that use CSS variables from templates
 */

/**
 * Add HTML styles based on CSS variables
 * Uses variables from lightHtmlTemplate.css and darkHtmlTemplate.css
 */
export function addCssVarHtmlStyles(): void {
  if (typeof document === "undefined") return;
  
  // Check if styles already exist
  if (document.getElementById('cm-html-decorator-styles')) {
    // Remove existing styles to ensure we have the latest
    const oldStyles = document.getElementById('cm-html-decorator-styles');
    if (oldStyles && oldStyles.parentNode) {
      oldStyles.parentNode.removeChild(oldStyles);
    }
  }
  
  console.log("Adding HTML decorator styles with CSS variables");
  
  // Create style element
  const style = document.createElement('style');
  style.id = 'cm-html-decorator-styles';
  style.textContent = `
    /* Editor container - ensure it can display overflow */
    .cm-editor {
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* HTML decoration using CSS variables - Light Theme */
    .cm-html-preview {
      position: relative;
      background-color: var(--light-html-preview-bg, #f8f8f8);
      border: 1px solid var(--light-html-preview-border, #e0e0e0);
      border-radius: 4px;
      padding: 12px;
      margin: 4px 0;
      box-shadow: var(--light-html-preview-shadow, 0 1px 3px rgba(0,0,0,0.1));
      min-height: 20px;
      max-width: 100%;
      width: calc(100% - 16px);
      display: block;
      visibility: visible !important;
      color: var(--light-html-content-color, #333333);
      z-index: 9999;
    }
    
    /* HTML preview label */
    .cm-html-preview-label {
      position: absolute;
      top: -10px;
      left: 8px;
      background: var(--light-html-label-bg, #e3e3e3);
      color: var(--light-html-label-color, #333333);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      z-index: 10000;
    }
    
    /* HTML content container */
    .cm-html-content {
      background: var(--light-html-content-bg, #ffffff);
      padding: 8px;
      border-radius: 3px;
      color: var(--light-html-content-color, #333333);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      line-height: 1.5;
      min-height: 10px;
    }
    
    /* HTML code syntax highlighting */
    .cm-editor .cm-html-code-mode {
      color: var(--light-html-content-color, #333333) !important;
      font-family: monospace !important;
      background-color: transparent !important;
      border-radius: 0 !important;
    }
    
    .cm-editor .cm-html-tag-name {
      color: var(--light-html-tag-color, #d73a49) !important;
      font-weight: 600 !important;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important;
    }
    
    .cm-editor .cm-html-attribute {
      color: var(--light-html-attribute-color, #e36209) !important;
      font-style: normal !important;
    }
    
    .cm-editor .cm-html-attribute-value {
      color: var(--light-html-attribute-value-color, #22863a) !important;
      font-style: normal !important;
    }
    
    .cm-editor .cm-html-bracket {
      color: var(--light-html-bracket-color, #909090) !important;
      font-weight: normal !important;
      opacity: 1 !important;
    }
    
    /* Dark theme styles */
    .dark .cm-html-preview {
      background-color: var(--dark-html-preview-bg, #282828);
      border: 1px solid var(--dark-html-preview-border, #444444);
      box-shadow: var(--dark-html-preview-shadow, 0 1px 3px rgba(0,0,0,0.3));
      color: var(--dark-html-content-color, #e0e0e0);
    }
    
    .dark .cm-html-preview-label {
      background: var(--dark-html-label-bg, #4a4a4a);
      color: var(--dark-html-label-color, #e0e0e0);
    }
    
    .dark .cm-html-content {
      background: var(--dark-html-content-bg, #333333);
      color: var(--dark-html-content-color, #e0e0e0);
    }
    
    .dark .cm-editor .cm-html-tag-name {
      color: var(--dark-html-tag-color, #f97583) !important;
    }
    
    .dark .cm-editor .cm-html-attribute {
      color: var(--dark-html-attribute-color, #ffab70) !important;
    }
    
    .dark .cm-editor .cm-html-attribute-value {
      color: var(--dark-html-attribute-value-color, #85e89d) !important;
    }
    
    .dark .cm-editor .cm-html-bracket {
      color: var(--dark-html-bracket-color, #a0a0a0) !important;
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
      color: var(--light-html-heading-color, #333333) !important;
    }
    
    .dark .cm-html-preview h1,
    .dark .cm-html-preview h2,
    .dark .cm-html-preview h3,
    .dark .cm-html-preview h4,
    .dark .cm-html-preview h5,
    .dark .cm-html-preview h6 {
      color: var(--dark-html-heading-color, #e0e0e0) !important;
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
      color: var(--light-html-debug-color, #999999);
      background: rgba(255,255,255,0.7);
      padding: 1px 3px;
      border-radius: 2px;
    }
    
    .dark .cm-html-debug-info {
      color: var(--dark-html-debug-color, #777777);
      background: rgba(0,0,0,0.3);
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
      background-color: var(--light-html-edit-label-bg, #f0f0f0);
      color: var(--light-html-edit-label-color, #555555);
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 2px;
      opacity: 0.8;
    }
    
    .dark .cm-editing-html::before {
      background-color: var(--dark-html-edit-label-bg, #3a3a3a);
      color: var(--dark-html-edit-label-color, #bbbbbb);
    }
  `;
  
  // Add to document head
  document.head.appendChild(style);
  console.log("HTML decorator styles with CSS variables added to document");
} 