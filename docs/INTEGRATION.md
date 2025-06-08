# Integration Guide

This guide provides examples of how to integrate Obsidian-JS with various React frameworks and build systems.

## Next.js

### Installation

```bash
npm install obsidian-js
```

### Basic Setup

```jsx
// app/components/MarkdownEditor.jsx
"use client";

import { useState } from "react";
import { CodeMirrorEditor, ThemeProvider } from "obsidian-js";
import "obsidian-js/css";

export default function MarkdownEditor({ initialContent = "", onSave }) {
  const [content, setContent] = useState(initialContent);

  const handleChange = (newContent) => {
    setContent(newContent);
  };

  return (
    <ThemeProvider>
      <div className="h-[600px] border rounded-md">
        <CodeMirrorEditor
          initialValue={content}
          onChange={handleChange}
          onSave={() => onSave?.(content)}
        />
      </div>
    </ThemeProvider>
  );
}
```

### Usage in a Page

```jsx
// app/pages/editor.jsx
"use client";

import MarkdownEditor from "../components/MarkdownEditor";

export default function EditorPage() {
  const handleSave = (content) => {
    console.log("Saving content:", content);
    // Implement your save logic here
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Markdown Editor</h1>
      <MarkdownEditor initialContent="# Hello, world!" onSave={handleSave} />
    </div>
  );
}
```

### Additional Configuration

To load the CSS files correctly in Next.js, make sure your `next.config.js` is configured:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other Next.js config here

  // This ensures CSS is processed correctly
  transpilePackages: ["obsidian-js"],
};

module.exports = nextConfig;
```

## Create React App

### Installation

```bash
npm install obsidian-js
```

### Usage

```jsx
// src/components/Editor.jsx
import { useState } from "react";
import { CodeMirrorEditor, ThemeProvider } from "obsidian-js";
import "obsidian-js/css";

function Editor() {
  const [content, setContent] = useState("# Hello, Create React App!");

  return (
    <ThemeProvider>
      <div
        className="editor-container"
        style={{ height: "600px", border: "1px solid #ccc" }}
      >
        <CodeMirrorEditor initialValue={content} onChange={setContent} />
      </div>
    </ThemeProvider>
  );
}

export default Editor;
```

## Vite

### Installation

```bash
npm install obsidian-js
```

### Usage

```jsx
// src/components/Editor.jsx
import { useState } from "react";
import { CodeMirrorEditor, ThemeProvider } from "obsidian-js";
import "obsidian-js/css";

function Editor() {
  const [content, setContent] = useState("# Hello, Vite!");

  return (
    <ThemeProvider>
      <div
        className="editor-container"
        style={{ height: "600px", border: "1px solid #ccc" }}
      >
        <CodeMirrorEditor initialValue={content} onChange={setContent} />
      </div>
    </ThemeProvider>
  );
}

export default Editor;
```

## Advanced Usage

### Custom Theming

You can customize the appearance by providing your own CSS:

```css
/* styles/custom-editor.css */
.obsidian-editor-container {
  /* Your custom styles here */
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Override syntax highlighting colors */
.cm-s-obsidian .cm-header {
  color: #0066cc;
}
```

Then import your custom CSS after the library's CSS:

```jsx
import "obsidian-js/css";
import "./styles/custom-editor.css";
```

### Server-Side Rendering

When using Obsidian-JS in a server-side rendered environment, ensure you're using the component within a client-side boundary:

```jsx
"use client"; // For Next.js App Router

import { useState, useEffect } from "react";
import { CodeMirrorEditor, ThemeProvider } from "obsidian-js";

export default function MyEditor() {
  // Prevent SSR issues with a loading state
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading editor...</div>;
  }

  return (
    <ThemeProvider>
      <CodeMirrorEditor initialValue="# Hello, world!" />
    </ThemeProvider>
  );
}
```
