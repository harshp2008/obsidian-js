# obsidian-js

A React component for an Obsidian-like Markdown editor using CodeMirror 6. It supports light/dark themes and provides a clean interface for Markdown editing.

## Features

- CodeMirror 6 based Markdown editor
- Light and Dark mode support, synchronized with application theme
- Theme toggle component included
- Basic Markdown formatting (Bold, Italic, Headings, etc.) via keybindings
- Live preview mode (toggles between editor and rendered HTML)

## Installation

```bash
npm install obsidian-js
# or
yarn add obsidian-js
```

Make sure you have the peer dependencies installed:

```bash
npm install react react-dom
# or
yarn add react react-dom
```

## Basic Usage

### 1. Wrap your application with `ThemeProvider`

This is necessary for the theme toggling and editor theming to work correctly.

```tsx
// app/layout.tsx or your main application file
import { ThemeProvider } from 'obsidian-js';
import 'obsidian-js/dist/index.css'; // Import editor's base CSS

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Note:** The path `obsidian-js/dist/CodeMirrorEditor.css` assumes the CSS file is copied to the `dist` folder during the build process of the `obsidian-js` package.

### 2. Use the `ThemeToggle` component (Optional)

```tsx
import { ThemeToggle } from 'obsidian-js';

function MyHeader() {
  return (
    <header>
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  );
}
```

### 3. Use the `CodeMirrorEditor` component

```tsx
import React, { useState } from 'react';
import { CodeMirrorEditor } from 'obsidian-js';

function MyEditorPage() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nThis is **markdown**.');

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleSave = () => {
    console.log('Content saved:', markdown);
  };

  return (
    <div style={{ height: '500px', border: '1px solid #ccc' }}>
      <CodeMirrorEditor
        content={markdown}
        onChange={handleEditorChange}
        onSave={handleSave}
        editable={true}
      />
    </div>
  );
}

export default MyEditorPage;
```

## `CodeMirrorEditor` Props

| Prop       | Type                          | Default | Description                                                                 |
|------------|-------------------------------|---------|-----------------------------------------------------------------------------|
| `content`  | `string`                      |         | The initial markdown content of the editor.                                 |
| `onChange` | `(markdown: string) => void`  |         | Callback function triggered when the editor content changes.                |
| `onSave`   | `() => void` (optional)       |         | Optional callback function triggered when a save action is requested (e.g., Ctrl+S). |
| `editable` | `boolean` (optional)          | `true`  | Optional flag to make the editor read-only.                                 |

## Peer Dependencies

This package has `react` and `react-dom` as peer dependencies. You need to have these installed in your project.

- `react`: `>=17.0.0`
- `react-dom`: `>=17.0.0`

## Building the Package Locally (for contributors)

1. Clone the repository.
2. Install dependencies: `npm install` or `yarn install`.
3. Install `tsup` if you haven't already: `npm install --save-dev tsup`.
4. Build the package: `npm run build:package` or `yarn build:package`.
   This will output the compiled files to the `dist` directory.

## License

MIT
