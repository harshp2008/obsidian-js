# CSS Variables Implementation Guide

This guide explains the technical details of how CSS variables are connected to the editor implementation in obsidian-js.

## Overview

The obsidian-js library uses CSS variables to make styling the editor more accessible. This is done through "connector" files that bridge the gap between CSS variables and the actual CodeMirror theme implementation.

## Key Components

The CSS variables system has these key components:

1. **CSS Template Files**: Define variables for different aspects of the editor
2. **Theme Connector**: Reads CSS variables and creates CodeMirror themes
3. **HTML Style Connector**: Applies CSS variables to HTML highlighting

## Editor Theme Implementation

### CSS Variable Definitions

CSS variables are defined in template files:

- `lightThemeTemplate.css`: Variables for light theme
- `darkThemeTemplate.css`: Variables for dark theme

These variables follow a naming convention:

```css
:root {
  --light-background-primary: #ffffff;
  --dark-background-primary: #1e1e1e;
  /* etc. */
}
```

### Theme Connector

The `themeVariables.ts` file connects CSS variables to CodeMirror themes:

```typescript
// src/app/obsidian-editor/themes/themeVariables.ts
import { EditorView } from "@codemirror/view";

export function createLightThemeFromCssVars() {
  return EditorView.theme(
    {
      "&": {
        color: "var(--light-text-normal, #1a1a1a)",
        backgroundColor: "var(--light-background-primary, #ffffff)",
      },
      // Other properties...
    },
    { dark: false }
  );
}
```

The key technique is using `var(--variable-name, fallback)` syntax, which:

1. Tries to use the CSS variable if it's defined
2. Falls back to the default value if the variable isn't found

### Theme Registration

The theme connector functions are used in `editorThemes.ts`:

```typescript
// src/app/obsidian-editor/themes/editorThemes.ts
import {
  createLightThemeFromCssVars,
  createDarkThemeFromCssVars,
} from "./themeVariables";

export const lightTheme = createLightThemeFromCssVars();
export const darkTheme = createDarkThemeFromCssVars();
// Other exports...
```

## HTML Highlighting Implementation

### HTML CSS Variables

HTML highlighting variables are defined in:

- `lightHtmlTemplate.css`: Variables for light mode HTML
- `darkHtmlTemplate.css`: Variables for dark mode HTML

### HTML Style Connector

The `cssVarStyles.ts` file connects these variables to HTML styling:

```typescript
// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/cssVarStyles.ts
export function addCssVarHtmlStyles(): void {
  // Implementation that creates styles using CSS variables
  const style = document.createElement("style");
  style.textContent = `
    .cm-html-preview {
      background-color: var(--light-html-preview-bg, #f8f8f8);
      // Other properties...
    }
    // Other styles...
  `;
  document.head.appendChild(style);
}
```

### HTML Style Registration

The connector is used in `styles.ts`:

```typescript
// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/styles.ts
import { addCssVarHtmlStyles } from "./cssVarStyles";

export function addHtmlStyles(): void {
  addCssVarHtmlStyles();
}
```

## How CSS Variables are Applied

When your application loads:

1. CSS files with variable definitions are imported
2. These variables become available in the CSS environment
3. When the editor is initialized, theme connector functions create themes
4. These themes reference the CSS variables
5. When HTML content is rendered, the HTML style connector applies styles that reference the variables

## Adding New CSS Variables

To add new CSS variables:

1. Add the variable to the appropriate template file:

```css
:root {
  --light-my-new-variable: #value;
  --dark-my-new-variable: #value;
}
```

2. Update the theme connector to use it:

```typescript
export function createLightThemeFromCssVars() {
  return EditorView.theme(
    {
      // Existing properties...
      ".my-selector": {
        property: "var(--light-my-new-variable, #fallback)",
      },
    },
    { dark: false }
  );
}
```

## Debugging CSS Variables

If your CSS variables aren't working:

1. **Check Variable Definitions**: Ensure variables are defined in `:root`
2. **Check Import Order**: CSS must be imported before the editor renders
3. **Inspect Computed Styles**: Use browser developer tools to verify the variables
4. **Check References**: Ensure variable names match exactly in both CSS and JS
5. **Check Fallbacks**: If a variable isn't found, the fallback value will be used

## Performance Considerations

CSS variables are efficient, but there are some considerations:

1. **Runtime Changes**: CSS variables can be changed at runtime, allowing dynamic theming
2. **Fallback Values**: Always provide fallbacks for graceful degradation
3. **Specificity**: Keep an eye on CSS specificity to ensure variables are properly applied
4. **Browser Support**: CSS variables are well-supported in modern browsers

## Advanced Techniques

### Dynamic Theme Switching

For dynamic theme switching, you can update CSS variables at runtime:

```javascript
function setTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
```

### Custom Property Groups

You can create property groups for better organization:

```css
:root {
  --editor-colors-primary: #3b82f6;
  --editor-colors-secondary: #4b5563;
  --editor-spacing-sm: 4px;
  --editor-spacing-md: 8px;
}
```

### Media Queries

CSS variables work with media queries for responsive designs:

```css
@media (max-width: 768px) {
  :root {
    --editor-spacing-md: 6px;
  }
}
```

## Conclusion

By using CSS variables and connector files, obsidian-js makes styling more accessible while maintaining the power and flexibility of CodeMirror themes. This approach allows for easier customization, better theme management, and more intuitive styling for developers.
