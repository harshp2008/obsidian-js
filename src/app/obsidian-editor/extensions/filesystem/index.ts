import { Extension } from '@codemirror/state';
import { FileMetadata, Filesystem } from './firebaseFilesystem';

// Keep track of the current filesystem instance
let fs: Filesystem | null = null;

/**
 * Set the current filesystem implementation
 * @param filesystem The filesystem implementation to use
 */
export function setFilesystem(filesystem: Filesystem) {
  fs = filesystem;
}

/**
 * Get the current filesystem implementation
 * @returns The current filesystem
 * @throws Error if no filesystem has been set
 */
export function getFilesystem(): Filesystem {
  if (!fs) throw new Error('Filesystem not set');
  return fs;
}

/**
 * Options for creating a file system
 */
export interface FileSystemOptions {
  files?: Record<string, string>;
  onSave?: (path: string, content: string) => Promise<boolean> | boolean;
}

/**
 * Create a filesystem for the editor
 * @param options Options for the filesystem
 * @returns A simple filesystem implementation
 */
export function createFileSystem(options: FileSystemOptions = {}): {
  readFile: (path: string) => string;
  saveFile: (path: string, content: string) => Promise<boolean> | boolean;
} {
  return {
    readFile: (path: string) => options.files?.[path] || '',
    saveFile: (path: string, content: string) => {
      if (options.onSave) {
        return options.onSave(path, content);
      }
      return false;
    }
  };
}

/**
 * Create a filesystem extension for the editor
 * @param filesystem The filesystem to use
 * @returns A CodeMirror extension
 */
export function createFileSystemExtension(filesystem: Filesystem): Extension {
  setFilesystem(filesystem);
  return [];
}

// Re-export FileMetadata and Filesystem interfaces
export type { FileMetadata, Filesystem };

// Export FirebaseFilesystem to make it available
export { FirebaseFilesystem } from './firebaseFilesystem';

/**
 * Create a markdown filesystem for the editor
 */
export function createMarkdownFileSystem(options: any = {}) {
  // This is a placeholder for the actual implementation
  return createFileSystem(options);
} 