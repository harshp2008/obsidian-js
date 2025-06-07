# Theme Templates Guide

This guide explains how to use the theme templates to customize the appearance of the obsidian-js editor.

## Introduction

The obsidian-js library provides template files that make it easy to customize the editor's appearance for both light and dark themes. These templates use CSS variables with detailed comments, making it simple to adjust colors and styles without deep knowledge of the underlying CodeMirror implementation.

## Theme Template Files

There are two primary theme template files:

- **lightThemeTemplate.css**: Template for customizing the light theme
- **darkThemeTemplate.css**: Template for customizing the dark theme

These files can be found in the `src/app/obsidian-editor/themes/` directory.

## Getting Started

### Step 1: Copy the Template Files

First, copy the template file you want to customize:

```bash
# For light theme
cp src/app/obsidian-editor/themes/lightThemeTemplate.css src/app/obsidian-editor/themes/myLightTheme.css

# For dark theme
cp src/app/obsidian-editor/themes/darkThemeTemplate.css src/app/obsidian-editor/themes/myDarkTheme.css
```

### Step 2: Customize CSS Variables

Open your copied file and modify the CSS variables to match your desired theme. Each variable is clearly commented to explain its purpose:

```css
/* Example: Changing background and text colors in myLightTheme.css */
:root {
  --light-background-primary: #f5f5f5; /* Changed from #ffffff */
  --light-text-normal: #333333; /* Changed from #1a1a1a */
  /* ... other variables */
}
```

### Step 3: Import CSS Variables

Make sure to import your CSS files in your application. Add the following to your main CSS file or component:

```typescript
// In your main entry file or component
import "./path/to/myLightTheme.css";
import "./path/to/myDarkTheme.css";
```

### Step 4: Ensure the Theme Connector is in Place

The CSS variables need to be connected to the actual editor implementation. The library includes a theme connector in `src/app/obsidian-editor/themes/themeVariables.ts` that bridges the CSS variables to the CodeMirror themes.

If you need to customize this connector, you can modify it to use additional variables or change how they're applied:

```typescript
// src/app/obsidian-editor/themes/themeVariables.ts
import { EditorView } from "@codemirror/view";

// Example of customizing the theme connector
export function createLightThemeFromCssVars() {
  return EditorView.theme(
    {
      "&": {
        color: "var(--light-text-normal, #1a1a1a)",
        backgroundColor: "var(--light-background-primary, #ffffff)",
      },
      // Add or modify other properties as needed
      ".cm-comment": {
        color: "var(--light-comment-color, #6a737d)",
        fontStyle: "italic",
      },
      // ... other properties
    },
    { dark: false }
  );
}
```

### Step 5: Apply in Your Application

When your application initializes, make sure the CSS files are loaded before the editor is rendered. For Next.js applications, you'd typically import them in your layout or page component:

```typescript
// app/layout.tsx or similar
import "../styles/global.css";
import "../path/to/myLightTheme.css";
import "../path/to/myDarkTheme.css";

// Rest of your layout component
```

## How the Theme System Works

The obsidian-js theme system works by:

1. **Defining CSS Variables**: Your CSS files define variables for colors and styles
2. **Theme Connector**: The `themeVariables.ts` file reads these variables and creates CodeMirror themes
3. **Theme Registration**: These themes are exported from `editorThemes.ts`
4. **Application**: The themes are applied to the editor components

When you change a CSS variable, the theme connector applies that change to the editor because it references the variables directly in the theme definition.

## Verifying Your Changes

To verify your theme changes are working:

1. Make a change to a CSS variable in your theme file
2. Reload your application
3. Inspect the editor elements using browser dev tools
4. Verify the styles are applied with your new values

If changes aren't appearing:

- Check that your CSS files are properly imported
- Verify the CSS variables are defined in `:root`
- Check if there are any CSS specificity issues
- Verify that the theme connector is using the variables you modified

## Customizing Syntax Highlighting

You can also customize syntax highlighting by creating a custom highlight style. Create a new file:

```typescript
// src/app/obsidian-editor/themes/highlightStyles.ts
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const customHighlightStyle = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: "1.6em",
    fontWeight: "bold",
    color: "var(--light-heading-color)",
  },
  {
    tag: tags.heading2,
    fontSize: "1.4em",
    fontWeight: "bold",
    color: "var(--light-heading-color)",
  },
  {
    tag: tags.heading3,
    fontSize: "1.2em",
    fontWeight: "bold",
    color: "var(--light-heading-color)",
  },
  {
    tag: tags.emphasis,
    fontStyle: "italic",
    color: "var(--light-emphasis-color)",
  },
  { tag: tags.strong, fontWeight: "bold", color: "var(--light-strong-color)" },
  {
    tag: tags.link,
    color: "var(--light-link-color)",
    textDecoration: "underline",
  },
  {
    tag: tags.monospace,
    color: "var(--light-code-color)",
    fontFamily: "monospace",
  },
]);
```

## Best Practices

1. **Keep Variables Organized**: Group related variables together for easy reference.
2. **Test in Both Themes**: Always test your changes in both light and dark modes.
3. **Use Meaningful Colors**: Choose colors with sufficient contrast for accessibility.
4. **Be Consistent**: Maintain consistency with the rest of your application's UI.
5. **Comment Your Changes**: Add comments to explain non-obvious style choices.

## Advanced Customization

For more advanced customization, you can:

1. Add additional CSS variables for specific elements
2. Create theme variants (e.g., high-contrast, sepia)
3. Customize specific editor components like the gutter or cursor

```css
/* Example: Adding custom variables for code blocks */
:root {
  --light-code-block-bg: #f0f0f0;
  --light-code-block-border: #e0e0e0;
  /* ... other variables */
}
```

## Accessibility Considerations

When customizing themes, keep accessibility in mind:

1. **Color Contrast**: Ensure text has sufficient contrast against backgrounds (WCAG AA or higher)
2. **Font Sizes**: Use relative units for font sizes (em, rem) rather than pixels
3. **Focus States**: Make focus states clearly visible
4. **Test with Screen Readers**: Verify your theme works well with assistive technologies

## Troubleshooting

If your theme isn't applying correctly:

1. **Check Variable References**: Ensure all variable references in your JavaScript match the CSS variable names
2. **CSS Load Order**: Make sure your CSS files are loaded before they're referenced
3. **Browser Caching**: Clear browser cache if you don't see changes
4. **CSS Specificity**: Check for style conflicts with higher specificity selectors
5. **Dark Mode Detection**: Verify the `dark` parameter is correctly set in `EditorView.theme()`

## Additional Resources

- [CodeMirror 6 Styling Documentation](https://codemirror.net/6/docs/ref/#view.EditorView^theme)
- [CSS Variables (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
