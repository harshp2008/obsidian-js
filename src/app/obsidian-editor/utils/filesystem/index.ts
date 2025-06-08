/**
 * Filesystem types and utilities
 */
import { Extension } from '@codemirror/state';

/**
 * Error types for filesystem operations
 */
export enum FileSystemError {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_PATH = 'INVALID_PATH',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Options for creating a filesystem
 */
export interface FileSystemOptions {
  files?: Record<string, string>;
  onSave?: (path: string, content: string) => boolean;
  onDelete?: (path: string) => boolean;
  onCreateDir?: (path: string) => boolean;
}

/**
 * Interface for a filesystem
 */
export interface FileSystem {
  readFile: (path: string) => string;
  saveFile: (path: string, content: string) => boolean;
  deleteFile?: (path: string) => boolean;
  createDirectory?: (path: string) => boolean;
  listDirectory?: (path: string) => string[];
  fileExists?: (path: string) => boolean;
  dirExists?: (path: string) => boolean;
}

/**
 * Create a filesystem for the editor
 */
export function createFileSystem(options: FileSystemOptions = {}): FileSystem {
  // This is a placeholder for the actual implementation
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
 */
export function createFileSystemExtension(filesystem: FileSystem): Extension {
  // This is a placeholder for the actual implementation
  return [];
}

/**
 * Create a markdown filesystem for the editor
 */
export function createMarkdownFileSystem(options: FileSystemOptions = {}): FileSystem {
  // This is a placeholder for the actual implementation
  return createFileSystem(options);
} 