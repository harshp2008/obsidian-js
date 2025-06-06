# Theming Guide

This guide explains how to customize the appearance of the obsidian-js editor through its theming system.

## Theme Basics

The obsidian-js library includes built-in light and dark themes and a theme context system that:

- Syncs with system preferences
- Persists user theme choices
- Handles theme switching
- Provides CSS variables for consistent styling

## Using the Theme System

### 1. ThemeProvider

The `ThemeProvider` component establishes the theme context for your app:

```jsx
import { ThemeProvider } from "obsidian-js";

function App() {
  return <ThemeProvider>{/* Your app content */}</ThemeProvider>;
}
```

This provider:

- Initializes theme from localStorage or system preference
- Handles theme persistence
- Provides theme state and toggling function to children

### 2. ThemeToggle Component

The library includes a ready-to-use toggle button:

```jsx
import { ThemeToggle } from "obsidian-js";

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  );
}
```

### 3. useTheme Hook

You can also access theme state programmatically:

```jsx
import { useTheme } from "obsidian-js";

function CustomThemeControl() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <span>Current theme: {theme}</span>
      <button onClick={toggleTheme}>
        Switch to {theme === "light" ? "dark" : "light"} theme
      </button>
    </div>
  );
}
```

## Customizing the Editor Appearance

### Using CSS Variables

The easiest way to customize the editor is through CSS variables:

```css
:root {
  /* Light theme variables */
  --background-primary: #ffffff;
  --background-secondary: #f5f5f5;
  --text-normal: #1e1e1e;
  --text-muted: #666666;
  --text-accent: #5200cc;
  --interactive-normal: #f0f0f0;
  --interactive-hover: #e0e0e0;
  --interactive-accent: #7c3aed;
}

:root.dark {
  /* Dark theme variables */
  --background-primary: #1e1e1e;
  --background-secondary: #252525;
  --text-normal: #dcddde;
  --text-muted: #999999;
  --text-accent: #a78bfa;
  --interactive-normal: #2a2a2a;
  --interactive-hover: #303030;
  --interactive-accent: #7c3aed;
}
```

These variables are applied to both the editor and surrounding UI components.

### Custom Editor Theme

For more advanced customization, you can create custom CodeMirror themes:

1. Create a new theme file:

```typescript
// src/app/obsidian-editor/themes/customTheme.ts
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";

export const customLightTheme: Extension = EditorView.theme({
  "&": {
    backgroundColor: "var(--background-primary, #ffffff)",
    color: "var(--text-normal, #1e1e1e)",
  },
  ".cm-content": {
    fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
    fontSize: "16px",
    caretColor: "var(--text-accent, #5200cc)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--text-accent, #5200cc)",
    borderLeftWidth: "2px",
  },
  ".cm-line": {
    padding: "0 4px",
  },
  ".cm-header": { color: "var(--text-accent, #5200cc)", fontWeight: "bold" },
  ".cm-header-1": { fontSize: "1.7em" },
  ".cm-header-2": { fontSize: "1.4em" },
  ".cm-header-3": { fontSize: "1.2em" },
  ".cm-strong": { fontWeight: "bold" },
  ".cm-em": { fontStyle: "italic" },
  ".cm-link": {
    color: "var(--text-accent, #5200cc)",
    textDecoration: "underline",
  },
});
```

2. Register your theme with the editor:

```typescript
// src/app/obsidian-editor/utils/theme.ts
import { customLightTheme } from "../themes/customTheme";

// Export your custom theme
export const lightTheme = customLightTheme;
```

## Advanced Theming

### Syntax Highlighting

You can customize syntax highlighting by defining a `HighlightStyle`:

```typescript
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const customHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, color: "#8839ef", fontWeight: "bold" },
  { tag: tags.heading2, color: "#8839ef", fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.link, color: "#1e88e5", textDecoration: "underline" },
  { tag: tags.comment, color: "#767c9d", fontStyle: "italic" },
  { tag: tags.list, color: "#e64553" },
]);
```

### Creating Theme Variants

You can create multiple theme variants:

```typescript
// src/app/obsidian-editor/themes/index.ts
export const availableThemes = {
  light: lightTheme,
  dark: darkTheme,
  sepia: sepiaTheme,
  nord: nordTheme,
};
```

Then extend the `Theme` type to support your variants:

```typescript
// src/contexts/ThemeContext.tsx
export type Theme = "light" | "dark" | "sepia" | "nord";
```

And update the ThemeContext to handle multiple themes:

```typescript
const toggleTheme = () => {
  setTheme((prevTheme) => {
    // Cycle through available themes
    const themes: Theme[] = ["light", "dark", "sepia", "nord"];
    const currentIndex = themes.indexOf(prevTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];

    localStorage.setItem("theme", newTheme);
    applyThemeToHTML(newTheme, true);

    return newTheme;
  });
};
```

## Styling the Editor Container

The editor is rendered inside a container that you can style:

```css
.editor-container {
  height: 600px;
  border: 1px solid var(--interactive-normal);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.editor-container:focus-within {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
```

## Best Practices

1. **Use CSS Variables**: Keep your theme color definitions in CSS variables for easy updates.

2. **Progressive Enhancement**: Design your base theme first, then enhance for specific features.

3. **Contrast Ratios**: Ensure text has sufficient contrast against backgrounds (WCAG AA or higher).

4. **User Preferences**: Honor system preferences and user choices for accessibility.

5. **Testing**: Test your themes with different content types, including code blocks, tables, and rich content.

## Troubleshooting

### Theme not applying correctly?

1. Make sure your app is properly wrapped with `ThemeProvider`
2. Check that CSS variables are defined in your global styles
3. Verify that CSS is properly imported in your application
4. Clear browser cache and local storage if testing changes

### Problems with theme switching?

If your theme toggle isn't persisting or working correctly:

1. Check browser console for errors
2. Verify localStorage permissions
3. Make sure the theme state is being updated correctly
