import { Decoration, WidgetType, EditorView, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder, EditorState } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import DOMPurify from 'dompurify';
import { markdownSyntaxStateField } from '../index'; // Adjust path as necessary

// Register DOMPurify hooks only on the client-side
if (typeof window !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', function (node: Element) {
  // set all elements owning target to target=_blank
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    // Prevent XSS via window.opener
    node.setAttribute('rel', 'noopener noreferrer');
  }
  // set sandbox attribute on iframes
  if (node.nodeName === 'IFRAME') {
    node.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms');
  }
  });
}

// Regex to find full HTML elements (e.g., <tag>content</tag>)
const HTML_ELEMENT_REGEX = /<([a-zA-Z0-9]+)(?:[^>]*)>([\s\S]*?)<\/\1>/g;

// Widget for preview mode (renders the HTML tag)
class HTMLPreviewWidget extends WidgetType {
  constructor(readonly htmlString: string) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-html-preview-widget'; // Added class for styling

    // Sanitize HTML using the globally configured DOMPurify. 
    // This will use the instance that had hooks applied if on client.
    const cleanHTML = DOMPurify.sanitize(this.htmlString, {
      USE_PROFILES: { html: true }, // Allow all standard HTML elements
      ADD_TAGS: ['iframe'], // Explicitly allow iframes
      ADD_ATTR: [
        'target', // for <a> tags
        'allow', // for iframes (e.g. allow='fullscreen')
        'allowfullscreen', // for iframes
        'frameborder', // for iframes
        'scrolling', // for iframes
        'sandbox', // for iframes (though we set it with a hook)
        'srcdoc', // for iframes
      ],
      // FORBID_TAGS: ['style'], // Example: if you want to forbid style tags
      // FORBID_ATTR: ['onerror'],    // Example: forbid onerror attributes to prevent XSS
    });

    span.innerHTML = cleanHTML;
    return span;
  }

  eq(other: HTMLPreviewWidget) {
    return this.htmlString === other.htmlString;
  }

  ignoreEvent() {
    return false;
  }
}

// Decoration for live mode (styles the raw HTML tag text)
const liveHTMLTagMark = Decoration.mark({
  class: 'cm-html-tag-syntax',
});

function buildHTMLTagDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const { state } = view;
  const selection = state.selection.main; // Get main selection

  for (const { from, to } of view.visibleRanges) {
    const text = state.doc.sliceString(from, to);
    let match;
    while ((match = HTML_ELEMENT_REGEX.exec(text))) {
      const tagStart = from + match.index;
      const tagEnd = from + match.index + match[0].length;

      // Check for adjacency:
      // True if the selection (from/to) overlaps with the tag (tagStart/tagEnd)
      // or if the selection is immediately before or after the tag (1 char buffer).
      const selectionFrom = selection.from;
      const selectionTo = selection.to;

      // Strict adjacency: selection must overlap with or be at the exact boundaries of the tag.
      // This means the selection range [selectionFrom, selectionTo] must have some intersection
      // with the tag range [tagStart, tagEnd].
      const isAdjacent =
        Math.max(selectionFrom, tagStart) <= Math.min(selectionTo, tagEnd);

      if (isAdjacent) {
        // Cursor/selection is adjacent, show raw HTML with styling
        // console.log(`[HTMLTagDecorator] Adjacent: Tag [${tagStart}-${tagEnd}], Selection [${selectionFrom}-${selectionTo}]`);
        builder.add(tagStart, tagEnd, liveHTMLTagMark);
      } else {
        // Cursor/selection is not adjacent, replace with rendered HTML widget
        // console.log(`[HTMLTagDecorator] Not Adjacent (Preview): Tag [${tagStart}-${tagEnd}], Selection [${selectionFrom}-${selectionTo}]`);
        builder.add(
          tagStart,
          tagEnd,
          Decoration.replace({ widget: new HTMLPreviewWidget(match[0]) })
        );
      }
    }
  }
  return builder.finish();
}

export const HTMLTagDecorator = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildHTMLTagDecorations(view);
    }

    update(update: ViewUpdate) {
      // Rebuild decorations if document, viewport, or selection changes.
      // The modeStateChanged logic might be less relevant here if cursor position is the primary driver.
      // const modeStateChanged = update.startState.field(markdownSyntaxStateField, false)?.currentMode !== update.state.field(markdownSyntaxStateField, false)?.currentMode;
      if (update.docChanged || update.viewportChanged || update.selectionSet /* || modeStateChanged */) {
        this.decorations = buildHTMLTagDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    eventHandlers: {
      // Optional: Add event handlers if needed, e.g., to prevent clicks inside widgets
    }
  }
);
