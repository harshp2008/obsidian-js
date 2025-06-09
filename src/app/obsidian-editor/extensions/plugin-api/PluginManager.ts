import { EditorView } from '@codemirror/view';
import { Plugin, PluginManifest } from './Plugin';
import { obsidianPluginAPI } from './ObsidianPluginAPI';

/**
 * Manages the loading and lifecycle of Obsidian-js plugins
 */
export class PluginManager {
  /** Map of loaded plugins by ID */
  private plugins: Map<string, Plugin> = new Map();
  
  /** Map of enabled plugins by ID */
  private enabledPlugins: Set<string> = new Set();
  
  /** Reference to the editor view */
  private editorView: EditorView | null = null;
  
  /** Event callbacks */
  private eventHandlers: {
    onLoad: ((plugin: Plugin) => void)[],
    onEnable: ((plugin: Plugin) => void)[],
    onDisable: ((plugin: Plugin) => void)[],
    onUnload: ((pluginId: string) => void)[]
  } = {
    onLoad: [],
    onEnable: [],
    onDisable: [],
    onUnload: []
  };

  /**
   * Initialize the plugin manager with an EditorView
   * @param view - The CodeMirror editor view
   */
  public initialize(view: EditorView): void {
    this.editorView = view;
    obsidianPluginAPI.initialize(view);
  }

  /**
   * Load a plugin
   * @param plugin - Plugin instance to load
   * @throws Error if a plugin with the same ID is already loaded
   */
  public async loadPlugin(plugin: Plugin): Promise<void> {
    const { id } = plugin.manifest;
    
    if (this.plugins.has(id)) {
      console.warn(`Plugin with ID '${id}' is already loaded, skipping duplicate load`);
      return; // Just return instead of throwing an error
    }
    
    if (this.editorView) {
      plugin._initialize(this.editorView);
    }
    
    this.plugins.set(id, plugin);
    this.notifyEventHandlers('onLoad', plugin);
  }

  /**
   * Load a plugin from a constructor and manifest
   * @param PluginClass - Plugin class constructor
   * @param manifest - Plugin manifest
   */
  public async loadPluginFromClass(
    PluginClass: new (manifest: PluginManifest) => Plugin,
    manifest: PluginManifest
  ): Promise<Plugin> {
    const plugin = new PluginClass(manifest);
    await this.loadPlugin(plugin);
    return plugin;
  }
  
  /**
   * Enable a loaded plugin by ID
   * @param id - Plugin ID to enable
   * @returns boolean - Whether the plugin was found and enabled
   */
  public async enablePlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    
    if (this.enabledPlugins.has(id)) return true; // Already enabled
    
    await plugin.enable();
    this.enabledPlugins.add(id);
    this.notifyEventHandlers('onEnable', plugin);
    
    return true;
  }
  
  /**
   * Disable a plugin by ID
   * @param id - Plugin ID to disable
   * @returns boolean - Whether the plugin was found and disabled
   */
  public async disablePlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    
    if (!this.enabledPlugins.has(id)) return true; // Already disabled
    
    await plugin.disable();
    this.enabledPlugins.delete(id);
    this.notifyEventHandlers('onDisable', plugin);
    
    return true;
  }
  
  /**
   * Unload a plugin by ID
   * @param id - Plugin ID to unload
   * @returns boolean - Whether the plugin was found and unloaded
   */
  public async unloadPlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    
    if (this.enabledPlugins.has(id)) {
      await this.disablePlugin(id);
    }
    
    this.plugins.delete(id);
    this.notifyEventHandlers('onUnload', id);
    
    return true;
  }
  
  /**
   * Get a loaded plugin by ID
   * @param id - Plugin ID
   * @returns Plugin instance or undefined if not found
   */
  public getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }
  
  /**
   * Get all loaded plugins
   * @returns Array of all loaded plugins
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get all enabled plugins
   * @returns Array of all enabled plugins
   */
  public getEnabledPlugins(): Plugin[] {
    return Array.from(this.enabledPlugins).map(id => this.plugins.get(id)!);
  }
  
  /**
   * Check if a plugin is enabled
   * @param id - Plugin ID
   * @returns boolean - Whether the plugin is enabled
   */
  public isPluginEnabled(id: string): boolean {
    return this.enabledPlugins.has(id);
  }
  
  /**
   * Register an event handler
   * @param event - Event type to listen for
   * @param handler - Handler function
   */
  public on(event: 'load', handler: (plugin: Plugin) => void): void;
  public on(event: 'enable', handler: (plugin: Plugin) => void): void;
  public on(event: 'disable', handler: (plugin: Plugin) => void): void;
  public on(event: 'unload', handler: (pluginId: string) => void): void;
  public on(event: string, handler: Function): void {
    switch (event) {
      case 'load':
        this.eventHandlers.onLoad.push(handler as (plugin: Plugin) => void);
        break;
      case 'enable':
        this.eventHandlers.onEnable.push(handler as (plugin: Plugin) => void);
        break;
      case 'disable':
        this.eventHandlers.onDisable.push(handler as (plugin: Plugin) => void);
        break;
      case 'unload':
        this.eventHandlers.onUnload.push(handler as (pluginId: string) => void);
        break;
    }
  }
  
  /**
   * Notify all registered event handlers for an event
   * @param event - Event type
   * @param data - Event data
   */
  private notifyEventHandlers(event: 'onLoad' | 'onEnable' | 'onDisable', plugin: Plugin): void;
  private notifyEventHandlers(event: 'onUnload', pluginId: string): void;
  private notifyEventHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers[event as keyof typeof this.eventHandlers];
    
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in plugin manager ${event} handler:`, error);
      }
    });
  }
}

// Create a singleton instance
export const pluginManager = new PluginManager(); 