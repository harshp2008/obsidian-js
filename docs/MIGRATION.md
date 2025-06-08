# Migration Guide

This guide helps you migrate from previous versions of Obsidian-JS to the latest version.

## Migrating from v0.0.x to v0.1.0

Version 0.1.0 introduces a number of breaking changes and improvements:

### CSS Import Changes

Previously, CSS was automatically loaded by the component. Now, you need to explicitly import the CSS:

```jsx
// Old (v0.0.x)
import { CodeMirrorEditor } from "obsidian-js";

// New (v0.1.0+)
import { CodeMirrorEditor } from "obsidian-js";
import "obsidian-js/css"; // Add this line
```

### Theme Provider

The `ThemeProvider` is now required for theme switching functionality:

```jsx
// Old (v0.0.x)
import { CodeMirrorEditor } from "obsidian-js";

function App() {
  return <CodeMirrorEditor initialValue="# Hello" />;
}

// New (v0.1.0+)
import { CodeMirrorEditor, ThemeProvider } from "obsidian-js";
import "obsidian-js/css";

function App() {
  return (
    <ThemeProvider>
      <CodeMirrorEditor initialValue="# Hello" />
    </ThemeProvider>
  );
}
```

### Component Props

Some props have been renamed or changed:

```jsx
// Old (v0.0.x)
<CodeMirrorEditor
  value="# Hello"
  onContentChange={handleChange}
  saveCallback={handleSave}
/>

// New (v0.1.0+)
<CodeMirrorEditor
  initialValue="# Hello" // renamed from 'value'
  onChange={handleChange} // renamed from 'onContentChange'
  onSave={handleSave}    // renamed from 'saveCallback'
/>
```

### Extensions

Extensions are now more modular and can be imported separately:

```jsx
// Old (v0.0.x)
import { CodeMirrorEditor, createMarkdownExtension } from "obsidian-js";

// New (v0.1.0+)
import {
  CodeMirrorEditor,
  createMarkdownSyntaxPlugin,
  createNoMarkdownInHtmlExtension,
} from "obsidian-js";
```

### File System Integration

The file system API has been enhanced:

```jsx
// Old (v0.0.x)
import { CodeMirrorEditor, createFileSystem } from "obsidian-js";

const fs = createFileSystem({
  files: { "/note.md": "# Note" },
});

// New (v0.1.0+)
import {
  CodeMirrorEditor,
  createFileSystem,
  createFileSystemExtension,
} from "obsidian-js";

const fs = createFileSystem({
  files: { "/note.md": "# Note" },
  onSave: (path, content) => {
    console.log(`Saving ${path}`);
    return true; // Return success/failure
  },
});

// You can now create an extension from the file system
const fsExtension = createFileSystemExtension(fs);
```

## TypeScript Support

TypeScript types are now exported directly:

```tsx
// Old (v0.0.x)
import { CodeMirrorEditor } from "obsidian-js";
import { EditorProps } from "obsidian-js/types";

// New (v0.1.0+)
import { CodeMirrorEditor, type CodeMirrorEditorProps } from "obsidian-js";
```

## SSR Compatibility

The library is now more compatible with server-side rendering:

```jsx
// Old (v0.0.x) - Required manual SSR checks
import { useEffect, useState } from "react";
import { CodeMirrorEditor } from "obsidian-js";

function Editor() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div>Loading...</div>;

  return <CodeMirrorEditor />;
}

// New (v0.1.0+) - SSR handling is built-in
import { CodeMirrorEditor, ThemeProvider } from "obsidian-js";
import "obsidian-js/css";

function Editor() {
  return (
    <ThemeProvider>
      <CodeMirrorEditor initialValue="# Hello" />
    </ThemeProvider>
  );
}
```

## Troubleshooting

If you encounter issues during migration, please check the following:

1. Make sure you've imported the CSS files correctly
2. Ensure the `ThemeProvider` is wrapping your editor components
3. Check that all imports from 'obsidian-js' are using the new names
4. Verify that your build system is configured to handle CSS imports from node_modules
