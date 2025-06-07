/**
 * @fileoverview Filesystem utilities for the editor
 * @module obsidian-editor/extensions/filesystem
 */

import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';

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
 * Extract headings from markdown content
 * 
 * @param {EditorState} state - The editor state
 * @returns {Array<{level: number, title: string, pos: number}>} List of headings
 */
export function extractHeadings(state: EditorState) {
  const headings = [];
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
  
  let currentFile = files[0];
  
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
        if (currentFile.path === path) {
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