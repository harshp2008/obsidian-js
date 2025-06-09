'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
// Import directly from source files
import { EditorView } from '@codemirror/view';
import debounce from 'lodash/debounce';
import { initializePlugins, enablePlugins, debugPluginSystem } from '../utils/pluginInitializer';
import { ObsidianLayout } from '../../../src/components/ObsidianLayout';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';

import defaultContent from './defaultText [main].md';

/**
 * Demo page for the Obsidian-like editor.
 */
export default function ObsidianDemoPage() {
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

  // Button text determined by client-side state
  const buttonText = isClient && pluginsEnabled ? 'Disable Plugins' : 'Enable Plugins';
  
  return (
    <div className="h-screen w-screen overflow-hidden">
      <style jsx global>{`
        html, body {
          height: 100%;
          overflow: hidden;
          padding: 0;
          margin: 0;
        }
        
        .enable-plugins-button {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 100;
          padding: 8px 16px;
          background-color: var(--background-secondary);
          border: 1px solid var(--hr-color);
          border-radius: 4px;
          color: var(--foreground);
          font-size: 14px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        
        .enable-plugins-button:hover {
          opacity: 1;
          background-color: var(--background-modifier-hover);
        }
      `}</style>
      
      <ThemeProvider>
        <button 
          onClick={togglePlugins}
          className="enable-plugins-button"
          disabled={isInitializing}
        >
          {isInitializing ? 'Initializing...' : buttonText}
        </button>
        
        <ObsidianLayout 
          initialContent={content}
          children={<></>}
          onEditorViewReady={handleEditorViewReady}
        />
      </ThemeProvider>
    </div>
  );
} 