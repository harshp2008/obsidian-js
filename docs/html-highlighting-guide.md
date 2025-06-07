# HTML Highlighting Templates Guide

This guide explains how to use the HTML highlighting templates to customize the appearance of HTML content in the obsidian-js editor.

## Introduction

The obsidian-js library includes template files for customizing the appearance of HTML content in both light and dark themes. These templates provide CSS variables with detailed comments, making it easy to adjust colors and styles for HTML preview and syntax highlighting.

## HTML Highlighting Template Files

There are two template files for HTML highlighting:

- **lightHtmlTemplate.css**: Template for customizing HTML highlighting in light mode
- **darkHtmlTemplate.css**: Template for customizing HTML highlighting in dark mode

These files can be found in the `src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/` directory.

## Getting Started

### Step 1: Copy the Template Files

First, copy the template file you want to customize:

```bash
# For light theme HTML highlighting
cp src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/lightHtmlTemplate.css src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/myLightHtml.css

# For dark theme HTML highlighting
cp src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/darkHtmlTemplate.css src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/myDarkHtml.css
```

### Step 2: Customize CSS Variables

Open your copied files and modify the CSS variables to match your desired appearance. Each variable is clearly commented to explain its purpose:

```css
/* Example: Changing HTML preview colors in myLightHtml.css */
:root {
  --light-html-preview-bg: #f0f0f0; /* Changed from #f8f8f8 */
  --light-html-tag-color: #c41a16; /* Changed from #d73a49 */
  /* ... other variables */
}
```

### Step 3: Create a Custom HTML Styles Implementation

Create a new JavaScript file to implement your custom HTML styles using the CSS variables:

```typescript
// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/myHtmlStyles.ts
export function addCustomHtmlStyles(): void {
  if (typeof document === "undefined") return;

  // Remove existing styles if present
  if (document.getElementById("cm-html-decorator-styles")) {
    const oldStyles = document.getElementById("cm-html-decorator-styles");
    if (oldStyles && oldStyles.parentNode) {
      oldStyles.parentNode.removeChild(oldStyles);
    }
  }

  // Create style element
  const style = document.createElement("style");
  style.id = "cm-html-decorator-styles";
  style.textContent = `
    /* Light theme styles */
    .cm-html-preview {
      background-color: var(--light-html-preview-bg);
      border: 1px solid var(--light-html-preview-border);
      box-shadow: var(--light-html-preview-shadow);
      color: var(--light-html-content-color);
    }
    
    .cm-html-preview-label {
      background: var(--light-html-label-bg);
      color: var(--light-html-label-color);
    }
    
    .cm-html-content {
      background: var(--light-html-content-bg);
      color: var(--light-html-content-color);
    }
    
    .cm-editor .cm-html-tag-name {
      color: var(--light-html-tag-color) !important;
    }
    
    .cm-editor .cm-html-attribute {
      color: var(--light-html-attribute-color) !important;
    }
    
    .cm-editor .cm-html-attribute-value {
      color: var(--light-html-attribute-value-color) !important;
    }
    
    .cm-editor .cm-html-bracket {
      color: var(--light-html-bracket-color) !important;
    }
    
    /* Dark theme styles */
    .dark .cm-html-preview {
      background-color: var(--dark-html-preview-bg);
      border: 1px solid var(--dark-html-preview-border);
      box-shadow: var(--dark-html-preview-shadow);
      color: var(--dark-html-content-color);
    }
    
    .dark .cm-html-preview-label {
      background: var(--dark-html-label-bg);
      color: var(--dark-html-label-color);
    }
    
    .dark .cm-html-content {
      background: var(--dark-html-content-bg);
      color: var(--dark-html-content-color);
    }
    
    .dark .cm-editor .cm-html-tag-name {
      color: var(--dark-html-tag-color) !important;
    }
    
    .dark .cm-editor .cm-html-attribute {
      color: var(--dark-html-attribute-color) !important;
    }
    
    .dark .cm-editor .cm-html-attribute-value {
      color: var(--dark-html-attribute-value-color) !important;
    }
    
    .dark .cm-editor .cm-html-bracket {
      color: var(--dark-html-bracket-color) !important;
    }
    
    /* Common styles for HTML previews */
    .cm-html-preview {
      position: relative;
      border-radius: 4px;
      padding: 12px;
      margin: 4px 0;
      min-height: 20px;
      max-width: 100%;
      width: calc(100% - 16px);
      display: block;
      visibility: visible !important;
      z-index: 9999;
    }
    
    .cm-html-preview-label {
      position: absolute;
      top: -10px;
      left: 8px;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      z-index: 10000;
    }
    
    .cm-html-content {
      padding: 8px;
      border-radius: 3px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      line-height: 1.5;
      min-height: 10px;
    }
  `;

  // Add to document head
  document.head.appendChild(style);
}
```

> **Note:** The library already includes a CSS variable connector in `src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/cssVarStyles.ts` that applies your CSS variables to the HTML decorator. You don't need to create this file unless you want to customize how the variables are applied.

### Step 4: Import CSS Variables

Make sure to import your CSS files in your application. Add the following to your main CSS file or component:

```typescript
// In your main entry file or component
import "./path/to/myLightHtml.css";
import "./path/to/myDarkHtml.css";
```

### Step 5: Verify Your Changes

After importing your CSS files, the variables should be automatically applied by the HTML decorator. To verify your changes:

1. Open a document with HTML content in the editor
2. Check that your customized colors and styles are applied
3. Toggle between light and dark modes to verify both themes work

## How the HTML Styling System Works

The HTML styling system in obsidian-js works through these components:

1. **CSS Variable Definition**: Your CSS files define variables for colors and styles
2. **CSS Variable Connector**: The `cssVarStyles.ts` file creates styles that reference these variables
3. **HTML Decorator**: The decorator uses these styles when rendering HTML content

The connector is set up to use fallback values for each variable, so the editor will still work even if your CSS variables aren't loaded. However, for your customizations to take effect, make sure your CSS files are properly imported.

## Customizing HTML Syntax Highlighting

The HTML highlighting templates provide variables for controlling the colors of different parts of HTML syntax:

- **Tag names**: Element names like `div`, `span`, etc.
- **Attributes**: Attribute names like `class`, `id`, etc.
- **Attribute values**: Values assigned to attributes
- **Brackets**: The angle brackets (`<` and `>`)

You can customize these to match your preferred syntax highlighting style:

```css
/* Example custom syntax highlighting colors */
:root {
  /* Light theme */
  --light-html-tag-color: #22863a; /* Green tags */
  --light-html-attribute-color: #6f42c1; /* Purple attributes */
  --light-html-attribute-value-color: #032f62; /* Blue values */
  --light-html-bracket-color: #777777; /* Gray brackets */

  /* Dark theme */
  --dark-html-tag-color: #7ee787; /* Light green tags */
  --dark-html-attribute-color: #d2a8ff; /* Light purple attributes */
  --dark-html-attribute-value-color: #a5d6ff; /* Light blue values */
  --dark-html-bracket-color: #9a9a9a; /* Light gray brackets */
}
```

## HTML Preview Customization

The templates also provide variables for customizing the HTML preview appearance:

- **Container**: Background, border, and shadow of the preview container
- **Label**: The "HTML" label that appears at the top of the preview
- **Content**: The rendered HTML content area

```css
/* Example custom preview appearance */
:root {
  /* Light theme */
  --light-html-preview-bg: #f5f7f9;
  --light-html-preview-border: #d0d7de;
  --light-html-preview-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  /* Dark theme */
  --dark-html-preview-bg: #22272e;
  --dark-html-preview-border: #444c56;
  --dark-html-preview-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
```

## Best Practices

1. **Maintain Color Contrast**: Ensure text has sufficient contrast against backgrounds for readability.
2. **Consistent Styling**: Keep HTML highlighting consistent with your overall editor theme.
3. **Test with Various HTML**: Test your styling with different types of HTML content.
4. **Consider Accessibility**: Make sure your colors work well for users with visual impairments.
5. **Keep It Simple**: Use subtle colors that don't distract from the content.

## Advanced Customization

### Customizing HTML Element Styling in Preview

You can add additional styles to control how HTML elements appear in the preview:

```css
/* Add to your HTML styles implementation */
.cm-html-content h1 {
  border-bottom: 1px solid var(--light-html-preview-border);
  padding-bottom: 4px;
}

.cm-html-content a {
  color: var(--light-link-color);
  text-decoration: underline;
}

.cm-html-content table {
  border-collapse: collapse;
  width: 100%;
}

.cm-html-content td,
.cm-html-content th {
  border: 1px solid var(--light-html-preview-border);
  padding: 4px 8px;
}
```

### Adding Hover Effects

You can add hover effects to HTML syntax elements for better visual feedback:

```css
.cm-editor .cm-html-tag-name:hover {
  text-decoration: underline;
  cursor: pointer;
}
```

## Troubleshooting

If your HTML highlighting isn't applying correctly:

1. **CSS Loading Order**: Make sure your CSS files are loaded before the editor is initialized
2. **Variable Naming**: Double-check that your variable names match exactly what the connector expects
3. **Specificity Issues**: If other styles are overriding your variables, you may need to increase specificity
4. **Check Application**: Open browser dev tools and verify your CSS variables are defined in the document
5. **Inspect Elements**: Check the generated HTML elements to see what styles are actually being applied

## Additional Resources

- [HTML Syntax Highlighting in CodeMirror](https://codemirror.net/examples/styling/)
- [CSS Variables (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)
