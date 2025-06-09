import { pluginManager } from './PluginManager';

/**
 * This is a compatibility layer for the demo app plugins.
 * For real applications, you should create your own plugin registry
 * and initialization similar to what's in the demo/src/plugins directory.
 * 
 * @deprecated Use your own plugin registry instead
 * @param enableAll Whether to enable all plugins automatically
 */
export async function setupExamplePlugins(enableAll = false): Promise<void> {
  try {
    console.warn(
      'setupExamplePlugins() is deprecated. ' +
      'In a real application, you should create your own plugin registry ' +
      'similar to what is in the demo/src/plugins directory.'
    );
    
    // Check if we're in the demo app with the new plugin system
    if (typeof window !== 'undefined' && (window as any).demoPluginsInitialized) {
      console.log('Using demo app plugin system');
      return;
    }

    // Only initialize plugins if not already initialized
    const isInitialized = typeof window !== 'undefined' && (window as any).obsidianJS;
    if (isInitialized) {
      console.log('Obsidian-js plugins already initialized.');
      return;
    }
    
    // In a standalone environment, just make the plugin manager available
    if (typeof window !== 'undefined') {
      (window as any).obsidianJS = {
        pluginManager,
        plugins: {}
      };
      
      // Notify that the basic plugin system is ready
      const readyEvent = new CustomEvent('obsidian-ready');
      window.dispatchEvent(readyEvent);
      
      console.log('Basic plugin system initialized (no plugins loaded)');
    }
  } catch (error) {
    console.error('Error setting up example plugins:', error);
  }
} 