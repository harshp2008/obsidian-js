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
const DEBUG = true;

/**
 * Builds HTML decorations for the editor
 */
export function buildHtmlDecorations(view: EditorView): DecorationSet {
  try {
    console.log("Building HTML decorations");
    
    // Detect HTML regions in the document
    const regions = detectHtmlRegions(view);
    
    if (!regions.length) {
      console.log("No HTML regions found");
      return Decoration.none;
    }
    
    console.log(`Found ${regions.length} HTML regions:`, regions);
    
    // Check if editor is in read-only/preview mode
    const inPreviewMode = isEditorInPreviewMode(view);
    
    // Build decorations
    return buildReplaceDecorations(regions, view);
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
  
  // Add label
  const label = document.createElement('div');
  label.textContent = 'HTML PREVIEW';
  label.style.cssText = `
    position: absolute;
    top: -12px;
    left: 10px;
    background: #4285f4;
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 11px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  `;
  container.appendChild(label);

  // Create content container
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
 * Build decorations using the replace approach instead of widgets
 */
function buildReplaceDecorations(regions: HtmlRegion[], view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  
  // Process each HTML region
  for (const region of regions) {
    try {
      console.log(`Creating replace decoration for region: ${region.tagName} (${region.from}-${region.to})`);
      
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
      
      // Create a DOM element with the HTML preview
      const previewElement = createHtmlPreview(htmlContent);
      
      // Convert the element to HTML string for the replace decoration
      const tempContainer = document.createElement('div');
      tempContainer.appendChild(previewElement);
      const htmlString = tempContainer.innerHTML;
      
      // Create a replace decoration for this region
      builder.add(region.from, region.to, Decoration.replace({
        widget: new HtmlReplaceWidget(htmlString),
        inclusive: true
      }));
      
    } catch (error) {
      console.error('Error creating replace decoration for region:', error, region);
    }
  }
  
  return builder.finish();
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