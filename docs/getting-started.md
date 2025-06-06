# Getting Started with obsidian-js

This guide will help you set up obsidian-js in your React project and start using the Markdown editor.

## Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- A React application (v17.0.0 or later)

## Installation

Install obsidian-js and its peer dependencies:

```bash
# Using npm
npm install obsidian-js react react-dom

# Using yarn
yarn add obsidian-js react react-dom

# Using pnpm
pnpm add obsidian-js react react-dom
```

## Basic Setup

### 1. Wrap your application with ThemeProvider

First, wrap your application with the `ThemeProvider` component. This provider handles theme state (light/dark) and provides it to all components.

```tsx
// app/layout.tsx or your root component
import { ThemeProvider } from "obsidian-js";
import "obsidian-js/dist/index.css"; // Import the CSS

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Add a theme toggle (optional)

Add a theme toggle button to your UI:

```tsx
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

### 3. Use the editor component

Now you can use the `CodeMirrorEditor` component anywhere in your application:

```tsx
import { useState } from "react";
import { CodeMirrorEditor } from "obsidian-js";

function EditorPage() {
  const [content, setContent] = useState("# Hello World\n\nStart typing...");

  const handleChange = (newContent) => {
    setContent(newContent);
    // Save to backend, update state, etc.
  };

  const handleSave = () => {
    console.log("Saving content:", content);
    // Implement save logic here
  };

  return (
    <div className="editor-container" style={{ height: "600px" }}>
      <CodeMirrorEditor
        initialValue={content}
        onChange={handleChange}
        onSave={handleSave}
        readOnly={false}
      />
    </div>
  );
}
```

## Configuring Editor Styles

The editor container needs a specific height or it will collapse. You can style it using:

```css
/* In your CSS file */
.editor-container {
  height: 600px;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}
```

## Using the Editor with Next.js

For Next.js applications, make sure to use the editor as a client component:

```tsx
"use client"; // Mark as client component

import { useState } from "react";
import { CodeMirrorEditor } from "obsidian-js";

export default function Editor() {
  // ... component code
}
```

## Using the Theme Hook

You can access and control the theme state programmatically:

```tsx
import { useTheme } from "obsidian-js";

function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Switch to {theme === "light" ? "dark" : "light"} mode
      </button>
    </div>
  );
}
```

## Editor Keyboard Shortcuts

The editor comes with built-in keyboard shortcuts:

| Shortcut             | Action                          |
| -------------------- | ------------------------------- |
| `Ctrl+B`             | Toggle **bold**                 |
| `Ctrl+I`             | Toggle _italic_                 |
| `Ctrl+H`             | Toggle highlight                |
| `Ctrl+S`             | Save (triggers onSave callback) |
| `Ctrl+1` to `Ctrl+6` | Heading levels 1-6              |
| `Ctrl+K`             | Insert link                     |

## Next Steps

- Explore [theming options](theming.md)
- Set up [file system integration](filesystem.md)
- Learn about [development and contributing](development.md)

## Troubleshooting

### "Cannot use JSX unless the '--jsx' flag is provided"

Make sure your TypeScript configuration includes JSX support:

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx"
    // other options...
  }
}
```

### ThemeProvider Error: "React.createContext is not a function"

Ensure you're using a compatible React version (17.0.0 or later).

### CSS Not Loading

Verify you've imported the CSS file:

```tsx
import "obsidian-js/dist/index.css";
```

### For More Help

Check out the [issues page](https://github.com/your-org/obsidian-js/issues) or create a new issue if you encounter any problems.
