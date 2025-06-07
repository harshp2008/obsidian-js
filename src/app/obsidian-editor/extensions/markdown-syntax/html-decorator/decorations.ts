import { Decoration, DecorationSet, EditorView, WidgetType } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { HtmlRegion } from './types';
import { HtmlPreviewWidget } from './html-widget';
import { HtmlSyntaxHighlighter } from './syntax-highlighter';
import { detectHtmlRegions, isCursorNearRegion, isEditorInPreviewMode } from './tag-detector';

// Interface for decoration item
interface DecorationItem {
  from: number;
  to: number;
  decoration: Decoration;
}

// Logging control
const DEBUG = false;

/**
 * Builds HTML decorations for the editor
 */
export function buildHtmlDecorations(view: EditorView): DecorationSet {
  try {
    if (DEBUG) console.log("Building HTML decorations");
    
    // Detect HTML regions in the document
    const regions = detectHtmlRegions(view);
    
    if (!regions.length) {
      if (DEBUG) console.log("No HTML regions found");
      return Decoration.none;
    }
    
    if (DEBUG) console.log(`Found ${regions.length} HTML regions:`, regions);
    
    // Check if editor is in read-only/preview mode
    const inPreviewMode = isEditorInPreviewMode(view);
    
    // Build decorations based on cursor position
    return buildSmartDecorations(regions, view, inPreviewMode);
  } catch (error) {
    console.error('Error building HTML decorations:', error);
    return Decoration.none;
  }
}

/**
 * Creates an HTML preview element for a region
 */
function createHtmlPreview(html: string): HTMLElement {
  // Container for the preview
  const container = document.createElement('div');
  container.className = 'cm-html-preview';
  container.style.cssText = `
    background-color: #f5f5f5;
    border: 2px solid #4285f4;
    border-radius: 8px;
    padding: 15px;
    margin: 5px 0;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    position: relative;
  `;

  // Create content container (removed the label)
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 10px;
    border-radius: 4px;
    color: black;
  `;
  
  // Set the HTML content
  content.innerHTML = html;
  container.appendChild(content);
  
  return container;
}

/**
 * Build smart decorations that handle both edit mode and preview mode
 */
function buildSmartDecorations(regions: HtmlRegion[], view: EditorView, inPreviewMode: boolean): DecorationSet {
  // Create a collection for all decorations before sorting
  const allDecorations: DecorationItem[] = [];
  
  // Get cursor ranges
  const cursorRanges = view.state.selection.ranges;
  
  // First, determine which regions should be in edit mode based on cursor proximity
  // and build a set of their IDs
  const editModeRegions = new Set<number>();
  
  // First pass: Find regions directly containing the cursor
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    for (const range of cursorRanges) {
      if (isCursorNearRegion(view, region)) {
        editModeRegions.add(i);
        break;
      }
    }
  }
  
  // Second pass: Find all regions nested within edit mode regions
  // and also all parent regions containing edit mode regions
  let madeChange = true;
  while (madeChange) {
    madeChange = false;
    
    // Check for nesting relationships
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      
      // If this region is already in edit mode, check for nested regions
      if (editModeRegions.has(i)) {
        // Find any regions completely contained within this one
        for (let j = 0; j < regions.length; j++) {
          if (i !== j && !editModeRegions.has(j)) {
            const nestedRegion = regions[j];
            if (nestedRegion.from >= region.from && nestedRegion.to <= region.to) {
              editModeRegions.add(j);
              madeChange = true;
            }
          }
        }
      } else {
        // Check if this region contains any edit mode regions
        for (let j = 0; j < regions.length; j++) {
          if (editModeRegions.has(j)) {
            const editModeRegion = regions[j];
            if (editModeRegion.from >= region.from && editModeRegion.to <= region.to) {
              editModeRegions.add(i);
              madeChange = true;
              break;
            }
          }
        }
      }
    }
  }
  
  if (DEBUG) console.log(`${editModeRegions.size} regions will be in edit mode out of ${regions.length} total`);
  
  // Process each HTML region
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    try {
      // If this region should be in edit mode
      if (editModeRegions.has(i)) {
        if (DEBUG) console.log(`Creating editable syntax highlighting for ${region.tagName} (${region.from}-${region.to})`);
        
        // Add special plain text decoration to prevent markdown parsing within HTML
        allDecorations.push({
          from: region.from,
          to: region.to,
          decoration: Decoration.mark({ 
            class: 'cm-plain-text-marker',
            inclusiveStart: true,
            inclusiveEnd: true,
            attributes: { 'data-html-content': 'true' }
          })
        });
        
        // Get syntax highlighting decorations
        const syntaxDecorationSet = HtmlSyntaxHighlighter.highlight(region);
        
        // Collect decorations from the decoration set into our array
        const syntaxDecorations: DecorationItem[] = [];
        
        syntaxDecorationSet.between(region.from, region.to, (from, to, deco) => {
          syntaxDecorations.push({
            from,
            to,
            decoration: deco
          });
        });
        
        // If we have syntax decorations, add them to our collection
        if (syntaxDecorations.length > 0) {
          allDecorations.push(...syntaxDecorations);
        }
      } else {
        if (DEBUG) console.log(`Creating preview for ${region.tagName} (${region.from}-${region.to})`);
        
        // Extract just the HTML content for preview
        let htmlContent = region.content;
        
        // For div and span, try to extract inner content for cleaner display
        const tagMatch = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)>([\s\S]*?)<\/\1>/i.exec(region.content);
        if (tagMatch) {
          const tagName = tagMatch[1].toLowerCase();
          const attributes = tagMatch[2] || '';
          const innerContent = tagMatch[3] || '';
          
          // Create an HTML string that preserves styling but focuses on content
          if (tagName === 'div' || tagName === 'span') {
            const styleMatch = /style\s*=\s*(['"])(.*?)\1/i.exec(attributes);
            const styleValue = styleMatch ? styleMatch[2] : '';
            
            if (styleValue) {
              htmlContent = `<div style="${styleValue}">${innerContent}</div>`;
            } else {
              htmlContent = innerContent;
            }
          }
        }
        
        // Make sure this region doesn't overlap with any edit mode regions
        // This can happen with malformed HTML where regions overlap
        let overlapsEditMode = false;
        for (const editIndex of editModeRegions) {
          const editRegion = regions[editIndex];
          if ((region.from >= editRegion.from && region.from < editRegion.to) ||
              (region.to > editRegion.from && region.to <= editRegion.to) ||
              (region.from <= editRegion.from && region.to >= editRegion.to)) {
            overlapsEditMode = true;
            break;
          }
        }
        
        if (!overlapsEditMode) {
          // Completely hide the original HTML code with a preview widget
          allDecorations.push({
            from: region.from,
            to: region.to,
            decoration: Decoration.replace({
              widget: new HtmlPreviewWidget(htmlContent, region.isMultiline),
            })
          });
        }
      }
    } catch (error) {
      console.error('Error processing region:', error, region);
    }
  }
  
  // COMPLETELY REWRITTEN DECORATION SORTING AND BUILDING LOGIC
  const builder = new RangeSetBuilder<Decoration>();
  
  try {
    // Create a map to store decorations by position
    // The key is the from position, and the value is an array of decorations at that position
    const positionMap = new Map<number, {from: number, to: number, decoration: Decoration}[]>();
    
    // Group decorations by from position
    for (const deco of allDecorations) {
      if (deco.from < deco.to) { // Skip invalid ranges
        if (!positionMap.has(deco.from)) {
          positionMap.set(deco.from, []);
        }
        positionMap.get(deco.from)!.push(deco);
      }
    }
    
    // Get all positions sorted
    const positions = Array.from(positionMap.keys()).sort((a, b) => a - b);
    
    // For each position, sort its decorations by startSide and priority
    for (const pos of positions) {
      const decos = positionMap.get(pos)!;
      
      // Sort decorations at this position
      decos.sort((a, b) => {
        // First prioritize by whether it's a replace widget
        const aIsWidget = a.decoration.spec.widget !== undefined;
        const bIsWidget = b.decoration.spec.widget !== undefined;
        
        if (aIsWidget !== bIsWidget) {
          return aIsWidget ? -1 : 1; // Widgets come first
        }
        
        // For marks, sort by startSide (inclusiveStart)
        if (!aIsWidget && !bIsWidget) {
          const aInclusive = a.decoration.spec.inclusiveStart === true;
          const bInclusive = b.decoration.spec.inclusiveStart === true;
          
          if (aInclusive !== bInclusive) {
            return aInclusive ? -1 : 1; // Inclusive comes first
          }
        }
        
        // If still tied, sort by end position
        return a.to - b.to;
      });
      
      // Add sorted decorations to the builder
      for (const deco of decos) {
        try {
          builder.add(deco.from, deco.to, deco.decoration);
        } catch (e) {
          if (DEBUG) console.warn(`Skipping decoration ${deco.from}-${deco.to} due to error:`, e);
        }
      }
    }
    
    return builder.finish();
  } catch (error) {
    console.error("Critical error in decoration building:", error);
    return Decoration.none;
  }
}

/**
 * Widget that renders HTML directly in the replace decoration
 */
class HtmlReplaceWidget extends WidgetType {
  constructor(readonly html: string) { super(); }
  
  eq(other: HtmlReplaceWidget): boolean {
    return other.html === this.html;
  }
  
  toDOM(): HTMLElement {
    const element = document.createElement('div');
    element.innerHTML = this.html;
    return element.firstElementChild as HTMLElement;
  }
  
  ignoreEvent(): boolean { return false; }
} 