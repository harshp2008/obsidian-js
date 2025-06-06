'use client';

import React, { useEffect, useRef } from 'react';
import { EditorState, Extension, Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { setMarkdownSyntaxMode } from '../extensions/markdown-syntax/index';
import { createEditorExtensions } from '../utils/editorExtensions';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../utils/theme';
import { ThemeMode } from '../../../types/theme';

/**
 * Props for the EditorCore component.
 * @interface EditorCoreProps
 */
export interface EditorCoreProps {
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
export const EditorCore: React.FC<EditorCoreProps> = ({ 
  initialValue, 
  readOnly, 
  mode, 
  onChange, 
  onSave,
  onEditorViewCreated
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { theme, mounted } = useTheme();
  
  // Track callbacks with refs to avoid dependency changes
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  
  // Create compartments for reconfigurable extensions
  const editableCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  
  // Update refs when props change
  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
  }, [onChange, onSave]);
  
  // Initialize the editor once when the component mounts
  useEffect(() => {
    // Only initialize on client-side after mounting
    if (!mounted || !editorRef.current) return;
    
    // Handle a previously created editor view
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
    }
    
    try {
      // Determine which theme to use based on the current application theme
      const themeExtension = theme === 'dark' ? darkTheme : lightTheme;
      
      // Listen for document changes
      const changeListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          // Only trigger onChange if the change was from user input
          if (update.transactions.some(tr => tr.isUserEvent("input") || tr.isUserEvent("delete"))) {
            const doc = update.state.doc;
            onChangeRef.current(doc.toString());
          }
        }
      });
      
      // Create editor extensions
      const extensions = [
        ...createEditorExtensions({
          markdown: initialValue,
          editableCompartment,
          isDark: theme === 'dark',
          themeExtension: themeCompartment.of(themeExtension),
          onSave: () => onSaveRef.current?.(),
        }),
        changeListener
      ];

      // Create the editor view
      const view = new EditorView({
        state: EditorState.create({
          doc: initialValue,
          extensions,
        }),
        parent: editorRef.current,
      });

      // Store the view reference
      editorViewRef.current = view;
      
      // Call the callback if provided
      if (onEditorViewCreated) {
        onEditorViewCreated(view);
      }

      return () => {
        view.destroy();
      };
    } catch (error) {
      console.error("Error initializing CodeMirror:", error);
      throw error; // Re-throw to trigger error boundary
    }
  }, [mounted]); // Only depend on mounted state
  
  // Handle theme changes without reinitializing the editor
  useEffect(() => {
    if (editorViewRef.current && themeCompartment && mounted) {
      try {
        const themeExtension = theme === 'dark' ? darkTheme : lightTheme;
        editorViewRef.current.dispatch({
          effects: themeCompartment.reconfigure(themeExtension)
        });
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    }
  }, [theme, themeCompartment, mounted]);

  // Effect for updating the editor mode and editable state
  useEffect(() => {
    if (editorViewRef.current && mounted) {
      try {
        // Dispatch effects to update markdown syntax mode
        editorViewRef.current.dispatch({
          effects: [
            setMarkdownSyntaxMode.of(mode)
          ]
        });

        // Update the editable state of the editor
        const isEditable = mode === 'live' && !readOnly;
        editorViewRef.current.dispatch({
          effects: editableCompartment.reconfigure(EditorView.editable.of(isEditable))
        });
      } catch (error) {
        console.error("Error updating editor mode:", error);
      }
    }
  }, [mode, readOnly, editableCompartment, mounted]);

  // When initialValue changes externally, update the editor content
  useEffect(() => {
    if (editorViewRef.current && mounted) {
      try {
        const currentContent = editorViewRef.current.state.doc.toString();
        
        // Only update if content is different
        if (currentContent !== initialValue) {
          // Store the current selection
          const prevSelection = editorViewRef.current.state.selection;
          
          const transaction = editorViewRef.current.state.update({
            changes: { from: 0, to: editorViewRef.current.state.doc.length, insert: initialValue },
            selection: prevSelection, // Keep cursor position
          });
          
          editorViewRef.current.dispatch(transaction);
        }
      } catch (error) {
        console.error("Error updating editor content:", error);
      }
    }
  }, [initialValue, mounted]);
  
  return <div ref={editorRef} className="obsidian-editor-core" />;
};

export default EditorCore; 