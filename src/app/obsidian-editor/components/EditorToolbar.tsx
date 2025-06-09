'use client';

import React from 'react';
import { EditorView } from '@codemirror/view';
import { EditorSelection, Transaction } from '@codemirror/state';
import { toggleBold, toggleItalic, toggleHeading, createLink } from '../utils/formatting/markdownFormatting';
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
        {/* Basic formatting */}
        <button 
          onClick={() => applyFormatting(toggleBold)}
          className="format-button"
          aria-label="Bold"
          title="Bold (Ctrl+B)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </button>

        <button 
          onClick={() => applyFormatting(toggleItalic)}
          className="format-button"
          aria-label="Italic"
          title="Italic (Ctrl+I)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </button>

        {/* Link button */}
        <button 
          onClick={() => applyFormatting(createLink)}
          className="format-button"
          aria-label="Link"
          title="Insert link (Ctrl+K)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </button>

        {/* Divider */}
        <div className="format-divider"></div>

        {/* Headings */}
        <button 
          onClick={() => applyFormatting((sel, doc) => toggleHeading(sel, doc, 1))}
          className="format-button"
          aria-label="Heading 1"
          title="Heading 1 (Ctrl+1)"
        >
          <span className="heading-btn">H1</span>
        </button>
        
        <button 
          onClick={() => applyFormatting((sel, doc) => toggleHeading(sel, doc, 2))}
          className="format-button"
          aria-label="Heading 2"
          title="Heading 2 (Ctrl+2)"
        >
          <span className="heading-btn">H2</span>
        </button>
        
        <button 
          onClick={() => applyFormatting((sel, doc) => toggleHeading(sel, doc, 3))}
          className="format-button"
          aria-label="Heading 3"
          title="Heading 3 (Ctrl+3)"
        >
          <span className="heading-btn">H3</span>
        </button>
      </div>
      
      <div className="toolbar-right">
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button 
            className={`mode-button ${mode === 'live' ? 'active' : ''}`}
            onClick={() => onModeChange('live')}
            aria-pressed={mode === 'live'}
            aria-label="Edit mode"
            title="Edit mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          
          <button 
            className={`mode-button ${mode === 'preview' ? 'active' : ''}`}
            onClick={() => onModeChange('preview')}
            aria-pressed={mode === 'preview'}
            aria-label="Preview mode"
            title="Preview mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
        
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
          gap: 8px;
        }
        
        .format-divider {
          width: 1px;
          height: 22px;
          background-color: var(--hr-color, #dcddde);
          margin: 0 4px;
        }
        
        .mode-toggle {
          display: flex;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--hr-color, #dcddde);
        }
        
        .mode-button {
          padding: 4px 8px;
          border: none;
          background: var(--background, #ffffff);
          color: var(--text-normal, #2e3338);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mode-button.active {
          background: var(--interactive-accent, #7b6cd9);
          color: white;
        }
        
        .format-button {
          min-width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 4px;
          background: transparent;
          color: var(--text-normal, #2e3338);
          cursor: pointer;
          transition: all 0.2s;
          padding: 0 6px;
        }
        
        .format-button:hover {
          background: var(--background-modifier-hover, #e9e9e9);
          border-color: var(--hr-color, #dcddde);
        }
        
        .heading-btn {
          font-weight: 600;
          font-family: var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        }
        
        .dark .mode-button {
          background: var(--background, #2b2b2b);
          color: var(--text-normal, #dcddde);
        }
        
        .dark .format-button {
          color: var(--text-normal, #dcddde);
        }
        
        .dark .format-button:hover {
          background: var(--background-modifier-hover, #353535);
          border-color: var(--hr-color, #444444);
        }
        `}
      </style>
    </div>
  );
};

export default EditorToolbar; 