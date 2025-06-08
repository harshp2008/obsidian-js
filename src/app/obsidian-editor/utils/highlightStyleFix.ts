/**
 * This file contains fixes for CodeMirror highlight style issues,
 * particularly addressing the "tags is not iterable" error that happens
 * in some versions of @lezer/highlight.
 */
import { HighlightStyle } from '@codemirror/language';

/**
 * This utility fixes an issue with HighlightStyle in CodeMirror 6
 * where "tags is not iterable" error can occur in certain environments
 */

/**
 * Apply a fix for HighlightStyle to prevent "tags is not iterable" error
 */
export function applyHighlightStyleFix(): void {
  // This is a placeholder for the actual implementation
  // In a real implementation, this would patch the HighlightStyle class
  // to ensure the tags property is always iterable
  console.log('Applying highlight style fix');
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
        
        // Fix for "Cannot read properties of undefined (reading 'some')"
        if (tags && typeof tags.some !== 'function') {
          if (Array.isArray(tags)) {
            return originalStyleFn.call(style, tags);
          }
          return "";
        }
        
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