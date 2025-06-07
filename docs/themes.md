# Obsidian JS Theme System

## Overview

The Obsidian JS theme system allows for customizing the appearance of the editor. Themes are CSS files that define variables and styles used throughout the application.

## Available Themes

Currently, the following themes are available:

- **Vanilla Light**: A clean, minimal light theme with purple accents
- **Vanilla Dark**: A clean, minimal dark theme with purple accents

## Theme Structure

Themes are located in the `public/themes` directory, organized by theme family:

```
public/
└── themes/
    ├── index.js        # Theme registry and metadata
    └── vanilla/        # Vanilla theme family
        ├── vanilla-light.css
        └── vanilla-dark.css
```

## Development Setup

When developing themes, you need to ensure the theme files are properly linked. In development environments, you may need to create symbolic links to ensure proper loading.

### Windows PowerShell

```powershell
# Run from the root of the project
New-Item -ItemType Directory -Path "public/themes" -Force
New-Item -ItemType SymbolicLink -Path "public/themes/vanilla" -Target "obsidian-js/public/themes/vanilla"
```

### Linux/macOS

```bash
# Run from the root of the project
mkdir -p public/themes
ln -s obsidian-js/public/themes/vanilla public/themes/vanilla
```

## Creating a New Theme

To create a new theme:

1. Create a new directory under `public/themes/` for your theme family (e.g., `public/themes/mytheme/`)
2. Create CSS files for each variant (e.g., `mytheme-light.css`, `mytheme-dark.css`)
3. Define CSS variables for your theme (see existing themes for reference)
4. Update `public/themes/index.js` to include your new theme(s)

### Theme CSS Structure

Each theme should define CSS variables for:

- Background colors (primary and secondary)
- Text colors (normal, muted, accent)
- Selection and highlighting colors
- Syntax highlighting colors
- Border and shadow styles

Here's an example template:

```css
/* 
 * MY THEME NAME
 * Brief description of the theme
 */

:root {
  /* Default variables if not overridden */
  --mytheme-background-primary: #ffffff;
  --mytheme-background-secondary: #f5f5f5;
  --mytheme-text-normal: #333333;
  --mytheme-text-muted: #777777;
  --mytheme-text-accent: #0066cc;
  --mytheme-cursor: #0066cc;

  /* Selection & Highlights */
  --mytheme-selection-bg: rgba(0, 102, 204, 0.2);
  --mytheme-active-line: rgba(0, 0, 0, 0.03);
  --mytheme-active-line-gutter: rgba(0, 0, 0, 0.05);

  /* Syntax Highlighting */
  --mytheme-heading-color: #222222;
  --mytheme-emphasis-color: #333333;
  --mytheme-strong-color: #000000;
  --mytheme-link-color: #0066cc;
  --mytheme-code-color: #0066cc;
  --mytheme-quote-color: #777777;

  /* Borders & Shadows */
  --mytheme-border-color: #dddddd;
  --mytheme-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Apply the theme when selected */
html[data-theme="mytheme"] {
  /* Override variables as needed */
}

/* Additional custom styles */
html[data-theme="mytheme"] .cm-editor {
  /* Custom styles for CodeMirror editor */
}
```

## Using Themes

Themes are applied by setting the `data-theme` attribute on the `html` element. The application handles this automatically based on user preferences.

## Theme Registry

Themes are registered in `public/themes/index.js`, which exports:

- `THEMES`: An object with theme ID constants
- `THEME_METADATA`: An array of theme metadata objects
- Helper functions for accessing themes

To add a new theme, update the `THEMES` object and `THEME_METADATA` array.

## Best Practices

- Use CSS variables for all colors and styles
- Provide clear comments for each variable
- Ensure sufficient contrast for accessibility
- Test themes in different viewport sizes and contexts
- Keep related themes in the same family directory
