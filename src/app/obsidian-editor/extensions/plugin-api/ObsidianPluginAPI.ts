import { EditorView } from '@codemirror/view';
import { Extension, StateEffect, StateField } from '@codemirror/state';
import { EventEmitter } from 'events';

/**
 * The core Plugin API for Obsidian-js
 * Provides access to editor functionality and extension points
 */
export class ObsidianPluginAPI {
  private editorView: EditorView | null = null;
  private extensions: Map<string, Extension> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private registeredCommands: Map<string, (view: EditorView) => boolean> = new Map();
  private registeredHooks: Map<string, Set<Function>> = new Map();

  /**
   * Initialize the API with an EditorView
   * @param view - The CodeMirror EditorView instance
   */
  public initialize(view: EditorView): void {
    this.editorView = view;
  }

  /**
   * Register a CodeMirror extension with the editor
   * @param id - Unique identifier for the extension
   * @param extension - CodeMirror extension to add
   * @throws Error if extension with this ID is already registered
   */
  public registerExtension(id: string, extension: Extension): void {
    console.log(`Registering extension with ID: ${id}`);
    
    if (this.extensions.has(id)) {
      throw new Error(`Extension with ID '${id}' is already registered`);
    }
    
    this.extensions.set(id, extension);
    
    if (this.editorView) {
      console.log(`Applying extension ${id} to editor view`);
      try {
        this.editorView.dispatch({
          effects: StateEffect.appendConfig.of(extension)
        });
        console.log(`Successfully applied extension ${id}`);
      } catch (error) {
        console.error(`Error applying extension ${id}:`, error);
        throw error;
      }
    } else {
      console.warn(`No editor view available when registering extension ${id}`);
    }
  }

  /**
   * Unregister a previously registered extension
   * @param id - ID of the extension to remove
   * @returns boolean - Whether the extension was found and removed
   */
  public unregisterExtension(id: string): boolean {
    const extension = this.extensions.get(id);
    if (!extension) return false;
    
    // Extension removal is complex in CodeMirror
    // We would need a specific reconfiguration compartment for each extension
    // For now, we'll just remove it from our registry
    this.extensions.delete(id);
    
    // Signal that extension was removed
    this.eventEmitter.emit('extension:removed', id);
    
    return true;
  }

  /**
   * Register a command that can be executed by users
   * @param id - Unique identifier for the command
   * @param command - Command function that returns true if handled
   */
  public registerCommand(id: string, command: (view: EditorView) => boolean): void {
    if (this.registeredCommands.has(id)) {
      throw new Error(`Command with ID '${id}' is already registered`);
    }
    
    this.registeredCommands.set(id, command);
    this.eventEmitter.emit('command:registered', id);
  }

  /**
   * Execute a registered command by ID
   * @param id - ID of the command to execute
   * @returns boolean - Whether the command was found and executed successfully
   */
  public executeCommand(id: string): boolean {
    if (!this.editorView) return false;
    
    const command = this.registeredCommands.get(id);
    if (!command) return false;
    
    return command(this.editorView);
  }

  /**
   * Register a hook for a specific editor event
   * @param event - Event name to hook into
   * @param callback - Function to call when the event occurs
   */
  public registerHook(event: string, callback: Function): void {
    if (!this.registeredHooks.has(event)) {
      this.registeredHooks.set(event, new Set());
    }
    
    this.registeredHooks.get(event)?.add(callback);
  }

  /**
   * Unregister a previously registered hook
   * @param event - Event name
   * @param callback - The callback function to remove
   * @returns boolean - Whether the hook was found and removed
   */
  public unregisterHook(event: string, callback: Function): boolean {
    const hooks = this.registeredHooks.get(event);
    if (!hooks) return false;
    
    return hooks.delete(callback);
  }

  /**
   * Trigger hooks for a specific event
   * @param event - Event name to trigger
   * @param args - Arguments to pass to the hook callbacks
   */
  public triggerHooks(event: string, ...args: any[]): void {
    const hooks = this.registeredHooks.get(event);
    if (!hooks) return;
    
    hooks.forEach(hook => {
      try {
        hook(...args);
      } catch (error) {
        console.error(`Error in hook for event '${event}':`, error);
      }
    });
  }

  /**
   * Get the current content of the editor
   * @returns string - Current document content
   */
  public getContent(): string {
    if (!this.editorView) return '';
    return this.editorView.state.doc.toString();
  }

  /**
   * Replace the current content of the editor
   * @param content - New content
   */
  public setContent(content: string): void {
    if (!this.editorView) return;
    
    this.editorView.dispatch({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: content
      }
    });
  }

  /**
   * Insert text at the current cursor position
   * @param text - Text to insert
   */
  public insertAtCursor(text: string): void {
    if (!this.editorView) return;
    
    const selection = this.editorView.state.selection.main;
    
    this.editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: text
      }
    });
  }

  /**
   * Create a new state field for plugins to store and access state
   * @param id - Unique identifier for the state field
   * @param initialValue - Initial value for the state
   * @param updateHandler - Function to update state based on editor transactions
   * @returns The created state field extension
   */
  public createStateField<T>(
    id: string, 
    initialValue: T, 
    updateHandler: (value: T, transaction: any) => T
  ): Extension {
    const stateField = StateField.define<T>({
      create: () => initialValue,
      update: updateHandler
    });
    
    this.registerExtension(id + 'StateField', stateField);
    return stateField;
  }
}

// Create a singleton instance
export const obsidianPluginAPI = new ObsidianPluginAPI(); 