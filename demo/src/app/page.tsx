'use client';

import React, { useState, useCallback, useEffect } from 'react';
// Import directly from source files
import CodeMirrorEditor from '../../../src/app/obsidian-editor/CodeMirrorEditor';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import debounce from 'lodash/debounce';
import { initializePlugins, enablePlugins } from '../utils/pluginInitializer';

import defaultContent from './defaultText [main].md';

/**
 * Demo page for the CodeMirror-based Markdown editor.
 * It showcases the editor's functionality, including theme toggling and content handling.
 *
 * @returns {JSX.Element} The CodeMirror demo page component.
 */
export default function CodeMirrorDemoPage() {
  const [content, setContent] = useState(defaultContent);
  const [pluginsEnabled, setPluginsEnabled] = useState(false);
  
  /**
   * Debounced content change handler to avoid too frequent state updates
   */
  const handleContentChange = useCallback(
    debounce((newContent: string) => {
      setContent(newContent);
    }, 500),
    []
  );
  
  /**
   * Handles the save action triggered from the editor (e.g., Ctrl+S).
   * Logs the current content to the console and shows an alert.
   */
  const handleSave = () => {
    console.log('Content saved:', content);
    alert('Content saved to console!');
  };
  
  // Initialize plugin system when the component mounts
  useEffect(() => {
    // Initialize plugins after a short delay to ensure editor is ready
    const initTimer = setTimeout(async () => {
      try {
        await initializePlugins();
        console.log('Plugin system initialized');
      } catch (error) {
        console.error('Failed to initialize plugin system:', error);
      }
    }, 1000);
    
    return () => clearTimeout(initTimer);
  }, []);
  
  // Toggle plugins when the toggle button is clicked
  const togglePlugins = async () => {
    try {
      if (!pluginsEnabled) {
        // Enable both example plugins
        await enablePlugins(['example-plugin', 'word-count']);
        setPluginsEnabled(true);
      } else {
        // Disable plugins by reloading the page (for demo simplicity)
        window.location.reload();
      }
    } catch (error) {
      console.error('Error toggling plugins:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Obsidian-JS Markdown Editor Demo</h1>
          <div className="flex gap-4 items-center">
            <button 
              onClick={togglePlugins}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                pluginsEnabled 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {pluginsEnabled ? 'Disable Plugins' : 'Enable Plugins'}
            </button>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-col space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            This editor uses CodeMirror 6 to provide an Obsidian-like editing experience with visible markdown syntax.
          </p>
          
          <div className="h-[600px] border rounded-md">
            <CodeMirrorEditor 
              initialValue={content}
              readOnly={false}
              onChange={handleContentChange}
              onSave={handleSave}
            />
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Features</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Markdown syntax highlighting with Obsidian-like appearance</li>
              <li>Syntax modes: visible markdown or wysiwyg preview</li>
              <li>Keyboard shortcuts for common formatting operations</li>
              <li>Theme support (light/dark mode)</li>
              <li>File system integration capabilities</li>
              <li>Plugin system with example plugins (click "Enable Plugins" above to activate)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 