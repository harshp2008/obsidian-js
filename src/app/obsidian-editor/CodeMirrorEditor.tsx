'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Extension, Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { setMarkdownSyntaxMode } from './extensions/markdown-syntax/index';

// Import our modular theme and extensions
import { lightTheme, darkTheme } from './utils/theme';
import { createEditorExtensions } from './utils/editorExtensions';
import { useTheme } from '../../contexts/ThemeContext';

// Import our custom styles
import './CodeMirrorEditor.css';

/**
 * Props for the CodeMirrorEditor component
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
 */
const CodeMirrorEditor = ({ initialValue = '', readOnly = false, onChange, onSave }: CodeMirrorEditorProps) => {
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [currentMode, setCurrentMode] = useState<'live' | 'preview'>('live');
  const { theme, toggleTheme } = useTheme();
  const editable = !readOnly;
  
  // Track whether this is the initial render
  const isInitialMount = useRef(true);
  
  // Store the initial content value to prevent re-renders from prop changes
  const initialContent = useRef(initialValue);
  
  // Create refs to hold compartments
  const editorRef = useRef<HTMLDivElement>(null);
  const editableCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  
  // Save reference to callback props
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  
  // Update refs when props change
  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
  }, [onChange, onSave]);
  
  // Create the editor when the component mounts
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Determine which theme to use based on the current application theme
    const themeExtension = theme === 'dark' ? darkTheme : lightTheme;
    
    // Listen for document changes
    const changeListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChangeRef.current) {
        // Only trigger onChange if the change was from user input
        // This prevents cursor jumps from external content changes
        if (update.transactions.some(tr => tr.isUserEvent("input") || tr.isUserEvent("delete"))) {
          const doc = update.state.doc;
          onChangeRef.current(doc.toString());
        }
      }
    });
    
    const extensions = [
      ...createEditorExtensions({
        markdown: initialContent.current,
        editableCompartment,
        isDark: theme === 'dark',
        themeExtension: themeCompartment.of(themeExtension),
        onSave: () => onSaveRef.current?.(),
      }),
      changeListener
    ];

    const view = new EditorView({
      state: EditorState.create({
        doc: initialContent.current,
        extensions,
      }),
      parent: editorRef.current,
    });

    setEditorView(view);
    isInitialMount.current = false;

    return () => {
      view.destroy();
    };
  }, [editableCompartment]);
  
  // Handle external initialValue changes only during the initial mount
  useEffect(() => {
    if (!isInitialMount.current && editorView && initialValue !== initialContent.current) {
      // Store the current selection
      const prevSelection = editorView.state.selection;
      
      // Only update if content is different and not from the editor itself
      if (editorView.state.doc.toString() !== initialValue) {
        const transaction = editorView.state.update({
          changes: { from: 0, to: editorView.state.doc.length, insert: initialValue },
          selection: prevSelection, // Keep cursor position
        });
        editorView.dispatch(transaction);
      }
      
      // Update reference
      initialContent.current = initialValue;
    }
  }, [initialValue, editorView]);
  
  // Effect to handle theme changes without reinitializing the editor
  useEffect(() => {
    if (editorView && themeCompartment) {
      const themeExtension = theme === 'dark' ? darkTheme : lightTheme;
      editorView.dispatch({
        effects: themeCompartment.reconfigure(themeExtension)
      });
    }
  }, [theme, editorView, themeCompartment]);

  // Effect for updating the editor mode and editable state
  useEffect(() => {
    if (editorView) {
      editorView.dispatch({
        effects: [
          setMarkdownSyntaxMode.of(currentMode)
        ]
      });

      // Update the editable state of the editor
      const isEditable = currentMode === 'live' && editable;
      editorView.dispatch({
        effects: editableCompartment.reconfigure(EditorView.editable.of(isEditable))
      });
    }
  }, [currentMode, editable, editorView, editableCompartment]);

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      <div className="p-2 border-b shrink-0 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
        <button 
          onClick={() => setCurrentMode(currentMode === 'live' ? 'preview' : 'live')}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 text-sm transition-colors duration-150"
        >
          {currentMode === 'live' ? 'View Preview' : 'Edit Content'}
        </button>
        
        <button
          onClick={toggleTheme}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 text-sm transition-colors duration-150"
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="flex-grow overflow-auto"> 
        <div 
          className="h-full" 
          data-testid="codemirror-editor"
        >
          <div ref={editorRef} className="h-full" />
        </div>
      </div>
    </div>
  );
};

export default CodeMirrorEditor;
