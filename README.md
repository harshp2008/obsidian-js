# Obsidian JS

A modern, extensible JavaScript-based markdown editor inspired by Obsidian.

## Features

- 📝 **Rich Markdown Editing** - Full-featured markdown editor
- 🎨 **Themes** - Light and dark themes with customization options
- 🧩 **Extensions** - Modular architecture for adding new features
- 📱 **Responsive** - Works on desktop and mobile devices
- ⚡ **Performance** - Fast, efficient editing experience

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-js.git
cd obsidian-js

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Project Structure

The project is organized as follows:

```
obsidian-js/
├── docs/                  # Documentation
├── public/                # Static assets
│   └── themes/            # Theme files
├── src/                   # Source code
│   ├── app/               # Main application code
│   │   └── obsidian-editor/  # Editor core
│   ├── components/        # Shared components
│   ├── contexts/          # React contexts
│   └── types/             # TypeScript type definitions
└── ...                    # Configuration files
```

## Theme System

Obsidian JS includes a flexible theme system with light and dark modes. Themes are located in the `public/themes` directory and can be customized or extended.

See [Theme Documentation](./docs/themes.md) for more details.

## Extension System

The editor can be extended with plugins that add new functionality. Extensions are located in the `src/app/obsidian-editor/extensions` directory.

See [Extension Documentation](./docs/extensions.md) for more details.

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Inspired by [Obsidian](https://obsidian.md)
- Built with [Next.js](https://nextjs.org)
- Uses [CodeMirror](https://codemirror.net) for the editor

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A React component library for an Obsidian-like Markdown editor built on top of CodeMirror 6. It provides a clean, customizable editor with dark/light themes and various Markdown extensions.

![Editor Screenshot Placeholder](docs/images/screenshot.png)

## Features

- **Modern CodeMirror 6**: Uses the latest CodeMirror for performance and extensibility
- **Light and Dark Themes**: Seamlessly integrates with your app's theme system
- **Markdown Extensions**: Full markdown support with syntax highlighting
- **Keybindings**: Common markdown formatting shortcuts (bold, italic, etc.)
- **File Management**: Abstract filesystem interface for different storage backends
- **Modular Architecture**: Easily extendable with plugins and custom themes

## Installation

```bash
npm install obsidian-js
# or
yarn add obsidian-js
# or
pnpm add obsidian-js
```

## Quick Start

```jsx
import { CodeMirrorEditor, ThemeProvider } from "obsidian-js";
import "obsidian-js/dist/index.css";

function App() {
  return (
    <ThemeProvider>
      <div style={{ height: "500px" }}>
        <CodeMirrorEditor
          initialValue="# Hello Markdown!"
          onChange={(content) => console.log(content)}
        />
      </div>
    </ThemeProvider>
  );
}
```

## Documentation

The complete documentation is organized into several guides:

- [Getting Started Guide](docs/getting-started.md) - Basic setup and usage
- [Theming Guide](docs/theming.md) - Customizing editor appearance
- [File System Integration](docs/filesystem.md) - Using the filesystem abstraction
- [Development Guide](docs/development.md) - Contributing to the project

## Component API

### CodeMirrorEditor

The main editor component:

```jsx
<CodeMirrorEditor
  initialValue="# Hello"
  readOnly={false}
  onChange={(content) => handleChange(content)}
  onSave={() => handleSave()}
/>
```

#### Props

| Prop           | Type                        | Default | Description                     |
| -------------- | --------------------------- | ------- | ------------------------------- |
| `initialValue` | `string`                    | `''`    | Initial markdown content        |
| `readOnly`     | `boolean`                   | `false` | Whether the editor is read-only |
| `onChange`     | `(content: string) => void` | -       | Called when content changes     |
| `onSave`       | `() => void`                | -       | Called when Ctrl+S is pressed   |

### ThemeProvider

Wraps your app to provide theme context:

```jsx
<ThemeProvider>{/* Your app */}</ThemeProvider>
```

### ThemeToggle

A simple component to toggle between light and dark themes:

```jsx
<ThemeToggle />
```

### useTheme

A React hook to access and manipulate the current theme:

```jsx
const { theme, toggleTheme } = useTheme();
```

## Filesystem Integration

This library provides an abstract filesystem interface that can be implemented for different backends.

```jsx
import { createFileSystem } from "obsidian-js";
import { FirebaseFilesystem } from "./myFirebaseImplementation";

// Set up your filesystem
const fs = createFileSystem(new FirebaseFilesystem(/* config */));

// Use it in your app
fs.readFile("notes/hello.md").then((content) => {
  console.log(content);
});
```

See the [Filesystem Guide](docs/filesystem.md) for detailed instructions and implementation examples.

## Local Development

For development and testing with a local application:

```bash
# Clone and build
git clone https://github.com/yourusername/obsidian-js.git
cd obsidian-js
npm install
npm run build:package

# Link for local development
npm link
cd ../your-app
npm link obsidian-js
```

We also provide a helper script for this process in the [Development Guide](docs/development.md).

## Browser Support

- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Not optimized for mobile browsers

## License

MIT © [Your Organization]

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
