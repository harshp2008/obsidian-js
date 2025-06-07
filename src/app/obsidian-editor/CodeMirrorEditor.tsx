'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useTheme } from '../../contexts/ThemeContext';
import { obsidianTheme, obsidianSyntaxTheme } from './themes/obsidian';
import { createMarkdownSyntaxPlugin, setMarkdownSyntaxMode } from './extensions/markdown-syntax';
import combinedKeymap from './extensions/keymaps';
import { createMarkdownFileSystem } from './extensions/filesystem';
import { createNoMarkdownInHtmlExtension } from './extensions/markdown/no-formatting';
import { EditorThemeName, setEditorTheme, getCurrentEditorTheme } from './utils/theme';

// Import our modular components
import EditorCore from './components/EditorCore';
import EditorToolbar from './components/EditorToolbar';

// Import CSS
import './CodeMirrorEditor.css';

// Load theme CSS early
if (typeof document !== 'undefined') {
  const loadThemeCSS = () => {
    // Check if CSS is already loaded
    if (!document.querySelector('link[data-theme-css="vanilla-light"]')) {
      const lightCSS = document.createElement('link');
      lightCSS.rel = 'stylesheet';
      lightCSS.href = '/css/vanilla-light.css';
      lightCSS.setAttribute('data-theme-css', 'vanilla-light');
      document.head.appendChild(lightCSS);
    }
    
    if (!document.querySelector('link[data-theme-css="vanilla-dark"]')) {
      const darkCSS = document.createElement('link');
      darkCSS.rel = 'stylesheet';
      darkCSS.href = '/css/vanilla-dark.css';
      darkCSS.setAttribute('data-theme-css', 'vanilla-dark');
      document.head.appendChild(darkCSS);
    }
    
    // Set initial data-theme attribute
    const theme = getCurrentEditorTheme();
    const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', `${theme}-${mode}`);
    
    // Load the main obsidian CSS file that has all HTML rendering styles
    if (!document.querySelector('link[data-theme-css="obsidian"]')) {
      const obsidianCSS = document.createElement('link');
      obsidianCSS.rel = 'stylesheet';
      obsidianCSS.href = '/css/obsidian.css';
      obsidianCSS.setAttribute('data-theme-css', 'obsidian');
      document.head.appendChild(obsidianCSS);
    }
  };

  // Execute immediately
  loadThemeCSS();
}

/**
 * Props for the CodeMirrorEditor component.
 * @interface CodeMirrorEditorProps
 */
export interface CodeMirrorEditorProps {
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
const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({ 
  initialValue = '', 
  readOnly = false, 
  onChange, 
  onSave 
}) => {
  // Editor view reference
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  
  // Editor mode (live editing or preview)
  const [currentMode, setCurrentMode] = useState<'live' | 'preview'>('live');
  
  // Theme state
  const { mounted } = useTheme();
  
  // Handle editor view creation
  const handleEditorViewCreated = (view: EditorView) => {
    setEditorView(view);
  };
  
  // Handle mode changes
  const handleModeChange = (mode: 'live' | 'preview') => {
    setCurrentMode(mode);
  };
  
  // Handle theme changes
  const handleThemeChange = (themeName: EditorThemeName) => {
    setEditorTheme(themeName);
  };

  return (
    <div className="obsidian-editor-container">
      {/* Only render when mounted to prevent SSR issues */}
      {mounted && (
        <>
          {/* Toolbar with formatting buttons */}
          <EditorToolbar 
            editorView={editorView} 
            mode={currentMode}
            onModeChange={handleModeChange}
            onThemeChange={handleThemeChange}
          />
          
          {/* Core editor component */}
          <div className="obsidian-editor-content">
            <EditorCore
              initialValue={initialValue}
              readOnly={readOnly}
              mode={currentMode}
              onChange={onChange}
              onSave={onSave}
              onEditorViewCreated={handleEditorViewCreated}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CodeMirrorEditor;
