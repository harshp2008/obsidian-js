import type { EditorView } from '@codemirror/view';

/**
 * Initialize the Obsidian-js plugin system with the editor view
 * This keeps plugin system separate from the core editor
 */
export async function initializePlugins(view?: EditorView): Promise<void> {
  try {
    // If no view is provided, try to get it from the window
    const editorView = view || (typeof window !== 'undefined' ? (window as any).__obsidianEditorView : null);
    
    if (!editorView) {
      console.warn('Editor view not available. Cannot initialize plugins.');
      return;
    }
    
    // Dynamically import the plugin API to ensure it's only loaded when needed
    const { pluginManager, setupExamplePlugins } = await import('../../../src/app/obsidian-editor/extensions/plugin-api');
    
    // Initialize the plugin manager with the editor view
    pluginManager.initialize(editorView);
    console.log('Plugin manager initialized with editor view');
    
    // Load plugins without enabling them
    await setupExamplePlugins(true);
    console.log('Example plugins loaded (not enabled)');
    
    // Make the plugin manager available globally for the demo
    if (typeof window !== 'undefined') {
      (window as any).obsidianJS = {
        pluginManager,
        enableAllPlugins: () => {
          // Helper function to enable all available plugins
          const plugins = pluginManager.getAllPlugins();
          return Promise.all(plugins.map(plugin => 
            pluginManager.enablePlugin(plugin.manifest.id)
          ));
        }
      };
    }
    
    return;
  } catch (error) {
    console.error('Failed to initialize plugins:', error);
  }
}

/**
 * Enable all available plugins or specific plugins by ID
 * @param pluginIds - Optional array of plugin IDs to enable, if not provided all plugins are enabled
 */
export async function enablePlugins(pluginIds?: string[]): Promise<void> {
  try {
    if (!window.obsidianJS) {
      console.warn('Plugin system not initialized. Call initializePlugins first.');
      return;
    }
    
    const { pluginManager } = window.obsidianJS;
    
    if (pluginIds && Array.isArray(pluginIds)) {
      // Enable specific plugins
      for (const id of pluginIds) {
        try {
          await pluginManager.enablePlugin(id);
          console.log(`Enabled plugin: ${id}`);
        } catch (error) {
          console.error(`Failed to enable plugin ${id}:`, error);
        }
      }
    } else {
      // Enable all available plugins
      const plugins = pluginManager.getAllPlugins();
      console.log(`Enabling ${plugins.length} plugins...`);
      
      for (const plugin of plugins) {
        try {
          await pluginManager.enablePlugin(plugin.manifest.id);
          console.log(`Enabled plugin: ${plugin.manifest.id}`);
        } catch (error) {
          console.error(`Failed to enable plugin ${plugin.manifest.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error enabling plugins:', error);
  }
}

// Add typings for global window object
declare global {
  interface Window {
    obsidianJS?: {
      pluginManager: any;
      enableAllPlugins: () => Promise<any[]>;
    };
    __obsidianEditorView?: EditorView;
  }
} 