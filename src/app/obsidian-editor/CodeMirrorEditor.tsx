'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Extension, Compartment } from '@codemirror/state';
import { EditorView, keymap, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
// Import our enhanced markdown syntax plugin factory
import { createMarkdownSyntaxPlugin, setMarkdownSyntaxMode } from './extensions/markdown-syntax/index';
import { markdownPasteHandler } from './extensions/MarkdownPasteHandler';
// Import our custom styles
import './CodeMirrorEditor.css';
// Import atomic indents extension
import { atomicIndents } from './extensions/AtomicIndents';


// Import our formatting functions
import { 
  insertBold, 
  insertItalic, 
  insertHeading, 
  insertCode, 
  insertLink,
  insertList,
  indentText,
  unindentText,
  handleBackspaceIndent
} from './utils/FormattingFunctions';


interface CodeMirrorEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  editable?: boolean;
}

// Light theme configuration for CodeMirror
const lightTheme = EditorView.theme({
  '&': { color: '#1a1a1a', backgroundColor: '#ffffff' },
  '.cm-content': { caretColor: '#000000' },
  '.cm-gutters': { backgroundColor: '#f8f9fa', color: '#6c757d', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  '.cm-selectionBackground': { backgroundColor: '#b3d7ff' },
  '.cm-line': { padding: '0 4px' },
  '.cm-cursor': { borderLeftWidth: '2px', borderLeftColor: '#3b82f6' },
}, { dark: false });

// Dark theme configuration for CodeMirror
const darkTheme = EditorView.theme({
  '&': { color: '#e0e0e0', backgroundColor: '#1e1e1e' }, // Slightly different dark background
  '.cm-content': { caretColor: '#ffffff' },
  '.cm-gutters': { backgroundColor: '#252525', color: '#858585', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  '.cm-selectionBackground': { backgroundColor: '#3a4b6d' },
  '.cm-line': { padding: '0 4px' },
  '.cm-cursor': { borderLeftWidth: '2px', borderLeftColor: '#3b82f6' },
}, { dark: true });

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  content,
  onChange,
  onSave,
  editable = true,
}) => {
  const themeCompartment = useRef(new Compartment()).current;

  const getCurrentDocumentTheme = () => {
    if (typeof window === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  };
  const onSaveRef = useRef(onSave);
  const onChangeRef = useRef(onChange); // Added for consistency, though onChange was already out of main deps
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [currentMode, setCurrentMode] = useState<'live' | 'preview'>('live');
  const editableCompartment = useRef(new Compartment()).current;

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Effect to update CodeMirror theme when document theme changes
  useEffect(() => {
    if (!editorView) return;

    const currentDocTheme = getCurrentDocumentTheme();
    editorView.dispatch({
      effects: themeCompartment.reconfigure(currentDocTheme === 'dark' ? darkTheme : lightTheme)
    });

    const observer = new MutationObserver(() => {
      const newDocTheme = getCurrentDocumentTheme();
      editorView.dispatch({
        effects: themeCompartment.reconfigure(newDocTheme === 'dark' ? darkTheme : lightTheme)
      });
    });

    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      observer.disconnect();
    };
  }, [editorView, themeCompartment]);

  // Initialize the editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Define a custom highlight style
    const customHighlightStyle = HighlightStyle.define([
      { tag: tags.heading1, fontSize: '1.6em', fontWeight: 'bold' },
      { tag: tags.heading2, fontSize: '1.4em', fontWeight: 'bold' },
      { tag: tags.heading3, fontSize: '1.2em', fontWeight: 'bold' },
      { tag: tags.heading4, fontSize: '1.1em', fontWeight: 'bold' },
      { tag: tags.heading5, fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' },
      { tag: tags.heading6, fontSize: '1.1em', fontWeight: 'bold', fontStyle: 'italic' },
      { tag: tags.strong, fontWeight: 'bold' },
      { tag: tags.emphasis, fontStyle: 'italic' },
      { tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
      { tag: tags.monospace, fontFamily: 'monospace', fontSize: '0.9em', color: '#10b981' },
    ]);

    // Create the editor extensions
    const initialDocTheme = getCurrentDocumentTheme();
    const extensions: Extension[] = [
      themeCompartment.of(initialDocTheme === 'dark' ? darkTheme : lightTheme),
      history(),
      atomicIndents, // Add atomic indents extension
      markdown({ 
        base: markdownLanguage, 
        codeLanguages: languages,
        addKeymap: true,
        
      }),
      createMarkdownSyntaxPlugin(), // Now returns the StateField directly
      markdownPasteHandler,
      highlightActiveLine(),
      highlightActiveLineGutter(),
      syntaxHighlighting(customHighlightStyle),
      EditorView.lineWrapping, // Added for text wrapping
      keymap.of([
        {
          key: 'Backspace',
          run: (view) => {
            return handleBackspaceIndent(view);
          }
        },
        ...defaultKeymap,
        ...historyKeymap,
        {
          key: 'Tab',
          run: (view) => {
            indentText(view);
            return true;
          },
          shift: (view) => {
            unindentText(view);
            return true;
          }
        },

        {
          key: 'Ctrl-b',
          run: (view) => {
            insertBold(view);
            return true;
          },
        },
        {
          key: 'Ctrl-i',
          run: (view) => {
            insertItalic(view);
            return true;
          },
        },
        {
          key: 'Ctrl-1',
          run: (view) => {
            insertHeading(view, 1);
            return true;
          },
        },
        {
          key: 'Ctrl-2',
          run: (view) => {
            insertHeading(view, 2);
            return true;
          },
        },
        {
          key: 'Ctrl-3',
          run: (view) => {
            insertHeading(view, 3);
            return true;
          },
        },
        {
          key: 'Ctrl-`',
          run: (view) => {
            insertCode(view);
            return true;
          },
        },
        {
          key: 'Ctrl-k',
          run: (view) => {
            insertLink(view);
            return true;
          },
        },
        {
          key: 'Ctrl-s',
          run: () => {
            if (onSaveRef.current) onSaveRef.current();
            return true;
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (currentMode === 'live' && update.docChanged) {
          const doc = update.state.doc;
          const value = doc.toString();
          if (onChangeRef.current) {
            onChangeRef.current(value);
          }
        }
      }),
      editableCompartment.of(EditorView.editable.of(currentMode === 'live' && editable)), // Initial setup
      EditorView.theme({
        '&': {
          height: '100%',
        },
        '.cm-content': {
          padding: '1rem',
          fontFamily: 'Menlo, Monaco, Courier New, monospace',
          fontSize: '16px',
          lineHeight: '1.6',
        },
      }),
    ];

    // Create editor state
    const state = EditorState.create({
      doc: content,
      extensions,
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    setEditorView(view);

    // Dispatch initial mode effects once the view is created
    if (view) {
      view.dispatch({
        effects: [
          setMarkdownSyntaxMode.of(currentMode)
        ]
      });
    }

    // Cleanup
    return () => {
      view.destroy();
      setEditorView(null); // Clear the view instance on cleanup
    };
  }, [editable]); // currentMode removed to prevent re-initialization on mode switch

  // Update content when the prop changes
  useEffect(() => {
    if (!editorView) return;
    
    const currentContent = editorView.state.doc.toString();
    if (currentContent !== content) {
      const transaction = editorView.state.update({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content
        }
      });
      editorView.dispatch(transaction);
    }
  }, [content, editorView]);
  


  // Effect to handle currentMode and editable prop changes
  useEffect(() => {
    if (editorView) {
      // Dispatch effects to update markdown syntax mode
      editorView.dispatch({
        effects: [
          setMarkdownSyntaxMode.of(currentMode)
        ]
      });

      // Update the editable state of the editor using the compartment
      const isEditable = currentMode === 'live' && editable;
      // Ensure editableCompartment is correctly used here for reconfiguring
      // The initial setup of editableCompartment.of(EditorView.editable.of(...)) should be in the main extensions array.
      // Here, we only dispatch the reconfigure effect.
      if (editorView.state.facet(EditorView.editable) !== isEditable) {
         editorView.dispatch({
            effects: editableCompartment.reconfigure(EditorView.editable.of(isEditable))
         });
      }
    }
  }, [currentMode, editable, editorView, editableCompartment]); // Added editableCompartment to dependencies

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      <div className="p-2 border-b shrink-0 bg-slate-50 dark:bg-slate-800">
        <button 
          onClick={() => setCurrentMode(prev => prev === 'live' ? 'preview' : 'live')}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 text-sm transition-colors duration-150"
        >
          {currentMode === 'live' ? 'View Preview' : 'Edit Content'}
        </button>
      </div>

      {/* CodeMirror editor container - always rendered, behavior changes with currentMode */}
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
