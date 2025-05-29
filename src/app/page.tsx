'use client';

import React, { useState } from 'react';
import CodeMirrorEditor from './obsidian-editor/CodeMirrorEditor';
import { ThemeToggle } from '../components/ThemeToggle';



// Load the default content from the markdown file
import defaultContentString from './obsidian-editor/defaultText.md';

const initialContent = defaultContentString;

/**
 * The main demo page for the CodeMirror-based Markdown editor.
 * It showcases the editor's functionality, including theme toggling and content handling.
 *
 * @returns {JSX.Element} The CodeMirror demo page component.
 */
export default function CodeMirrorDemoPage() {
  const [content, setContent] = useState(initialContent);
  
  /**
   * Handles changes to the editor's content.
   * Updates the local state with the new content.
   *
   * @param {string} newContent - The new content from the editor.
   */
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };
  
  /**
   * Handles the save action triggered from the editor (e.g., Ctrl+S).
   * Logs the current content to the console and shows an alert.
   */
  const handleSave = () => {
    console.log('Content saved:', content);
    alert('Content saved to console!');
  };
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">CodeMirror Obsidian-like Markdown Editor</h1>
          <ThemeToggle />
        </header>
        <div className="flex flex-col space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            This editor uses CodeMirror 6 to provide an Obsidian-like editing experience with visible markdown syntax.
          </p>
          
          <div className="h-[600px] border rounded-md">
            <CodeMirrorEditor 
              content={content} 
              onChange={handleContentChange} 
              onSave={handleSave}
            />
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <h2 className="text-lg font-semibold mb-2">How It Works</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Markdown syntax is visible and highlighted with different colors</li>
              <li>The editor is split into two panes: editor and preview</li>
              <li>Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+S (save)</li>
              <li>All markdown syntax remains part of the editable content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
