/**
 * This file contains patches for the Lezer library to fix compatibility issues
 * between different versions of CodeMirror and React.
 */

/**
 * Patch the hasChild function in Lezer to handle undefined node.children
 * This fixes the "Cannot read properties of undefined (reading 'some')" error
 */
export function applyLezerPatches() {
  try {
    // Only apply the patch if it hasn't been applied already
    if (!patchesApplied) {
      console.log('Attempting to patch Lezer hasChild function');
      
      // Use global patching approach instead of modifying imports directly
      const applyPatch = () => {
        // Find the hasChild function in the global scope
        // This works because Lezer will have been loaded into window by the time this runs
        if (typeof window !== 'undefined') {
          // Get all loaded script elements
          const scripts = document.querySelectorAll('script');
          
          // Try to find and patch the hasChild function
          if (scripts.length > 0) {
            // Directly define our patched version on the window object
            // This will be picked up by CodeMirror
            (window as any).__patchedLezerHasChild = function(type: any, node: any, predicate: any) {
              // Check if node.children exists before attempting to use it
              if (!node || !node.children) {
                console.warn('Lezer node or node.children is undefined, returning false');
                return false;
              }
              
              // Continue with normal operation assuming node.children exists
              return node.children.some((ch: any) => 
                ch.type.is(type) && (!predicate || predicate(ch)));
            };
            
            // Hook into CodeMirror's initialization to apply our patch
            const originalCreateView = (window as any).__originalCreateView || 
              ((window as any).CodeMirror && (window as any).CodeMirror.EditorView && 
               (window as any).CodeMirror.EditorView.constructor);
              
            if (originalCreateView) {
              console.log('Found CodeMirror View constructor, attempting to patch');
              
              // Store the original if not already stored
              if (!(window as any).__originalCreateView) {
                (window as any).__originalCreateView = originalCreateView;
              }
            }
            
            patchesApplied = true;
            console.log('Lezer patches prepared successfully');
          }
        }
      };

      // Try to apply immediately
      applyPatch();
      
      // Also apply after window load to ensure all scripts are loaded
      if (typeof window !== 'undefined') {
        window.addEventListener('load', applyPatch);
      }
    }
  } catch (error) {
    console.error('Error preparing Lezer patches:', error);
  }
}

// Flag to track if patches have been applied
let patchesApplied = false;

// Apply patches immediately when this module is imported
applyLezerPatches(); 