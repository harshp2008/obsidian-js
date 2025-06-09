'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Extension, Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { setMarkdownSyntaxMode } from '../extensions/markdown-support';
import { createEditorExtensions } from '../utils/editorExtensions';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme, getCurrentEditorTheme, getTheme } from '../utils/theme';
import { ThemeMode } from '../../../types/theme';
import { createMarkdownSyntaxPlugin } from '../extensions/markdown-support';
import combinedKeymap from '../extensions/keymaps';

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
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  
  // Track callbacks with refs to avoid dependency changes
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  
  // Create compartments for reconfigurable extensions
  const editableCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  
  // Get the current editor theme
  const editorThemeName = getCurrentEditorTheme();
  
  // Update refs when props change
  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
  }, [onChange, onSave]);
  
  // Add wheel event handler to ensure scrolling works
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Let the default behavior happen - the scroller will handle it
      e.stopPropagation();
    };

    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('wheel', handleWheel, { passive: true });
      
      return () => {
        editorElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);
  
  // Helper function to safely parse and sanitize HTML content
  const sanitizeInitialValue = (content: string): string => {
    try {
      // Don't wrap HTML in code blocks anymore
      return content;
    } catch (e) {
      console.warn('Error sanitizing content:', e);
      return content;
    }
  };

  // Initialize the editor once when the component mounts
  useEffect(() => {
    // Only initialize on client-side after mounting
    if (!mounted || !editorRef.current) return;
    
    // Handle a previously created editor view
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
    }
    
    try {
      // Process the initial content to avoid parsing issues
      const safeInitialValue = sanitizeInitialValue(initialValue);
      
      // Add global error handler for CodeMirror initialization
      const errorHandler = (error: ErrorEvent) => {
        if (error.message?.includes('CodeMirror') || 
            error.message?.includes('Cannot read properties of undefined')) {
          console.warn('Caught editor initialization error:', error);
          setInitializationError(error.error);
        }
      };
      
      window.addEventListener('error', errorHandler);
      
      // Determine which theme to use based on the current application theme and editor theme
      const themeExtension = getTheme(editorThemeName, theme === 'dark' ? 'dark' : 'light');
      
      // Listen for document changes
      const changeListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          // Only trigger onChange if the change was from user input
          if (update.transactions.some(tr => tr.isUserEvent("input") || tr.isUserEvent("delete"))) {
            const doc = update.state.doc;
            const content = doc.toString();
            onChangeRef.current(content);
            
            // Trigger document:change hooks for plugins
            import('../extensions/plugin-api').then(({ obsidianPluginAPI }) => {
              obsidianPluginAPI.triggerHooks('document:change', content);
            }).catch(console.error);
          }
        }
      });
      
      // Custom extension to handle errors in the editor
      const errorHandlingExtension = EditorView.domEventHandlers({
        error: (event, view) => {
          console.warn('DOM error event in editor:', event);
          return false;
        }
      });
      
      // Create editor extensions
      const extensions = [
        ...createEditorExtensions({
          markdown: safeInitialValue,
          editableCompartment,
          isDark: theme === 'dark',
          themeExtension: themeCompartment.of(themeExtension),
          onSave: () => onSaveRef.current?.(),
        }),
        changeListener,
        errorHandlingExtension
      ];

      // Create the editor view
      const view = new EditorView({
        state: EditorState.create({
          doc: safeInitialValue,
          extensions,
        }),
        parent: editorRef.current,
      });

      // Store the view reference
      editorViewRef.current = view;
      
      // Make the view available for external initialization of plugins
      if (typeof window !== 'undefined') {
        (window as any).__obsidianEditorView = view;
      }
      
      // Call the callback if provided
      if (onEditorViewCreated) {
        onEditorViewCreated(view);
      }

      return () => {
        window.removeEventListener('error', errorHandler);
        view.destroy();
      };
    } catch (error) {
      console.error("Error initializing CodeMirror:", error);
      setInitializationError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [mounted]); // Only depend on mounted state
  
  // Handle theme changes without reinitializing the editor
  useEffect(() => {
    if (editorViewRef.current && themeCompartment && mounted) {
      try {
        // Get the appropriate theme based on the current theme name and mode
        const themeExtension = getTheme(editorThemeName, theme === 'dark' ? 'dark' : 'light');
        
        // Apply the data-theme attribute for CSS targeting
        document.documentElement.setAttribute(
          'data-theme', 
          `${editorThemeName}-${theme === 'dark' ? 'dark' : 'light'}`
        );
        
        // Update CodeMirror's theme
        editorViewRef.current.dispatch({
          effects: themeCompartment.reconfigure(themeExtension)
        });
        
        console.log(`Applied editor theme: ${editorThemeName} in ${theme} mode`);
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    }
  }, [theme, themeCompartment, mounted, editorThemeName]);

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
        
        // Set mode on the editor element for CSS targeting
        const editorElement = editorViewRef.current.dom;
        if (editorElement) {
          editorElement.setAttribute('data-markdown-mode', mode);
          
          // Also update root elements with the mode for global styling
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-markdown-mode', mode);
            
            // Add class for better CSS targeting
            if (mode === 'preview') {
              document.documentElement.classList.add('markdown-preview-mode');
              document.documentElement.classList.remove('markdown-live-mode');
            } else {
              document.documentElement.classList.add('markdown-live-mode');
              document.documentElement.classList.remove('markdown-preview-mode');
            }
          }
        }
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
        const safeInitialValue = sanitizeInitialValue(initialValue);
        
        // Only update if content is different
        if (currentContent !== safeInitialValue) {
          // Store the current selection
          const prevSelection = editorViewRef.current.state.selection;
          
          const transaction = editorViewRef.current.state.update({
            changes: { from: 0, to: editorViewRef.current.state.doc.length, insert: safeInitialValue },
            selection: prevSelection, // Keep cursor position
          });
          
          editorViewRef.current.dispatch(transaction);
        }
      } catch (error) {
        console.error("Error updating editor content:", error);
      }
    }
  }, [initialValue, mounted]);
  
  // If there was an initialization error, render a fallback
  if (initializationError) {
    return (
      <div className="obsidian-editor-error">
        <p>Error initializing editor: {initializationError.message}</p>
        <textarea 
          defaultValue={initialValue}
          onChange={(e) => onChangeRef.current?.(e.target.value)}
          readOnly={readOnly}
          className="obsidian-editor-fallback"
        />
      </div>
    );
  }
  
  return <div ref={editorRef} className="obsidian-editor-core" />;
};

export default EditorCore; 