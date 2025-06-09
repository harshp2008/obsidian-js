'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
// Import directly from source files
import CodeMirrorEditor from '../../../src/app/obsidian-editor/CodeMirrorEditor';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import debounce from 'lodash/debounce';
import { initializePlugins, enablePlugins, debugPluginSystem } from '../utils/pluginInitializer';
import { EditorView } from '@codemirror/view';

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
  const [isClient, setIsClient] = useState(false);
  const [pluginsInitialized, setPluginsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const editorViewRef = useRef<EditorView | null>(null);
  
  // Mark component as client-side rendered after mount
  useEffect(() => {
    setIsClient(true);
    
    // Check if plugins are already initialized
    if (typeof window !== 'undefined' && window.demoPluginsInitialized) {
      setPluginsInitialized(true);
      
      // Check if any plugins are already enabled
      if (window.obsidianJS) {
        const enabledPlugins = window.obsidianJS.pluginManager.getEnabledPlugins();
        if (enabledPlugins.length > 0) {
          setPluginsEnabled(true);
        }
      }
    }
    
    // Add event listener for plugin ready event
    const handlePluginReady = () => {
      console.log('Plugin system ready event received');
      setPluginsInitialized(true);
    };
    
    window.addEventListener('obsidian-ready', handlePluginReady);
    
    return () => {
      window.removeEventListener('obsidian-ready', handlePluginReady);
    };
  }, []);
  
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
  
  /**
   * Callback to get the editor view instance when it's created
   */
  const handleEditorViewReady = useCallback((view: EditorView) => {
    console.log('Editor view ready:', view);
    // Store the view in our ref
    editorViewRef.current = view;
    
    // Store it in the window for global access
    if (typeof window !== 'undefined') {
      window.__obsidianEditorView = view;
      
      // Initialize plugins if not already initialized
      if (!window.demoPluginsInitialized && !isInitializing) {
        setIsInitializing(true);
        
        initializePlugins(view).then(() => {
          console.log('Plugins initialized with editor view');
          setPluginsInitialized(true);
          setIsInitializing(false);
          // Debug the plugin system
          debugPluginSystem();
        }).catch(error => {
          console.error('Failed to initialize plugins:', error);
          setIsInitializing(false);
        });
      }
    }
  }, [isInitializing]);
  
  // Toggle plugins when the toggle button is clicked
  const togglePlugins = async () => {
    try {
      console.log('Toggle plugins clicked, current state:', { pluginsEnabled, pluginsInitialized, isInitializing });
      
      if (isInitializing) {
        alert('Plugin system is still initializing. Please wait a moment and try again.');
        return;
      }
      
      if (!editorViewRef.current) {
        alert('Editor not fully initialized. Please wait a moment and try again.');
        return;
      }
      
      if (!pluginsEnabled) {
        console.log('Enabling plugins...');
        // Make sure plugins are initialized
        if (!pluginsInitialized) {
          setIsInitializing(true);
          await initializePlugins(editorViewRef.current);
          setPluginsInitialized(true);
          setIsInitializing(false);
        }
        
        // Enable both example plugins
        console.log('About to call enablePlugins for example-plugin and word-count');
        await enablePlugins(['example-plugin', 'word-count']);
        console.log('Plugins enabled successfully');
        setPluginsEnabled(true);
      } else {
        // Disable plugins by reloading the page (for demo simplicity)
        window.location.reload();
      }
    } catch (error) {
      console.error('Error toggling plugins:', error);
      alert(`Error enabling plugins: ${error.message || 'Unknown error'}`);
    }
  };

  // Button text and style determined by client-side state
  const buttonText = isClient && pluginsEnabled ? 'Disable Plugins' : 'Enable Plugins';
  const buttonClass = `px-4 py-2 rounded-md text-sm font-medium ${
    isClient && pluginsEnabled 
      ? 'bg-red-600 hover:bg-red-700 text-white' 
      : 'bg-green-600 hover:bg-green-700 text-white'
  }`;
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Obsidian-JS Markdown Editor Demo</h1>
          <div className="flex gap-4 items-center">
            <button 
              onClick={togglePlugins}
              className={buttonClass}
              disabled={isInitializing}
            >
              {isInitializing ? 'Initializing...' : buttonText}
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
              onEditorViewReady={handleEditorViewReady}
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