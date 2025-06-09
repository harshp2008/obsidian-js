import { pluginManager } from './PluginManager';
import { createExamplePlugin } from './ExamplePlugin';
import { createWordCountPlugin } from './examples/WordCountPlugin';

/**
 * Setup and enable example plugins for demonstration purposes.
 * In a real application, plugins would typically be loaded from
 * user configuration or a plugin marketplace.
 * 
 * @param enableAll Whether to enable all plugins automatically
 */
export async function setupExamplePlugins(enableAll = false): Promise<void> {
  try {
    // Only initialize plugins if not already initialized
    const isInitialized = typeof window !== 'undefined' && (window as any).obsidianJS;
    if (isInitialized) {
      console.log('Obsidian-js plugins already initialized.');
      return;
    }
    
    // Check if plugins are already loaded to avoid errors
    const loadPlugin = async (id: string, createFn: () => any) => {
      if (!pluginManager.getPlugin(id)) {
        const plugin = createFn();
        await pluginManager.loadPlugin(plugin);
        console.log(`Loaded plugin: ${plugin.manifest.name}`);
        return plugin;
      } else {
        console.log(`Plugin ${id} already loaded, skipping.`);
        return pluginManager.getPlugin(id);
      }
    };
    
    // Load the example plugin
    const examplePlugin = await loadPlugin('example-plugin', createExamplePlugin);
    
    // Load the word count plugin
    const wordCountPlugin = await loadPlugin('word-count', createWordCountPlugin);
    
    // Enable plugins if requested
    if (enableAll) {
      if (!pluginManager.isPluginEnabled(examplePlugin.manifest.id)) {
        await pluginManager.enablePlugin(examplePlugin.manifest.id);
        console.log(`Enabled plugin: ${examplePlugin.manifest.name}`);
      }
      
      if (!pluginManager.isPluginEnabled(wordCountPlugin.manifest.id)) {
        await pluginManager.enablePlugin(wordCountPlugin.manifest.id);
        console.log(`Enabled plugin: ${wordCountPlugin.manifest.name}`);
      }
    }
    
    // Register a custom event to notify when Obsidian-js is ready for plugins
    if (typeof window !== 'undefined') {
      const readyEvent = new CustomEvent('obsidian-ready');
      window.dispatchEvent(readyEvent);
    }
    
    // Make the plugin manager available globally for demo purposes
    if (typeof window !== 'undefined') {
      (window as any).obsidianJS = {
        pluginManager,
        plugins: {
          example: examplePlugin,
          wordCount: wordCountPlugin
        }
      };
      
      console.log('Obsidian-js plugin system initialized. Access via window.obsidianJS');
    }
  } catch (error) {
    console.error('Error setting up example plugins:', error);
  }
} 