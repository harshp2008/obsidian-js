import React, { useState } from 'react';
import { Editor } from './Editor';
import { ThemeToggle } from './ThemeToggle';
import { GraphView } from './GraphView';
import '../styles/ObsidianLayout.css'; // We'll create this file next
import { EditorView } from '@codemirror/view';

interface ObsidianLayoutProps {
  initialContent?: string;
  children?: React.ReactNode;
  onEditorViewReady?: (view: EditorView) => void;
}

export function ObsidianLayout({ initialContent = '', children, onEditorViewReady }: ObsidianLayoutProps) {
  const [activeNote, setActiveNote] = useState('Chemistry IA version 2');
  const [showBacklinks, setShowBacklinks] = useState(true);
  const [activeView, setActiveView] = useState<'editor' | 'graph'>('editor');
  
  // Sample data for the file tree
  const sidebarData = [
    { 
      name: 'Quick Reference', 
      type: 'folder', 
      isOpen: false, 
      items: [] 
    },
    { 
      name: 'Excalidraw', 
      type: 'folder', 
      isOpen: true, 
      items: [
        { name: 'Drawing 2024-12-01 16.54.20.excalidraw', type: 'file' }
      ] 
    },
    { 
      name: 'French', 
      type: 'folder', 
      isOpen: false, 
      items: [] 
    },
    { 
      name: 'IAs', 
      type: 'folder',
      isOpen: true,
      items: [
        { name: 'Chem IA', type: 'file' },
        { name: 'Chem IA (CRISIS) 1', type: 'file' },
        { name: 'Chem IA (CRISIS) 2', type: 'file' },
        { name: 'Chemistry IA', type: 'file' },
        { name: 'Chemistry IA final draft', type: 'file' },
        { name: 'Chemistry IA version 2', type: 'file', active: true },
        { name: 'Chemistry IA version 3', type: 'file' },
        { name: 'Co(H20)6 structure', type: 'file', tag: 'PNG' },
        { name: 'coluor_reaction', type: 'file', tag: 'PNG' },
        { name: 'Structure', type: 'file', tag: 'PNG' },
      ]
    },
    { 
      name: 'Physics', 
      type: 'folder', 
      isOpen: false, 
      items: [] 
    }
  ];

  return (
    <div className="obsidian-layout">
      {/* Left sidebar */}
      <div className="obsidian-sidebar">
        <div className="sidebar-icons">
          <button className="sidebar-icon"><i>📋</i></button>
          <button className="sidebar-icon"><i>🔍</i></button>
          <button className="sidebar-icon"><i>📂</i></button>
          <button 
            className={`sidebar-icon ${activeView === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveView(activeView === 'graph' ? 'editor' : 'graph')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="12" r="3"></circle>
              <line x1="8.7" y1="7.4" x2="15.3" y2="10.6"></line>
              <line x1="8.7" y1="16.6" x2="15.3" y2="13.4"></line>
            </svg>
          </button>
          <button className="sidebar-icon"><i>⚙️</i></button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>Notes</h2>
          </div>
          <div className="file-tree">
            {sidebarData.map((item, index) => (
              <div key={index} className="file-tree-item">
                <div className={`folder ${item.isOpen ? 'open' : ''}`}>
                  <span className="folder-name">
                    <span className="arrow">{item.isOpen ? '▼' : '►'}</span>
                    {item.name}
                  </span>
                </div>
                
                {item.isOpen && item.items && (
                  <div className="folder-items">
                    {item.items.map((subItem, subIndex) => (
                      <div 
                        key={subIndex} 
                        className={`file ${subItem.active ? 'active' : ''}`}
                        onClick={() => {
                          setActiveNote(subItem.name);
                          setActiveView('editor'); // Switch to editor view when selecting a note
                        }}
                      >
                        {subItem.name}
                        {subItem.tag && <span className="file-tag">{subItem.tag}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="obsidian-content">
        <div className="content-header">
          <div className="breadcrumbs">
            <span>IAs</span> &gt; <span>{activeNote}</span>
          </div>
          
          <div className="header-actions">
            <button className="action-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </div>
        
        <div className="content-main">
          {activeView === 'editor' ? (
            <Editor 
              initialValue={initialContent || 
`# ${activeNote}

Investigating and modeling the effects that varying temperatures  can have the equilibrium constant

## Research Question : What is the effect of temperature on the equilibrium constant of the reaction Fe^3+_{(aq)} + SCN^-_{(aq)} ⇌ FeSCN^{2+}_{(aq)}.

## Background

`}
              onChange={(content) => console.log('Content changed:', content.length)}
              onEditorViewReady={onEditorViewReady}
            />
          ) : (
            <div className="graph-container">
              <GraphView activeNode={activeNote} />
            </div>
          )}
          
          {children}
        </div>
      </div>
      
      {/* Right sidebar for backlinks */}
      {showBacklinks && (
        <div className="obsidian-backlinks">
          <div className="backlinks-header">
            <h3>Linked mentions</h3>
            <span className="mention-count">0</span>
            <button className="close-backlinks" onClick={() => setShowBacklinks(false)}>×</button>
          </div>
          <div className="backlinks-content">
            <p className="no-backlinks">No backlinks found.</p>
          </div>
        </div>
      )}
    </div>
  );
} 