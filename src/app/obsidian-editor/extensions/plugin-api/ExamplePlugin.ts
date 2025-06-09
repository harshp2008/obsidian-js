import { Plugin, PluginManifest } from './Plugin';
import { EditorView, Decoration } from '@codemirror/view';
import { createKeymap, createSyntaxDecorator } from './ExtensionPoints';

/**
 * Example plugin that demonstrates various capabilities of the Obsidian-js plugin API
 */
export class ExamplePlugin extends Plugin {
  /**
   * Called when the plugin is enabled
   */
  protected async onEnable(): Promise<void> {
    // Register a command to insert a timestamp
    this.registerCommand(
      'insert-timestamp',
      'Insert Timestamp', 
      (view: EditorView) => {
        this.insertAtCursor(new Date().toLocaleString());
        return true;
      }
    );
    
    // Register a keyboard shortcut to insert bold text
    this.registerExtension(
      'bold-text-shortcut',
      createKeymap('Ctrl-b', (view: EditorView) => {
        const selection = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(selection.from, selection.to);
        
        if (selectedText.length > 0) {
          view.dispatch({
            changes: {
              from: selection.from,
              to: selection.to,
              insert: `**${selectedText}**`
            }
          });
        } else {
          view.dispatch({
            changes: {
              from: selection.from,
              to: selection.to,
              insert: '****'
            },
            selection: { anchor: selection.from + 2 }
          });
        }
        
        return true;
      })
    );
    
    // Register a decoration for headings (makes them larger and colored)
    this.registerExtension(
      'heading-decorator',
      createSyntaxDecorator(['ATXHeading1', 'ATXHeading2'], (node, view) => {
        // Parse heading level from node type
        const level = node.type.name.charAt(node.type.name.length - 1);
        
        return Decoration.mark({
          class: `custom-heading-${level}`,
          attributes: {
            style: `font-size: ${2 - Number(level) * 0.2}em; color: #2563eb;`
          }
        });
      })
    );
    
    // Listen for document changes
    this.registerHook('document:change', (content: string) => {
      console.log('Document content changed:', content.substr(0, 50) + '...');
    });
  }
  
  /**
   * Called when the plugin is disabled
   */
  protected async onDisable(): Promise<void> {
    // All cleanup is handled automatically by the Plugin base class
  }
}

/**
 * Create an instance of the example plugin
 */
export function createExamplePlugin(): ExamplePlugin {
  return new ExamplePlugin({
    id: 'example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    description: 'An example plugin that demonstrates the Obsidian-js plugin API',
    author: 'Obsidian-js Team'
  });
} 