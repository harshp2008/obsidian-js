import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
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

/**
 * Builds HTML decorations for the editor
 */
export function buildHtmlDecorations(view: EditorView): DecorationSet {
  try {
    // Detect HTML regions in the document
    const regions = detectHtmlRegions(view);
    
    if (!regions.length) {
      return Decoration.none;
    }
    
    // Check if editor is in read-only/preview mode
    const inPreviewMode = isEditorInPreviewMode(view);
    
    // Build decorations based on rendering mode
    return buildDecorationsForRegions(regions, view, inPreviewMode);
  } catch (error) {
    console.error('Error building HTML decorations:', error);
    return Decoration.none;
  }
}

/**
 * Build decorations for all detected HTML regions
 */
function buildDecorationsForRegions(
  regions: HtmlRegion[], 
  view: EditorView, 
  inPreviewMode: boolean
): DecorationSet {
  const allDecorations: DecorationItem[] = [];
  
  // Process each HTML region
  for (const region of regions) {
    try {
      // Determine if the cursor is near this region
      const isNearCursor = isCursorNearRegion(view, region);
      
      // In preview mode: always render HTML
      // In edit mode: show code when cursor is near, rendered HTML when cursor is away
      const showCode = !inPreviewMode && isNearCursor;
      
      if (showCode) {
        // In edit mode with cursor near HTML: Show syntax-highlighted code only
        // DO NOT use replace decorations or widgets here to keep content editable
        const syntaxDecorations = HtmlSyntaxHighlighter.highlight(region);
        syntaxDecorations.between(region.from, region.to, (from, to, deco) => {
          allDecorations.push({ from, to, decoration: deco });
        });
      } else {
        // In preview mode or cursor away: Show rendered HTML
        if (region.isMultiline) {
          // Handle multiline HTML with block content
          handleMultilineHtml(region, allDecorations);
        } else {
          // Handle inline HTML (single-line)
          handleInlineHtml(region, allDecorations);
        }
      }
    } catch (error) {
      console.error('Error processing HTML region:', error, region);
    }
  }
  
  // Sort decorations by 'from' position
  allDecorations.sort((a, b) => a.from - b.from);
  
  // Add sorted decorations to the builder
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to, decoration } of allDecorations) {
    if (from < to) {
      builder.add(from, to, decoration);
    }
  }
  
  return builder.finish();
}

/**
 * Handle multiline HTML rendering
 */
function handleMultilineHtml(region: HtmlRegion, decorations: DecorationItem[]): void {
  // For multiline, use a widget at the beginning and mark decoration for the original code
  
  // Add a widget at the beginning with rendered content 
  decorations.push({
    from: region.from, 
    to: region.from, 
    decoration: Decoration.widget({
      widget: new HtmlPreviewWidget(region.content, true),
      side: -1 // Show before the start position
    })
  });
  
  // Add a mark decoration to fade the original HTML code without making it non-editable
  decorations.push({
    from: region.from,
    to: region.to,
    decoration: Decoration.mark({
      class: 'cm-html-multiline-code',
      attributes: { 'data-html-tag': region.tagName }
    })
  });
}

/**
 * Handle inline HTML rendering
 */
function handleInlineHtml(region: HtmlRegion, decorations: DecorationItem[]): void {
  // For inline HTML, use a widget at the beginning rather than replacing content
  decorations.push({
    from: region.from, 
    to: region.from, 
    decoration: Decoration.widget({
      widget: new HtmlPreviewWidget(region.content, false),
      side: -1 // Show before the start position
    })
  });
  
  // Add a mark decoration to fade the original HTML code
  decorations.push({
    from: region.from,
    to: region.to,
    decoration: Decoration.mark({
      class: 'cm-html-inline-code',
      attributes: { 'data-html-tag': region.tagName }
    })
  });
} 