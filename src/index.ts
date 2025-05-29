// Main entry point for the obsidian-js package

// Core Editor Component
export { default as CodeMirrorEditor } from './app/obsidian-editor/CodeMirrorEditor';
export type { CodeMirrorEditorProps } from './app/obsidian-editor/CodeMirrorEditor'; // Exporting props type

// Theme Context and Hook
export { ThemeProvider, useTheme } from './contexts/ThemeContext';
export type { ThemeContextType, Theme } from './contexts/ThemeContext'; // Exporting theme types

// UI Components
export { ThemeToggle } from './components/ThemeToggle';

// Utility Functions (if any are intended for public use, export them here)
// For example:
// export * from './app/obsidian-editor/utils/FormattingFunctions';

// Extensions (if any are intended for public use or configuration)
// For example:
// export { createMarkdownSyntaxPlugin } from './app/obsidian-editor/extensions/markdown-syntax';
