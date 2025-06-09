import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { obsidianPluginAPI } from './ObsidianPluginAPI';

/**
 * Plugin manifest information
 */
export interface PluginManifest {
  /** Unique identifier for the plugin */
  id: string;
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description: string;
  /** Plugin author */
  author: string;
  /** Minimum editor version required */
  minEditorVersion?: string;
  /** Plugin tags for categorization */
  tags?: string[];
}

/**
 * Base class for Obsidian-js plugins
 * Extend this class to create custom plugins
 */
export abstract class Plugin {
  /** Plugin manifest */
  public manifest: PluginManifest;
  
  /** Flag indicating if the plugin is currently enabled */
  private _enabled: boolean = false;
  
  /** Get whether the plugin is currently enabled */
  public get enabled(): boolean {
    return this._enabled;
  }
  
  /** Reference to the editor view */
  protected view: EditorView | null = null;
  
  /** List of registered extensions by this plugin */
  private registeredExtensionIds: string[] = [];
  
  /** List of registered commands by this plugin */
  private registeredCommandIds: string[] = [];

  /**
   * Create a new plugin instance
   * @param manifest - Plugin metadata
   */
  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
  }

  /**
   * Initialize the plugin with the editor view
   * Should not be called directly by plugin developers
   * @param view - The CodeMirror editor view
   * @internal
   */
  public _initialize(view: EditorView): void {
    this.view = view;
  }

  /**
   * Enable the plugin
   * Called when the plugin is activated
   */
  public async enable(): Promise<void> {
    if (this._enabled) {
      console.log(`Plugin ${this.manifest.id} is already enabled, skipping`);
      return;
    }
    
    try {
      console.log(`Enabling plugin ${this.manifest.id}...`);
      
      // Check if we have a valid view
      if (!this.view) {
        console.error(`Plugin ${this.manifest.id} has no editor view set. Plugin may not work correctly.`);
      } else {
        console.log(`Plugin ${this.manifest.id} has valid editor view:`, this.view);
      }
      
      // Call the plugin's onEnable method
      console.log(`Calling onEnable for plugin ${this.manifest.id}...`);
      await this.onEnable();
      console.log(`Successfully called onEnable for plugin ${this.manifest.id}`);
      
      // Check if any extensions were registered
      console.log(`Plugin ${this.manifest.id} registered extensions: ${this.registeredExtensionIds.length}`);
      console.log(`Plugin ${this.manifest.id} registered commands: ${this.registeredCommandIds.length}`);
      
      this._enabled = true;
      console.log(`Plugin ${this.manifest.id} is now enabled`);
    } catch (error: any) {
      console.error(`Error enabling plugin ${this.manifest.id}:`, error);
      console.error(`Stack trace:`, error.stack);
      throw error;
    }
  }

  /**
   * Disable the plugin
   * Called when the plugin is deactivated
   */
  public async disable(): Promise<void> {
    if (!this._enabled) return;
    
    try {
      // Clean up all registered extensions and commands
      this.registeredExtensionIds.forEach(id => {
        obsidianPluginAPI.unregisterExtension(id);
      });
      
      this.registeredCommandIds = [];
      this.registeredExtensionIds = [];
      
      await this.onDisable();
      this._enabled = false;
    } catch (error) {
      console.error(`Error disabling plugin ${this.manifest.id}:`, error);
      throw error;
    }
  }

  /**
   * Register a CodeMirror extension with a unique ID
   * The extension will be automatically cleaned up when the plugin is disabled
   * @param id - Unique identifier for the extension
   * @param extension - CodeMirror extension
   */
  protected registerExtension(id: string, extension: Extension): void {
    const fullId = `${this.manifest.id}:${id}`;
    obsidianPluginAPI.registerExtension(fullId, extension);
    this.registeredExtensionIds.push(fullId);
  }

  /**
   * Register a command that can be executed by users
   * The command will be automatically cleaned up when the plugin is disabled
   * @param id - Command identifier
   * @param name - Human-readable command name
   * @param callback - Command function that returns true if handled
   */
  protected registerCommand(id: string, name: string, callback: (view: EditorView) => boolean): void {
    const fullId = `${this.manifest.id}:${id}`;
    obsidianPluginAPI.registerCommand(fullId, callback);
    this.registeredCommandIds.push(fullId);
  }

  /**
   * Hook into editor events
   * @param event - Event name
   * @param callback - Callback function to execute when the event occurs
   */
  protected registerHook(event: string, callback: Function): void {
    obsidianPluginAPI.registerHook(event, callback);
  }
  
  /**
   * Get the current editor content
   * @returns The current document content
   */
  protected getContent(): string {
    return obsidianPluginAPI.getContent();
  }
  
  /**
   * Set the editor content
   * @param content - New content
   */
  protected setContent(content: string): void {
    obsidianPluginAPI.setContent(content);
  }
  
  /**
   * Insert text at the current cursor position
   * @param text - Text to insert
   */
  protected insertAtCursor(text: string): void {
    obsidianPluginAPI.insertAtCursor(text);
  }
  
  /**
   * Execute a registered command by ID
   * @param id - Command ID to execute
   * @returns Whether the command was found and executed
   */
  protected executeCommand(id: string): boolean {
    const fullId = `${this.manifest.id}:${id}`;
    return obsidianPluginAPI.executeCommand(fullId);
  }

  /**
   * Override this method to perform setup when the plugin is enabled
   * This is where you should register extensions, commands, and event handlers
   */
  protected abstract onEnable(): void | Promise<void>;

  /**
   * Override this method to perform cleanup when the plugin is disabled
   * Most cleanup is handled automatically, but you can perform additional cleanup here
   */
  protected abstract onDisable(): void | Promise<void>;
} 