import type { EditorView } from '@codemirror/view';
import { pluginRegistry } from '../plugins';

/**
 * Initialize the Obsidian-js plugin system with the editor view
 * This keeps plugin system separate from the core editor
 */
export async function initializePlugins(view?: EditorView): Promise<void> {
  try {
    // Check if already initialized to prevent duplicate initialization
    if (typeof window !== 'undefined' && window.demoPluginsInitialized) {
      console.log('Plugin system already initialized, skipping initialization');
      return;
    }
    
    // If no view is provided, try to get it from the window
    const editorView = view || (typeof window !== 'undefined' ? (window as any).__obsidianEditorView : null);
    
    if (!editorView) {
      console.warn('Editor view not available. Cannot initialize plugins. Will retry in 1 second.');
      
      // Return a promise that resolves when the editor view becomes available or times out
      return new Promise((resolve, reject) => {
        let retryAttempts = 0;
        const maxRetries = 5;
        
        const checkForEditorView = () => {
          const view = (typeof window !== 'undefined') ? (window as any).__obsidianEditorView : null;
          
          if (view) {
            // Editor view is now available
            console.log('Editor view found after retrying. Initializing plugins...');
            initializePlugins(view).then(resolve).catch(reject);
          } else if (retryAttempts < maxRetries) {
            // Try again after a short delay
            retryAttempts++;
            console.log(`Retry attempt ${retryAttempts} of ${maxRetries}...`);
            setTimeout(checkForEditorView, 1000);
          } else {
            // Give up after max retries
            reject(new Error('Editor view not available after maximum retries. Cannot initialize plugins.'));
          }
        };
        
        // Start checking
        setTimeout(checkForEditorView, 1000);
      });
    }
    
    console.log('Initializing plugins with editor view:', editorView);
    
    // Dynamically import the plugin API to ensure it's only loaded when needed
    const { pluginManager } = await import('../../../src/app/obsidian-editor/extensions/plugin-api');
    
    // Initialize the plugin manager with the editor view
    pluginManager.initialize(editorView);
    console.log('Plugin manager initialized with editor view');
    
    // Check if plugins are already loaded
    const existingPlugins = pluginManager.getAllPlugins();
    if (existingPlugins.length > 0) {
      console.log(`${existingPlugins.length} plugins already loaded. Skipping plugin loading.`);
      
      // Make the plugin manager available globally for the demo if not already set
      if (typeof window !== 'undefined' && !window.obsidianJS) {
        window.obsidianJS = {
          pluginManager,
          pluginRegistry,
          enableAllPlugins: () => {
            const loadedPlugins = pluginManager.getAllPlugins();
            return Promise.all(loadedPlugins.map(plugin => 
              pluginManager.enablePlugin(plugin.manifest.id)
            ));
          }
        };
      }
      
      // Mark as initialized
      if (typeof window !== 'undefined') {
        window.demoPluginsInitialized = true;
      }
      
      return;
    }
    
    // Load plugins from the registry
    const plugins = pluginRegistry.createAllPlugins();
    console.log(`Loading ${plugins.length} plugins from registry...`);
    
    // Load each plugin into the pluginManager
    for (const plugin of plugins) {
      try {
        // Check if plugin is already loaded
        const existing = pluginManager.getPlugin(plugin.manifest.id);
        if (existing) {
          console.log(`Plugin ${plugin.manifest.id} is already loaded, skipping`);
          continue;
        }
        
        await pluginManager.loadPlugin(plugin);
        console.log(`Loaded plugin: ${plugin.manifest.name}`);
      } catch (error) {
        console.error(`Failed to load plugin ${plugin.manifest.id}:`, error);
      }
    }
    
    // Make the plugin manager available globally for the demo
    if (typeof window !== 'undefined') {
      window.obsidianJS = {
        pluginManager,
        pluginRegistry,
        enableAllPlugins: () => {
          // Helper function to enable all available plugins
          const loadedPlugins = pluginManager.getAllPlugins();
          return Promise.all(loadedPlugins.map(plugin => 
            pluginManager.enablePlugin(plugin.manifest.id)
          ));
        }
      };
      
      // Mark the demo plugins as initialized to avoid duplicate initialization
      window.demoPluginsInitialized = true;
      
      // Dispatch ready event
      const readyEvent = new CustomEvent('obsidian-ready');
      window.dispatchEvent(readyEvent);
      
      console.log('Demo plugin system fully initialized');
    }
    
    return;
  } catch (error) {
    console.error('Failed to initialize plugins:', error);
    throw error;
  }
}

/**
 * Enable all available plugins or specific plugins by ID
 * @param pluginIds - Optional array of plugin IDs to enable, if not provided all plugins are enabled
 */
export async function enablePlugins(pluginIds?: string[]): Promise<void> {
  try {
    console.log('Starting enablePlugins with:', pluginIds);
    
    // Make sure plugins are initialized
    if (!window.obsidianJS) {
      console.error('Plugin system not initialized. Window.obsidianJS is:', window.obsidianJS);
      
      // Try to initialize plugins first
      try {
        console.log('Attempting to initialize plugins before enabling them...');
        await initializePlugins();
      } catch (initError) {
        console.error('Failed to initialize plugins:', initError);
        alert('Plugin system not initialized and initialization failed. Please refresh the page and try again.');
        return;
      }
      
      // Check again after initialization attempt
      if (!window.obsidianJS) {
        alert('Plugin system not initialized. Please refresh the page and try again.');
        return;
      }
    }
    
    const { pluginManager } = window.obsidianJS;
    const allPlugins = pluginManager.getAllPlugins();
    console.log('Current plugins loaded:', allPlugins.map(p => `${p.manifest.id} (${p.enabled ? 'enabled' : 'disabled'})`));
    
    // Get plugin IDs to enable
    let pluginsToEnable: string[];
    if (pluginIds && Array.isArray(pluginIds)) {
      pluginsToEnable = pluginIds;
    } else {
      // If no specific IDs provided, enable all loaded plugins
      pluginsToEnable = allPlugins.map(p => p.manifest.id);
    }
    console.log('Plugins to enable:', pluginsToEnable);
    
    // Enable plugins one by one with detailed logging
    for (const id of pluginsToEnable) {
      try {
        // Check if already enabled
        if (pluginManager.isPluginEnabled(id)) {
          console.log(`Plugin ${id} is already enabled, skipping`);
          continue;
        }
        
        console.log(`Attempting to enable plugin ${id}...`);
        const plugin = pluginManager.getPlugin(id);
        
        if (!plugin) {
          console.error(`Plugin ${id} not found!`);
          continue;
        }
        
        console.log(`Found plugin ${id}:`, plugin.manifest);
        const isEnabled = await pluginManager.enablePlugin(id);
        console.log(`Plugin ${id} enable result:`, isEnabled);
        
        // Verify plugin is actually enabled
        const isReallyEnabled = pluginManager.isPluginEnabled(id);
        console.log(`Plugin ${id} enabled status after enablePlugin call:`, isReallyEnabled);
        
        // Call window.debugPluginSystem() to show plugin state
        if (window.debugPluginSystem) {
          console.log('Plugin system state after enabling plugin:');
          window.debugPluginSystem();
        }
      } catch (error) {
        console.error(`Failed to enable plugin ${id}:`, error);
        alert(`Failed to enable plugin ${id}: ${error.message || 'Unknown error'}`);
      }
    }
    
    // Final check to see if all plugins were enabled
    console.log('Final plugin status after enabling:',
      pluginsToEnable.map(id => `${id}: ${pluginManager.isPluginEnabled(id) ? 'enabled' : 'disabled'}`));
  } catch (error) {
    console.error('Error enabling plugins:', error);
    alert(`Error enabling plugins: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Debug the plugin system and check for issues
 */
export function debugPluginSystem(): void {
  try {
    console.log('=== PLUGIN SYSTEM DEBUG ===');
    
    // Check if window.obsidianJS exists
    if (!window.obsidianJS) {
      console.error('Plugin system not initialized. window.obsidianJS is undefined!');
      return;
    }
    
    const { pluginManager, pluginRegistry } = window.obsidianJS;
    
    // Check if editor view is available
    console.log('Editor view available:', !!window.__obsidianEditorView);
    
    // Log plugin manager details
    console.log('Plugin manager initialized:', !!pluginManager);
    
    if (pluginManager) {
      const plugins = pluginManager.getAllPlugins();
      console.log('Loaded plugins:', plugins.length);
      plugins.forEach(plugin => {
        console.log(`- ${plugin.manifest.id} (${plugin.enabled ? 'enabled' : 'disabled'})`);
      });
    }
    
    // Check if there are any fatal errors preventing plugins from loading
    console.log('Plugin registry available:', !!pluginRegistry);
    
    // Check if the register function is available
    if (pluginRegistry && typeof pluginRegistry.registerPluginFactory === 'function') {
      console.log('Plugin registry functions correctly initialized');
    } else {
      console.error('Plugin registry methods not properly initialized!');
    }
    
    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error('Error during plugin system debugging:', error);
  }
}

// Expose the debug function on window for console access
if (typeof window !== 'undefined') {
  window.debugPluginSystem = debugPluginSystem;
}

// Add typings for global window object
declare global {
  interface Window {
    obsidianJS?: {
      pluginManager: any;
      pluginRegistry: any;
      enableAllPlugins: () => Promise<any[]>;
    };
    demoPluginsInitialized?: boolean;
    __obsidianEditorView?: EditorView;
    debugPluginSystem?: () => void;
  }
} 