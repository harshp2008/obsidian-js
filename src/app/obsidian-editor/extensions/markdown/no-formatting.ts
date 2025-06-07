import { EditorView, ViewPlugin, DecorationSet, Decoration } from '@codemirror/view';
import { RangeSetBuilder, EditorState } from '@codemirror/state';

/**
 * Extension that adds extra protection against markdown formatting in HTML regions.
 * This adds non-parsing spans that instruct the markdown parser to completely skip these areas.
 */
export const noMarkdownInHtmlPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: { view: EditorView; docChanged: boolean }) {
    if (update.docChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  /**
   * Find HTML regions in the document and create anti-formatting decorations
   */
  buildDecorations(view: EditorView): DecorationSet {
    const { state } = view;
    const builder = new RangeSetBuilder<Decoration>();

    // Find HTML regions by scanning for angle brackets
    this.findHtmlRegions(state).forEach(({ from, to }) => {
      if (from < to) {
        // Add a decoration that breaks markdown parsing
        builder.add(
          from, 
          to, 
          Decoration.mark({
            class: 'cm-anti-markdown no-parse',
            attributes: { 'data-no-markdown': 'true', 'data-raw': 'true' }
          })
        );
      }
    });

    return builder.finish();
  }

  /**
   * Simple HTML region detection - looks for paired angle brackets
   */
  findHtmlRegions(state: EditorState): { from: number; to: number }[] {
    const doc = state.doc.toString();
    const regions: { from: number; to: number }[] = [];
    
    // Very simple regex-based HTML detection
    const htmlTagRegex = /<\/?[a-zA-Z][^>]*>/g;
    
    // Track potential HTML tag openings
    let match;
    let openTags: { tag: string; pos: number }[] = [];
    
    while ((match = htmlTagRegex.exec(doc)) !== null) {
      const tagContent = match[0];
      const isClosing = tagContent.startsWith('</');
      const isVoid = tagContent.endsWith('/>');
      
      if (isVoid) {
        // Self-closing tag, create a region just for this tag
        regions.push({ from: match.index, to: match.index + tagContent.length });
      } else if (isClosing) {
        // Closing tag, find matching opening tag if any
        const tagName = tagContent.match(/<\/([a-zA-Z][^>\s]*)/)?.[1]?.toLowerCase();
        
        if (tagName) {
          // Look for matching open tag from the end
          for (let i = openTags.length - 1; i >= 0; i--) {
            if (openTags[i].tag === tagName) {
              // Found matching pair, create a region
              regions.push({
                from: openTags[i].pos,
                to: match.index + tagContent.length
              });
              
              // Remove this and all nested tags
              openTags.splice(i);
              break;
            }
          }
        }
      } else {
        // Opening tag, add to stack
        const tagName = tagContent.match(/<([a-zA-Z][^>\s]*)/)?.[1]?.toLowerCase();
        if (tagName) {
          openTags.push({ tag: tagName, pos: match.index });
        }
      }
    }
    
    return regions;
  }
}, {
  decorations: instance => instance.decorations
});

/**
 * Export the plugin as an extension
 */
export function createNoMarkdownInHtmlExtension() {
  return [noMarkdownInHtmlPlugin];
} 