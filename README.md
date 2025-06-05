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
import { ThemeProvider } from "obsidian-js";
import "obsidian-js/dist/index.css"; // Import editor's base CSS

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

**Note:** The path `obsidian-js/dist/CodeMirrorEditor.css` assumes the CSS file is copied to the `dist` folder during the build process of the `obsidian-js` package.

### 2. Use the `ThemeToggle` component (Optional)

```tsx
import { ThemeToggle } from "obsidian-js";

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
import React, { useState } from "react";
import { CodeMirrorEditor } from "obsidian-js";

function MyEditorPage() {
  const [markdown, setMarkdown] = useState(
    "# Hello World\n\nThis is **markdown**."
  );

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleSave = () => {
    console.log("Content saved:", markdown);
  };

  return (
    <div style={{ height: "500px", border: "1px solid #ccc" }}>
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

| Prop       | Type                         | Default | Description                                                                          |
| ---------- | ---------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `content`  | `string`                     |         | The initial markdown content of the editor.                                          |
| `onChange` | `(markdown: string) => void` |         | Callback function triggered when the editor content changes.                         |
| `onSave`   | `() => void` (optional)      |         | Optional callback function triggered when a save action is requested (e.g., Ctrl+S). |
| `editable` | `boolean` (optional)         | `true`  | Optional flag to make the editor read-only.                                          |

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

## Filesystem Abstraction

This library supports embedding and managing files (images, videos, markdown, etc.) via a pluggable filesystem interface. You can use any backend (Firebase, MongoDB, local filesystem, etc.) by implementing the `Filesystem` interface.

### Setup Guides

We provide detailed setup guides for different filesystem implementations:

- [Firebase Setup Guide](docs/firebase-setup.md) - Learn how to set up Firebase as your filesystem backend
- [Local Filesystem Setup Guide](docs/local-filesystem-setup.md) - Learn how to use the local filesystem as your backend

### 1. Implement the Filesystem Interface

Create your own implementation of the `Filesystem` interface:

```ts
// src/types/filesystem.ts
export interface FileMetadata {
  name: string;
  path: string;
  size?: number;
  type?: string; // e.g., 'file', 'directory'
  lastModified?: number;
}

export interface Filesystem {
  readFile(path: string): Promise<string | ArrayBuffer>;
  writeFile(path: string, data: string | ArrayBuffer): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listFiles(directory: string): Promise<FileMetadata[]>;
}
```

### 2. Register Your Filesystem Implementation

Set your implementation at app startup:

```ts
import { setFilesystem } from "src/app/obsidian-editor/extensions/filesystem";
import { MyFilesystem } from "./myFilesystem";

setFilesystem(new MyFilesystem(/* ... */));
```

You can retrieve the current filesystem anywhere in your code:

```ts
import { getFilesystem } from "src/app/obsidian-editor/extensions/filesystem";

const fs = getFilesystem();
await fs.readFile("path/to/file.md");
```

### 3. Example: Firebase Implementation

A sample implementation using Firebase Storage is provided:

```ts
import { FirebaseFilesystem } from "src/app/obsidian-editor/extensions/filesystem/firebaseFilesystem";
import { getStorage } from "firebase/storage";
import { setFilesystem } from "src/app/obsidian-editor/extensions/filesystem";

const storage = getStorage(); // Initialize Firebase and get storage instance
setFilesystem(new FirebaseFilesystem(storage));
```

---

You can now use the filesystem abstraction to embed and manage files in your markdown editor, regardless of the backend you choose.

## Connecting to Firebase Storage

Follow these steps to set up and connect your Firebase project to the filesystem abstraction:

### 1. Install Firebase SDK

```
npm install firebase
```

### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the steps.
3. In the project dashboard, click the web icon (</>) to register your app and get your config.

### 3. Add Your Firebase Config

Create a file for your Firebase config and initialization, e.g., `src/firebase.ts`:

```ts
// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

Replace the values in `firebaseConfig` with those from your Firebase Console.

### 4. Connect to Your Filesystem Abstraction

In your app's entry point (e.g., `src/app/layout.tsx` or wherever you bootstrap your app):

```ts
import { setFilesystem } from "src/app/obsidian-editor/extensions/filesystem";
import { FirebaseFilesystem } from "src/app/obsidian-editor/extensions/filesystem/firebaseFilesystem";
import { storage } from "src/firebase"; // path to your firebase.ts

setFilesystem(new FirebaseFilesystem(storage));
```

### 5. Usage Example

Now, anywhere in your app, you can use:

```ts
import { getFilesystem } from "src/app/obsidian-editor/extensions/filesystem";

const fs = getFilesystem();
await fs.writeFile("notes/hello.md", "# Hello from Firebase!");
const content = await fs.readFile("notes/hello.md");
console.log(content);
```

### 6. (Optional) Authentication

If you want to restrict file access, set up Firebase Authentication and ensure users are signed in before accessing storage. You can add this later if needed.

---
