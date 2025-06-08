import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

/**
 * Creates a plugin that patches Lezer functions to prevent errors
 * related to "Cannot read properties of undefined (reading 'some')"
 */
export function createLezerSafetyPlugin(): Extension {
  // We use a ViewPlugin to hook into the editor lifecycle
  return EditorView.updateListener.of(update => {
    // Only apply once per view
    if (!update.view.state.field(EditorView.decorations)) {
      console.log("Applying Lezer safety patches");
      
      try {
        // Access the view's internal structure to apply our patches
        const view = update.view as any;
        
        // Find the parser instance
        if (view && view.plugin && view.dispatch) {
          // Look for parser plugins
          const plugins = view.state.facet(EditorView.plugins);
          
          // Iterate through plugins to find language-related ones
          if (plugins && Array.isArray(plugins)) {
            plugins.forEach(plugin => {
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
  });
} 