'use client';

import React, { useState } from 'react';
import { EditorView } from '@codemirror/view';
import { useTheme } from '../../contexts/ThemeContext';
import { setEditorTheme, EditorThemeName } from './utils/theme';

// Import our modular components
import EditorCore from './components/EditorCore';
import EditorToolbar from './components/EditorToolbar';

// Import CSS
import './CodeMirrorEditor.css';

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
  /** Optional callback for when the editor view is ready */
  onEditorViewReady?: (view: EditorView) => void;
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
  onSave,
  onEditorViewReady
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
    if (onEditorViewReady) {
      onEditorViewReady(view);
    }
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
