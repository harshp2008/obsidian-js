// Main entry point for the obsidian-js package
import { applyHighlightStyleFix } from './app/obsidian-editor/utils/highlightStyleFix';

// Apply the fix as early as possible
if (typeof window !== 'undefined') {
  try {
    // Fix the HighlightStyle to prevent "tags is not iterable" error
    applyHighlightStyleFix();
  } catch (e) {
    console.warn("Failed to apply highlight style fix:", e);
  }
}

// Core Editor Component
export { default as CodeMirrorEditor } from './app/obsidian-editor/CodeMirrorEditor';
export type { CodeMirrorEditorProps } from './app/obsidian-editor/CodeMirrorEditor'; // Exporting props type

// Theme Context and Hook
export { ThemeProvider, useTheme } from './contexts/ThemeContext';
export type { ThemeContextType, Theme } from './contexts/ThemeContext'; // Exporting theme types

// UI Components
export { ThemeToggle } from './components/ThemeToggle';

// FileSystem Utilities
export { createFileSystem, createFileSystemExtension } from './app/obsidian-editor/utils/filesystem';
export type { FileSystem, FileSystemOptions, FileSystemError } from './app/obsidian-editor/utils/filesystem';

// Utility Functions (if any are intended for public use, export them here)
// For example:
// export * from './app/obsidian-editor/utils/FormattingFunctions';

// Extensions (if any are intended for public use or configuration)
// For example:
// export { createMarkdownSyntaxPlugin } from './app/obsidian-editor/extensions/markdown-syntax';
