# Obsidian JS Components

## Overview

This document provides an overview of the key components in the Obsidian JS editor.

## Editor Components

### ThemeSelector

Located in `src/app/obsidian-editor/components/ThemeSelector.jsx`, this component provides a UI for selecting themes and theme preferences.

**Features:**

- Switch between light and dark mode
- Select specific themes
- Use system preferences for theme selection

**Usage:**

```jsx
import ThemeSelector from "../path/to/ThemeSelector";

function MyComponent() {
  return (
    <div>
      <ThemeSelector />
    </div>
  );
}
```

## Core Components

_This section will be expanded as components are documented._

## UI Components

_This section will be expanded as components are documented._

## Custom Component Development

To create new components for Obsidian JS:

1. Place your component in the appropriate directory
2. Use JSDoc comments to document props and behavior
3. Follow the existing component patterns
4. Add tests for your component
5. Document your component in this file

## Best Practices

When developing components:

1. Keep components focused on a single responsibility
2. Use TypeScript for type safety
3. Document props and behaviors
4. Consider accessibility
5. Test for different viewport sizes
