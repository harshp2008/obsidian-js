# Local Filesystem Setup Guide for obsidian-js

This guide will walk you through setting up a local filesystem implementation for obsidian-js.

## Prerequisites

- Node.js and npm installed
- Basic knowledge of React and TypeScript
- Access to the local filesystem (for Node.js environments)

## Step 1: Install Required Dependencies

```bash
npm install fs-extra @types/fs-extra
```

## Step 2: Implement Local FileSystem

Create a new file `src/lib/localFileSystem.ts`:

```typescript
import * as fs from "fs-extra";
import * as path from "path";
import { FileSystem } from "obsidian-js";

class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemError";
  }
}

export const createLocalFileSystem = (basePath: string): FileSystem => {
  // Ensure the base directory exists
  fs.ensureDirSync(basePath);

  return {
    async readFile(filePath: string): Promise<string> {
      try {
        const fullPath = path.join(basePath, filePath);
        return await fs.readFile(fullPath, "utf-8");
      } catch (error) {
        throw new FileSystemError(`Failed to read file: ${filePath}`);
      }
    },

    async writeFile(filePath: string, content: string): Promise<void> {
      try {
        const fullPath = path.join(basePath, filePath);
        // Ensure the directory exists
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content, "utf-8");
      } catch (error) {
        throw new FileSystemError(`Failed to write file: ${filePath}`);
      }
    },

    async deleteFile(filePath: string): Promise<void> {
      try {
        const fullPath = path.join(basePath, filePath);
        await fs.remove(fullPath);
      } catch (error) {
        throw new FileSystemError(`Failed to delete file: ${filePath}`);
      }
    },

    async listFiles(directoryPath: string): Promise<any> {
      try {
        const fullPath = path.join(basePath, directoryPath);
        const files = await fs.readdir(fullPath);
        return files.map((file) => ({
          name: file,
          path: path.join(directoryPath, file),
          isDirectory: fs.statSync(path.join(fullPath, file)).isDirectory(),
        }));
      } catch (error) {
        throw new FileSystemError(`Failed to list files in: ${directoryPath}`);
      }
    },
  };
};
```

## Step 3: Initialize the FileSystem

In your app's entry point (e.g., `src/app/layout.tsx` or `src/pages/_app.tsx`):

```typescript
import { createLocalFileSystem } from "../lib/localFileSystem";
import { setFilesystem } from "obsidian-js";

// Initialize the filesystem with your desired base path
const filesystem = createLocalFileSystem("./data");
setFilesystem(filesystem);
```

## Step 4: Usage Example

```typescript
import { getFilesystem } from "obsidian-js";

// In your component
const handleSave = async () => {
  const fs = getFilesystem();
  try {
    await fs.writeFile("notes/my-note.md", "# Hello from Local Filesystem!");
    const content = await fs.readFile("notes/my-note.md");
    console.log("Saved content:", content);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

## Step 5: Security Considerations

When using a local filesystem:

1. **Path Traversal Prevention**

   - Always validate file paths
   - Use `path.join()` to prevent directory traversal attacks
   - Consider implementing path sanitization

2. **File Permissions**
   - Ensure proper read/write permissions on the base directory
   - Consider implementing user-specific directories
   - Handle file permission errors gracefully

## Step 6: Error Handling

Implement proper error handling in your components:

```typescript
const handleFileOperation = async () => {
  const fs = getFilesystem();
  try {
    await fs.writeFile("example.md", "content");
  } catch (error) {
    if (error instanceof FileSystemError) {
      // Handle filesystem-specific errors
      console.error("Filesystem error:", error.message);
    } else {
      // Handle other errors
      console.error("Unexpected error:", error);
    }
  }
};
```

## Step 7: File Watching (Optional)

For real-time updates, you can implement file watching:

```typescript
import * as chokidar from "chokidar";

const watchFiles = (basePath: string, onFileChange: (path: string) => void) => {
  const watcher = chokidar.watch(basePath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  });

  watcher
    .on("add", (path) => onFileChange(path))
    .on("change", (path) => onFileChange(path))
    .on("unlink", (path) => onFileChange(path));

  return watcher;
};
```

## Troubleshooting

1. **Permission Issues**

   - Check file and directory permissions
   - Ensure the application has write access to the base directory
   - Verify user account permissions

2. **Path Issues**

   - Use absolute paths when necessary
   - Verify path separators for your OS
   - Check for invalid characters in filenames

3. **Performance Issues**
   - Consider implementing caching for frequently accessed files
   - Use streaming for large files
   - Implement proper error boundaries in React components

## Additional Resources

- [Node.js File System Documentation](https://nodejs.org/api/fs.html)
- [fs-extra Documentation](https://github.com/jprichardson/node-fs-extra)
- [Path Module Documentation](https://nodejs.org/api/path.html)
