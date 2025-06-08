/**
 * Main entry point for the obsidian-js package
 */

// Re-export types
export type { ThemeContextType, Theme } from './contexts/ThemeContext';
export type { CodeMirrorEditorProps } from './app/obsidian-editor/CodeMirrorEditor';

// Re-export client components
export * from './client';

// Utils (server-compatible)
export * from './app/obsidian-editor/utils/formatting';

// Import CSS (will be processed by build tools)
import './index.css';

// Note: Components that use React hooks are exported from their respective client files
// Client components will be automatically handled by the Next.js compiler

// Core Components
export { default as CodeMirrorEditor } from './app/obsidian-editor/CodeMirrorEditor';
export { default as EditorCore } from './app/obsidian-editor/components/EditorCore';
export { default as EditorToolbar } from './app/obsidian-editor/components/EditorToolbar';
export { default as ThemeSwitcher } from './app/obsidian-editor/components/ThemeSwitcher';
export { Editor } from './components/Editor';
export { ThemeToggle } from './components/ThemeToggle';

// Theme Context
export { ThemeProvider, useTheme } from './contexts/ThemeContext';
