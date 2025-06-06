'use client';

import React from 'react';
import { EditorView } from '@codemirror/view';
import { EditorSelection, Transaction } from '@codemirror/state';
import { toggleBold, toggleItalic, toggleHeading } from '../utils/formatting/markdownFormatting';

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
}

/**
 * Toolbar component for the markdown editor
 * Provides formatting buttons and view mode toggle
 * 
 * @param props - Component props
 * @returns React component
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editorView,
  mode,
  onModeChange
}) => {
  /**
   * Applies a formatting function to the current selection
   * 
   * @param formatter - The formatting function to apply
   */
  const applyFormatting = (
    formatter: (
      selection: EditorSelection, 
      doc: string
    ) => { changes: {from: number, to: number, insert: string}[], selection?: EditorSelection }
  ) => {
    if (!editorView) return;
    
    const { state, dispatch } = editorView;
    const changes = formatter(state.selection, state.doc.toString());
    
    if (changes) {
      dispatch({
        changes: changes.changes,
        selection: changes.selection || state.selection,
        scrollIntoView: true
      });
      editorView.focus();
    }
  };

  return (
    <div className="obsidian-editor-toolbar">
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button 
          className={`mode-button ${mode === 'live' ? 'active' : ''}`}
          onClick={() => onModeChange('live')}
          aria-pressed={mode === 'live'}
          aria-label="Edit mode"
          title="Edit mode"
        >
          Edit
        </button>
        <button 
          className={`mode-button ${mode === 'preview' ? 'active' : ''}`}
          onClick={() => onModeChange('preview')}
          aria-pressed={mode === 'preview'}
          aria-label="Preview mode"
          title="Preview mode"
        >
          Preview
        </button>
      </div>
      
      {/* Format Buttons (only shown in edit mode) */}
      {mode === 'live' && (
        <div className="format-buttons">
          <button 
            onClick={() => applyFormatting(toggleBold)}
            className="format-button"
            aria-label="Bold"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button 
            onClick={() => applyFormatting(toggleItalic)}
            className="format-button"
            aria-label="Italic"
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button 
            onClick={() => applyFormatting((sel, doc) => toggleHeading(sel, doc, 1))}
            className="format-button"
            aria-label="Heading 1"
            title="Heading 1 (Ctrl+1)"
          >
            H1
          </button>
          <button 
            onClick={() => applyFormatting((sel, doc) => toggleHeading(sel, doc, 2))}
            className="format-button"
            aria-label="Heading 2"
            title="Heading 2 (Ctrl+2)"
          >
            H2
          </button>
          <button 
            onClick={() => applyFormatting((sel, doc) => toggleHeading(sel, doc, 3))}
            className="format-button"
            aria-label="Heading 3"
            title="Heading 3 (Ctrl+3)"
          >
            H3
          </button>
        </div>
      )}
    </div>
  );
};

export default EditorToolbar; 