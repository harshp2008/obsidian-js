import React from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as _codemirror_state from '@codemirror/state';

/**
 * Props for the CodeMirrorEditor component.
 * @interface CodeMirrorEditorProps
 */
interface CodeMirrorEditorProps {
    /** Initial markdown content for the editor */
    initialValue?: string;
    /** Whether the editor is read-only */
    readOnly?: boolean;
    /** Optional callback when content changes */
    onChange?: (content: string) => void;
    /** Optional callback for save actions (Ctrl+S) */
    onSave?: () => void;
}
/**
 * A CodeMirror editor component with Markdown syntax highlighting and preview mode.
 * This component is client-side only and includes SSR-safety measures.
 *
 * @param props - Component props
 * @returns React component
 */
declare const CodeMirrorEditor: React.FC<CodeMirrorEditorProps>;

/**
 * Represents the possible theme states.
 */
type Theme = 'light' | 'dark';
/**
 * Defines the shape of the ThemeContext.
 */
type ThemeContextType = {
    /** The current active theme ('light' or 'dark'). */
    theme: Theme;
    /** Function to toggle the current theme. */
    toggleTheme: () => void;
    /** Whether the provider has mounted on the client */
    mounted: boolean;
};
/**
 * Provides the theme state and toggle function to its children components.
 * It handles theme persistence in localStorage and synchronization with system preferences.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The ThemeProvider component (always renders children to avoid hydration issues).
 */
declare function ThemeProvider({ children }: {
    children: React.ReactNode;
}): react_jsx_runtime.JSX.Element;
/**
 * Custom hook to access the theme context (theme state and toggle function).
 * This hook must be used within a component wrapped by `ThemeProvider`.
 *
 * @throws {Error} If used outside of a `ThemeProvider`.
 * @returns {ThemeContextType} The theme context.
 */
declare function useTheme(): ThemeContextType;

/**
 * A button component that allows the user to toggle between light and dark themes.
 * It uses the `useTheme` hook to access the current theme and the toggle function.
 * This component is SSR-friendly and won't cause hydration mismatches.
 *
 * @returns {JSX.Element} The theme toggle button.
 */
declare function ThemeToggle(): react_jsx_runtime.JSX.Element;

interface FileSystemOptions {
    basePath?: string;
    onError?: (error: Error) => void;
}
interface FileSystem {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    listFiles: (path: string) => Promise<any>;
}
declare class FileSystemError extends Error {
    constructor(message: string);
}
declare const createFileSystem: (options?: FileSystemOptions) => FileSystem;
declare const createFileSystemExtension: (fileSystem: FileSystem) => _codemirror_state.Extension;

export { CodeMirrorEditor, type CodeMirrorEditorProps, type FileSystem, FileSystemError, type FileSystemOptions, type Theme, type ThemeContextType, ThemeProvider, ThemeToggle, createFileSystem, createFileSystemExtension, useTheme };
