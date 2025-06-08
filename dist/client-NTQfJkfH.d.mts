import React from 'react';
import { EditorView } from '@codemirror/view';
import * as react_jsx_runtime from 'react/jsx-runtime';

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
 * Props for the EditorCore component.
 * @interface EditorCoreProps
 */
interface EditorCoreProps {
    /** Initial markdown content for the editor */
    initialValue: string;
    /** Whether the editor is read-only */
    readOnly: boolean;
    /** Editor view mode (live editing or preview) */
    mode: 'live' | 'preview';
    /** Optional callback when content changes */
    onChange?: (content: string) => void;
    /** Optional callback for save actions (Ctrl+S) */
    onSave?: () => void;
    /** Callback to set the editor view reference */
    onEditorViewCreated?: (view: EditorView) => void;
}
/**
 * Core editor component that manages the CodeMirror instance
 * Responsible for editor initialization, state management, and theme handling
 *
 * @param props - Component props
 * @returns React component
 */
declare const EditorCore: React.FC<EditorCoreProps>;

/**
 * Available editor theme names
 */
type EditorThemeName = 'default' | 'vanilla';

/**
 * Props for the EditorToolbar component
 * @interface EditorToolbarProps
 */
interface EditorToolbarProps {
    /** The CodeMirror editor view instance */
    editorView: EditorView | null;
    /** Current mode of the editor (live or preview) */
    mode: 'live' | 'preview';
    /** Callback when mode is changed */
    onModeChange: (mode: 'live' | 'preview') => void;
    /** Optional callback when theme is changed */
    onThemeChange?: (themeName: EditorThemeName) => void;
}
/**
 * Toolbar component for the markdown editor
 * Provides formatting buttons and view mode toggle
 *
 * @param props - Component props
 * @returns React component
 */
declare const EditorToolbar: React.FC<EditorToolbarProps>;

/**
 * Props for the ThemeSwitcher component
 */
interface ThemeSwitcherProps {
    onThemeChange?: (themeName: EditorThemeName) => void;
}
/**
 * Component for switching between editor themes
 */
declare const ThemeSwitcher: React.FC<ThemeSwitcherProps>;

declare function Editor(props: CodeMirrorEditorProps): react_jsx_runtime.JSX.Element;

/**
 * A simple toggle button for switching between light and dark themes
 */
declare function ThemeToggle(): react_jsx_runtime.JSX.Element;

/**
 * Represents the possible theme states.
 */
type Theme = 'light' | 'dark';
/**
 * Defines the shape of the ThemeContext.
 */
interface ThemeContextType {
    /** The current active theme ('light' or 'dark'). */
    theme: Theme;
    /** Function to toggle the current theme. */
    toggleTheme: () => void;
    /** Whether the provider has mounted on the client */
    mounted: boolean;
}
/**
 * Provides the theme state and toggle function to its children components.
 * It handles theme persistence in localStorage and synchronization with system preferences.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The ThemeProvider component (always renders children to avoid hydration issues).
 */
declare const ThemeProvider: React.FC<{
    children: React.ReactNode;
}>;
/**
 * Custom hook to access the theme context (theme state and toggle function).
 * This hook must be used within a component wrapped by `ThemeProvider`.
 *
 * @throws {Error} If used outside of a `ThemeProvider`.
 * @returns {ThemeContextType} The theme context.
 */
declare const useTheme: () => ThemeContextType;

export { type CodeMirrorEditorProps as C, EditorCore as E, type ThemeContextType as T, type Theme as a, CodeMirrorEditor as b, EditorToolbar as c, ThemeSwitcher as d, Editor as e, ThemeToggle as f, ThemeProvider as g, useTheme as u };
