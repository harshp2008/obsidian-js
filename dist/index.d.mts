import * as React from 'react';
import React__default from 'react';

/**
 * Props for the CodeMirrorEditor component.
 */
interface CodeMirrorEditorProps {
    /** The initial markdown content of the editor. */
    content: string;
    /** Callback function triggered when the editor content changes. */
    onChange: (markdown: string) => void;
    /** Optional callback function triggered when a save action is requested (e.g., Ctrl+S). */
    onSave?: () => void;
    /** Optional flag to make the editor read-only. Defaults to true. */
    editable?: boolean;
}
/**
 * A React component that wraps a CodeMirror 6 editor instance,
 * configured for an Obsidian-like Markdown editing experience.
 *
 * @param {CodeMirrorEditorProps} props - The props for the component.
 * @returns {JSX.Element} The CodeMirror editor component.
 */
declare const CodeMirrorEditor: React__default.FC<CodeMirrorEditorProps>;

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
};
/**
 * Provides the theme state and toggle function to its children components.
 * It handles theme persistence in localStorage and synchronization with system preferences.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element | null} The ThemeProvider component or null if not mounted yet.
 */
declare function ThemeProvider({ children }: {
    children: React__default.ReactNode;
}): React__default.JSX.Element | null;
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
 *
 * @returns {JSX.Element} The theme toggle button.
 */
declare function ThemeToggle(): React.JSX.Element;

export { CodeMirrorEditor, type CodeMirrorEditorProps, type Theme, type ThemeContextType, ThemeProvider, ThemeToggle, useTheme };
