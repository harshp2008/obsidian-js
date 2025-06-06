/**
 * This file contains fixes for CodeMirror highlight style issues,
 * particularly addressing the "tags is not iterable" error that happens
 * in some versions of @lezer/highlight.
 */
import { HighlightStyle } from '@codemirror/language';

/**
 * Monkey patches the HighlightStyle.define method to make it more resilient
 * to the "tags is not iterable" error that can occur with certain versions
 * of the @lezer/highlight package.
 * 
 * This should be called as early as possible, ideally in your application's entry point.
 */
export function applyHighlightStyleFix(): void {
  try {
    // Skip if already patched
    if ((HighlightStyle as any).__patched) return;
    
    // Store the original define method
    const originalDefine = HighlightStyle.define;
    
    // Replace with a safer version that handles errors
    HighlightStyle.define = function(specs) {
      try {
        const style = originalDefine.call(this, specs);
        
        // Get the original style function
        const originalStyleFn = style.style;
        
        // Create a safer version of the style function
        Object.defineProperty(style, 'style', {
          value: function(tags) {
            // Handle undefined or non-iterable tags
            if (!tags) return "";
            
            try {
              return originalStyleFn.call(this, tags);
            } catch (e) {
              console.warn("Error in highlight style:", e);
              return "";
            }
          },
          writable: false,
          configurable: true
        });
        
        return style;
      } catch (error) {
        console.error("Error creating HighlightStyle:", error);
        // Return an empty style as fallback
        return originalDefine.call(this, []);
      }
    };
    
    // Mark as patched to avoid double patching
    (HighlightStyle as any).__patched = true;
    console.info("HighlightStyle successfully patched to prevent 'tags is not iterable' error");
    
  } catch (error) {
    console.error("Failed to patch HighlightStyle:", error);
  }
}

/**
 * An alternative approach using a wrapper function instead of monkey patching.
 * This creates a safe version of HighlightStyle.define that catches errors.
 */
export function safeHighlightStyleDefine(specs: any[]): any {
  try {
    const style = HighlightStyle.define(specs);
    
    // Clone the style object
    const safeStyle = Object.assign(
      Object.create(Object.getPrototypeOf(style)),
      style
    );
    
    // Get the original style function
    const originalStyleFn = style.style;
    
    // Create a safer version of the style function
    Object.defineProperty(safeStyle, 'style', {
      value: function(tags: any) {
        // Handle undefined or non-iterable tags
        if (!tags) return "";
        
        try {
          return originalStyleFn.call(style, tags);
        } catch (e) {
          console.warn("Error in highlight style:", e);
          return "";
        }
      },
      writable: false,
      configurable: true
    });
    
    return safeStyle;
  } catch (error) {
    console.error("Error creating HighlightStyle:", error);
    // Return an empty style as fallback
    return HighlightStyle.define([]);
  }
} 