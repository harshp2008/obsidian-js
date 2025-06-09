import type { Plugin } from '../../../src/app/obsidian-editor/extensions/plugin-api';

/**
 * Plugin factory function type
 * A factory function that creates a plugin instance
 */
export type PluginFactory<T extends Plugin = Plugin> = () => T;

/**
 * Plugin Registry for managing and loading plugins
 * This is the central place to register all plugins in the demo app
 */
export class PluginRegistry {
  // Map of plugin factories by ID
  private pluginFactories = new Map<string, PluginFactory>();
  
  /**
   * Register a plugin factory function
   * @param id - Plugin identifier
   * @param factory - Factory function that creates the plugin
   */
  registerPluginFactory(id: string, factory: PluginFactory): void {
    if (this.pluginFactories.has(id)) {
      console.warn(`Plugin factory with ID '${id}' already exists. Overwriting.`);
    }
    this.pluginFactories.set(id, factory);
  }
  
  /**
   * Get a plugin factory by ID
   * @param id - Plugin identifier
   * @returns The plugin factory function or undefined if not found
   */
  getPluginFactory(id: string): PluginFactory | undefined {
    return this.pluginFactories.get(id);
  }
  
  /**
   * Get all registered plugin factories
   * @returns Array of [id, factory] tuples
   */
  getAllPluginFactories(): [string, PluginFactory][] {
    return Array.from(this.pluginFactories.entries());
  }
  
  /**
   * Create a plugin instance from a registered factory
   * @param id - Plugin identifier
   * @returns The created plugin instance or undefined if factory not found
   */
  createPlugin(id: string): Plugin | undefined {
    const factory = this.getPluginFactory(id);
    if (factory) {
      return factory();
    }
    return undefined;
  }
  
  /**
   * Create instances of all registered plugins
   * @returns Array of created plugin instances
   */
  createAllPlugins(): Plugin[] {
    return Array.from(this.pluginFactories.values()).map(factory => factory());
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry(); 