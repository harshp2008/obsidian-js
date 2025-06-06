# Filesystem Integration Guide

The obsidian-js library provides a flexible filesystem abstraction layer that allows you to integrate with any storage backend (Firebase, AWS S3, local filesystem, etc.). This guide shows you how to implement and use this abstraction.

## Overview

The filesystem abstraction provides a common interface for file operations:

- Reading files
- Writing files
- Listing files
- Deleting files

By implementing this interface, you can seamlessly integrate your preferred storage solution with the editor.

## Using the Filesystem Interface

### Basic Usage

```typescript
import { getFilesystem } from "obsidian-js";

// Get the current filesystem implementation
const fs = getFilesystem();

// Read a file
const content = await fs.readFile("notes/hello.md");

// Write a file
await fs.writeFile("notes/hello.md", "# Hello World");

// List files in a directory
const files = await fs.listFiles("notes");

// Delete a file
await fs.deleteFile("notes/hello.md");
```

### Setting Up the Filesystem

Before you can use the filesystem, you need to set up an implementation:

```typescript
import { setFilesystem } from "obsidian-js";
import { MyCustomFilesystem } from "./myImplementation";

// Initialize with your implementation
setFilesystem(new MyCustomFilesystem());
```

Do this early in your application's lifecycle, typically during initialization.

## Implementing a Filesystem

### The Filesystem Interface

First, understand the interface you need to implement:

```typescript
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

### Creating a Custom Implementation

Here's how to create a custom filesystem implementation:

```typescript
import { Filesystem, FileMetadata } from "obsidian-js";

export class MyCustomFilesystem implements Filesystem {
  constructor(/* your dependencies */) {
    // Initialize your storage backend
  }

  async readFile(path: string): Promise<string | ArrayBuffer> {
    // Implementation for reading a file
    // Return file contents as string or ArrayBuffer
  }

  async writeFile(path: string, data: string | ArrayBuffer): Promise<void> {
    // Implementation for writing a file
  }

  async deleteFile(path: string): Promise<void> {
    // Implementation for deleting a file
  }

  async listFiles(directory: string): Promise<FileMetadata[]> {
    // Implementation for listing files in a directory
    // Return an array of FileMetadata objects
  }
}
```

## Example Implementations

### Local Storage Implementation

```typescript
import { Filesystem, FileMetadata } from "obsidian-js";

export class LocalStorageFilesystem implements Filesystem {
  private prefix: string;

  constructor(prefix: string = "obsidian-fs-") {
    this.prefix = prefix;
  }

  async readFile(path: string): Promise<string> {
    const data = localStorage.getItem(this.prefix + path);
    if (data === null) {
      throw new Error(`File not found: ${path}`);
    }
    return data;
  }

  async writeFile(path: string, data: string | ArrayBuffer): Promise<void> {
    if (data instanceof ArrayBuffer) {
      data = new TextDecoder().decode(data);
    }
    localStorage.setItem(this.prefix + path, data);
  }

  async deleteFile(path: string): Promise<void> {
    localStorage.removeItem(this.prefix + path);
  }

  async listFiles(directory: string): Promise<FileMetadata[]> {
    const dirPrefix =
      this.prefix + (directory.endsWith("/") ? directory : directory + "/");
    const files: FileMetadata[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(dirPrefix)) {
        const path = key.substring(this.prefix.length);
        files.push({
          name: path.split("/").pop() || "",
          path,
          type: "file",
        });
      }
    }

    return files;
  }
}
```

### Firebase Storage Implementation

```typescript
import { Filesystem, FileMetadata } from "obsidian-js";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";

export class FirebaseFilesystem implements Filesystem {
  private storage;

  constructor(firebaseApp) {
    this.storage = getStorage(firebaseApp);
  }

  async readFile(path: string): Promise<string> {
    try {
      const fileRef = ref(this.storage, path);
      const url = await getDownloadURL(fileRef);
      const response = await fetch(url);
      return await response.text();
    } catch (err) {
      throw new Error(`Failed to read file: ${path}`);
    }
  }

  async writeFile(path: string, data: string | ArrayBuffer): Promise<void> {
    const fileRef = ref(this.storage, path);
    if (data instanceof ArrayBuffer) {
      data = new TextDecoder().decode(data);
    }
    await uploadString(fileRef, data);
  }

  async deleteFile(path: string): Promise<void> {
    const fileRef = ref(this.storage, path);
    await deleteObject(fileRef);
  }

  async listFiles(directory: string): Promise<FileMetadata[]> {
    const dirRef = ref(this.storage, directory);
    const result = await listAll(dirRef);

    return result.items.map((item) => ({
      name: item.name,
      path: item.fullPath,
      type: "file",
    }));
  }
}
```

## Advanced Usage

### Error Handling

Properly handle errors in your filesystem implementation:

```typescript
async readFile(path: string): Promise<string> {
  try {
    // Implementation
  } catch (error) {
    // Log error details
    console.error(`Error reading file ${path}:`, error);

    // Throw a consistent error
    throw new Error(`Failed to read file: ${path} - ${error.message}`);
  }
}
```

### File Metadata

Provide rich metadata when listing files:

```typescript
async listFiles(directory: string): Promise<FileMetadata[]> {
  // Implementation

  return [{
    name: 'example.md',
    path: 'notes/example.md',
    size: 1024,
    type: 'file',
    lastModified: Date.now()
  }];
}
```

### Binary Data Support

Handle both text and binary data:

```typescript
async readFile(path: string): Promise<string | ArrayBuffer> {
  // Check if it's a binary file based on extension
  const isBinary = /\.(png|jpg|pdf|mp3)$/i.test(path);

  if (isBinary) {
    // Return as ArrayBuffer for binary files
    return this.readBinaryFile(path);
  } else {
    // Return as string for text files
    return this.readTextFile(path);
  }
}
```

## Best Practices

1. **Error Handling**: Provide meaningful error messages
2. **Caching**: Consider implementing caching for frequently accessed files
3. **Authentication**: Add proper authentication checks in your implementation
4. **Validation**: Validate paths to prevent security issues
5. **Progress Tracking**: For large files, consider implementing progress tracking
