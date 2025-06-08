'use client';

import React from 'react';
import { EditorView } from '@codemirror/view';
import { EditorSelection, Transaction } from '@codemirror/state';
import { toggleBold, toggleItalic, toggleHeading } from '../utils/formatting/markdownFormatting';
import ThemeSwitcher from './ThemeSwitcher';
import { EditorThemeName } from '../utils/theme';

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
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editorView,
  mode,
  onModeChange,
  onThemeChange
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
      <div className="toolbar-left">
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
      
      <div className="toolbar-right">
        {/* Theme Switcher */}
        <ThemeSwitcher onThemeChange={onThemeChange} />
      </div>
      
      <style>
        {`
        .obsidian-editor-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: var(--background-secondary, #f8f8f8);
          border-bottom: 1px solid var(--hr-color, #dcddde);
        }
        
        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .mode-toggle {
          display: flex;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--hr-color, #dcddde);
        }
        
        .mode-button {
          padding: 4px 12px;
          border: none;
          background: var(--background-primary, #ffffff);
          color: var(--text-normal, #2e3338);
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .mode-button.active {
          background: var(--interactive-accent, #7b6cd9);
          color: white;
        }
        
        .format-buttons {
          display: flex;
          gap: 4px;
        }
        
        .format-button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--hr-color, #dcddde);
          border-radius: 4px;
          background: var(--background-primary, #ffffff);
          color: var(--text-normal, #2e3338);
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .format-button:hover {
          background: var(--interactive-hover, #e9e9e9);
        }
        
        .dark .mode-button {
          background: var(--background-primary, #2b2b2b);
          color: var(--text-normal, #dcddde);
        }
        
        .dark .format-button {
          background: var(--background-primary, #2b2b2b);
          color: var(--text-normal, #dcddde);
          border-color: var(--hr-color, #444444);
        }
        
        .dark .format-button:hover {
          background: var(--interactive-hover, #4a4a4a);
        }
        `}
      </style>
    </div>
  );
};

export default EditorToolbar; 