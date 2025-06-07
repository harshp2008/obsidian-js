# Obsidian JS Themes

This directory contains the theme files for the Obsidian JS editor. Themes are organized by family, with each family in its own subdirectory.

## Directory Structure

```
themes/
├── index.js        # Theme registry and metadata
├── README.md       # This file
└── vanilla/        # Vanilla theme family
    ├── vanilla-light.css  # Light variant
    └── vanilla-dark.css   # Dark variant
```

## Adding New Themes

1. Create a new directory for your theme family
2. Add your theme CSS files
3. Update the `index.js` file to include your new themes

See the main documentation in `docs/themes.md` for more detailed information on creating themes.

## Using Themes

Themes are applied by the `ThemeManager` which is accessed through:

- `theme-manager.js` - Direct access to the theme manager singleton
- `useTheme.js` - React hook for theme management
- `ThemeSelector.jsx` - React component for theme selection

## Available Themes

### Vanilla

A clean, minimal theme with purple accents.

- **Vanilla Light**: Light theme with subtle purple highlights
- **Vanilla Dark**: Dark theme with purple accents for better contrast
