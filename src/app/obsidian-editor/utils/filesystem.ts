/**
 * @fileoverview Filesystem utilities for the editor
 * @module obsidian-editor/extensions/filesystem
 */

import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';

export interface FileSystemOptions {
  basePath?: string;
  onError?: (error: Error) => void;
}

export interface FileSystem {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  listFiles: (path: string) => Promise<any>;
}

export class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

export const createFileSystem = (options: FileSystemOptions = {}): FileSystem => {
  const { basePath = '', onError } = options;

  const handleError = (error: Error) => {
    if (onError) {
      onError(error);
    } else {
      console.error('FileSystem Error:', error);
    }
    throw error;
  };

  return {
    async readFile(path: string): Promise<string> {
      try {
        const response = await fetch(`${basePath}/${encodeURIComponent(path)}`);
        if (!response.ok) {
          throw new FileSystemError(`Failed to read file: ${path}`);
        }
        return await response.text();
      } catch (error) {
        return handleError(error as Error);
      }
    },

    async writeFile(path: string, content: string): Promise<void> {
      try {
        const response = await fetch(`${basePath}?path=${encodeURIComponent(path)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: content,
        });
        if (!response.ok) {
          throw new FileSystemError(`Failed to write file: ${path}`);
        }
      } catch (error) {
        return handleError(error as Error);
      }
    },

    async deleteFile(path: string): Promise<void> {
      try {
        const response = await fetch(`${basePath}?path=${encodeURIComponent(path)}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new FileSystemError(`Failed to delete file: ${path}`);
        }
      } catch (error) {
        return handleError(error as Error);
      }
    },

    async listFiles(path: string): Promise<any> {
      try {
        const response = await fetch(`${basePath}?path=${encodeURIComponent(path)}`);
        if (!response.ok) {
          throw new FileSystemError(`Failed to list files in: ${path}`);
        }
        return await response.json();
      } catch (error) {
        return handleError(error as Error);
      }
    },
  };
};

export const createFileSystemExtension = (fileSystem: FileSystem) => {
  return EditorView.domEventHandlers({
    keydown: (event, view) => {
      // Handle Ctrl+S or Cmd+S for saving
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        // You can implement auto-save logic here
        return true;
      }
      return false;
    },
  });
};

/**
 * File structure interface
 */
export interface MarkdownFile {
  path: string;
  name: string;
  content: string;
  lastModified: Date;
}

/**
 * Filesystem interface
 */
export interface MarkdownFileSystem {
  files: MarkdownFile[];
  getCurrentFile: () => MarkdownFile | null;
  saveFile: (content: string) => Promise<void>;
  createFile: (name: string, content: string) => Promise<MarkdownFile>;
  deleteFile: (path: string) => Promise<boolean>;
  getAllFiles: () => MarkdownFile[];
}

/**
 * Interface for extracted heading
 */
interface Heading {
  level: number;
  title: string;
  pos: number;
}

/**
 * Extract headings from markdown content
 * 
 * @param {EditorState} state - The editor state
 * @returns {Array<Heading>} List of headings
 */
export function extractHeadings(state: EditorState): Heading[] {
  const headings: Heading[] = [];
  const tree = syntaxTree(state);
  
  // Walk through the syntax tree to find heading nodes
  tree.iterate({
    enter: (node) => {
      if (node.name.startsWith('ATXHeading')) {
        // Extract the heading level from node name (e.g., ATXHeading1)
        const level = parseInt(node.name.slice(-1));
        
        // Get the heading text content
        const from = node.from + level + 1; // Skip # characters and space
        const to = node.to;
        const title = state.doc.sliceString(from, to).trim();
        
        headings.push({
          level,
          title,
          pos: node.from
        });
      }
    }
  });
  
  return headings;
}

/**
 * Create a markdown filesystem for use with the editor
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.initialContent - Initial file content
 * @param {string} options.fileName - Initial file name
 * @returns {MarkdownFileSystem} A markdown filesystem object
 */
export function createMarkdownFileSystem(options: {
  initialContent?: string;
  fileName?: string;
} = {}): MarkdownFileSystem {
  const { 
    initialContent = '', 
    fileName = 'untitled.md' 
  } = options;
  
  // Initialize with a default file
  const files: MarkdownFile[] = [{
    path: `/${fileName}`,
    name: fileName,
    content: initialContent,
    lastModified: new Date()
  }];
  
  let currentFile: MarkdownFile | null = files[0];
  
  return {
    files,
    
    getCurrentFile() {
      return currentFile;
    },
    
    async saveFile(content: string) {
      if (currentFile) {
        currentFile.content = content;
        currentFile.lastModified = new Date();
      }
    },
    
    async createFile(name: string, content: string = '') {
      const path = `/${name}`;
      const newFile: MarkdownFile = {
        path,
        name,
        content,
        lastModified: new Date()
      };
      
      files.push(newFile);
      currentFile = newFile;
      
      return newFile;
    },
    
    async deleteFile(path: string) {
      const index = files.findIndex(file => file.path === path);
      
      if (index >= 0) {
        files.splice(index, 1);
        
        // Update current file if deleted
        if (currentFile && currentFile.path === path) {
          currentFile = files.length > 0 ? files[0] : null;
        }
        
        return true;
      }
      
      return false;
    },
    
    getAllFiles() {
      return [...files];
    }
  };
} 