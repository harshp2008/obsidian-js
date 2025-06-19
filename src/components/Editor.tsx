'use client';

import React from 'react';
import CodeMirrorEditor, { ObsidianiteEditorProps } from '../app/obsidian-editor/CodeMirrorEditor';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/Editor.css';
import { EditorView } from '@codemirror/view';

export interface EditorProps extends ObsidianiteEditorProps {
  className?: string;
  onEditorViewReady?: (view: EditorView) => void;
}

export function Editor({ className, onEditorViewReady, ...props }: EditorProps) {
  const { theme } = useTheme();
  
  return (
    <div className={`obsidian-editor-wrapper ${theme} ${className || ''}`}>
      <CodeMirrorEditor 
        {...props} 
        onEditorViewReady={onEditorViewReady}
      />
    </div>
  );
} 