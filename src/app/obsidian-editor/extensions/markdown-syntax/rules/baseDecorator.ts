import { SyntaxRule, SyntaxRuleContext, DecorationItem } from '../types';

/**
 * Base class for all markdown syntax rules
 * Provides common functionality and interfaces
 */
export abstract class BaseDecorator implements SyntaxRule {
  /**
   * Check if a position is within any HTML edit region
   * @param pos - The position to check
   * @param htmlEditRegions - Array of HTML edit regions
   * @returns True if the position is within any HTML edit region
   */
  protected isWithinHtmlEditRegion(pos: number, htmlEditRegions?: {from: number, to: number}[]): boolean {
    if (!htmlEditRegions || !htmlEditRegions.length) return false;
    
    for (const region of htmlEditRegions) {
      if (pos >= region.from && pos < region.to) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a range overlaps with any HTML edit region
   * @param from - Start position
   * @param to - End position
   * @param htmlEditRegions - Array of HTML edit regions
   * @returns True if the range overlaps with any HTML edit region
   */
  protected rangeOverlapsHtmlEditRegion(from: number, to: number, htmlEditRegions?: {from: number, to: number}[]): boolean {
    if (!htmlEditRegions || !htmlEditRegions.length) return false;
    
    for (const region of htmlEditRegions) {
      // Check if the ranges overlap
      if (from < region.to && to > region.from) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Process the document and add decorations
   * Abstract method to be implemented by subclasses
   * 
   * @param context - Context containing document state and decoration builder
   */
  abstract process(context: SyntaxRuleContext): void;
} 