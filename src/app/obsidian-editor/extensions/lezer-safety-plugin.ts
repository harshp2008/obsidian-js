import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin } from '@codemirror/view';

/**
 * Creates a plugin that patches Lezer functions to prevent errors
 * related to "Cannot read properties of undefined (reading 'some')"
 */
export function createLezerSafetyPlugin(): Extension {
  // Use ViewPlugin to hook into the editor lifecycle
  return ViewPlugin.define(() => {
    console.log("Initializing Lezer safety plugin");
    
    return {
      update(update) {
        try {
          // Access the view's internal structure to apply our patches
          const view = update.view as any;
          
          // Find the parser instance
          if (view && view.plugin && view.dispatch) {
            // Try to access internal plugins - note this is accessing private properties
            const viewPlugins = view._plugins || view.state.facet({name: "plugins"});
            
            // Iterate through plugins to find language-related ones
            if (viewPlugins && Array.isArray(viewPlugins)) {
              viewPlugins.forEach(plugin => {
                // Try to patch Lezer-related components
                if (plugin && plugin.extension && plugin.extension.parser) {
                  const parser = plugin.extension.parser;
                  
                  // Create backup of original methods
                  const originalHasChild = parser.hasChild;
                  
                  if (typeof originalHasChild === 'function') {
                    // Replace with safer version
                    parser.hasChild = function safeHasChild(type: any, node: any, predicate: any) {
                      if (!node || !node.children) {
                        console.warn("SafeHasChild: node or node.children is undefined");
                        return false;
                      }
                      
                      try {
                        return originalHasChild(type, node, predicate);
                      } catch (e) {
                        console.warn("SafeHasChild: caught error", e);
                        return false;
                      }
                    };
                    
                    console.log("Successfully patched parser.hasChild");
                  }
                }
              });
            }
          }
        } catch (error) {
          // Log but don't crash
          console.warn("Error applying Lezer safety patches:", error);
        }
      }
    };
  });
} 