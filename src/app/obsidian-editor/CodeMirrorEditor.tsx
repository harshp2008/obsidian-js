'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Extension, Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { setMarkdownSyntaxMode } from './extensions/markdown-syntax/index';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Import our modular theme and extensions
import { lightTheme, darkTheme } from './utils/theme';
import { createEditorExtensions } from './utils/editorExtensions';
import { useTheme } from '../../contexts/ThemeContext';

// Import our custom styles
import './CodeMirrorEditor.css';

/**
 * Props for the CodeMirrorEditor component.
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
 */
const CodeMirrorEditor = ({ initialValue = '', readOnly = false, onChange, onSave }: CodeMirrorEditorProps) => {
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [currentMode, setCurrentMode] = useState<'live' | 'preview'>('live');
  const { theme, toggleTheme, mounted } = useTheme();
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
    // Only initialize on client-side after mounting
    if (!mounted || !editorRef.current) return;
    
    try {
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
      
      // Define a safer highlight style with more robust error handling
      let customHighlightStyle: Extension;
      try {
        // Make sure tags is properly defined and available
        if (typeof t === 'object') {
          // Create a simplified highlight style that avoids the "tags is not iterable" error
          const safeHighlightStyle = HighlightStyle.define([
            // Only use known valid tags to avoid errors
            { tag: t.heading1, class: "cm-header cm-header-1" },
            { tag: t.heading2, class: "cm-header cm-header-2" },
            { tag: t.heading3, class: "cm-header cm-header-3" },
            { tag: t.strong, class: "cm-strong" },
            { tag: t.emphasis, class: "cm-em" },
            { tag: t.link, class: "cm-link" },
            { tag: t.monospace, class: "cm-monospace" },
            { tag: t.keyword, class: "cm-keyword" },
            { tag: t.string, class: "cm-string" },
            { tag: t.comment, class: "cm-comment" },
            { tag: t.name, class: "cm-def" }
          ]);
          customHighlightStyle = syntaxHighlighting(safeHighlightStyle);
        } else {
          console.warn("Lezer highlight tags not available, using empty highlight style");
          customHighlightStyle = [];
        }
      } catch (e) {
        console.error("Error creating highlight style:", e);
        customHighlightStyle = []; // Empty extension as fallback
      }
      
      const extensions = [
        ...createEditorExtensions({
          markdown: initialContent.current,
          editableCompartment,
          isDark: theme === 'dark',
          themeExtension: themeCompartment.of(themeExtension),
          onSave: () => onSaveRef.current?.(),
        }),
        changeListener,
        customHighlightStyle
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
    } catch (error) {
      console.error("Error initializing CodeMirror:", error);
      // If we have an onChange handler, notify that initialization failed
      if (onChange) {
        onChange(initialValue);
      }
      throw error; // Re-throw to trigger error boundary
    }
  }, [editableCompartment, mounted]); // Only depend on mounted and compartment
  
  // Handle external initialValue changes only during the initial mount
  useEffect(() => {
    if (!isInitialMount.current && editorView && initialValue !== initialContent.current) {
      try {
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
      } catch (error) {
        console.error("Error updating CodeMirror content:", error);
      }
    }
  }, [initialValue, editorView]);
  
  // Effect to handle theme changes without reinitializing the editor
  useEffect(() => {
    if (editorView && themeCompartment) {
      try {
        const themeExtension = theme === 'dark' ? darkTheme : lightTheme;
        editorView.dispatch({
          effects: themeCompartment.reconfigure(themeExtension)
        });
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    }
  }, [theme, editorView, themeCompartment]);

  // Effect for updating the editor mode and editable state
  useEffect(() => {
    if (editorView) {
      try {
        // Dispatch effects to update markdown syntax mode
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
      } catch (error) {
        console.error("Error updating editor mode:", error);
      }
    }
  }, [currentMode, editable, editorView, editableCompartment]);

  // If not mounted yet (SSR), return placeholder to avoid hydration issues
  if (!mounted) {
    return (
      <div className="flex flex-col h-full border rounded-md overflow-hidden">
        <div className="p-2 border-b shrink-0 bg-slate-50 flex justify-between items-center">
          <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex-grow overflow-auto p-4 bg-white">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2 animate-pulse"></div>
        </div>
      </div>
    );
  }

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
