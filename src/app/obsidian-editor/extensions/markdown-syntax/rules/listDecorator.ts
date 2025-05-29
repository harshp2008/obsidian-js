import { Decoration, WidgetType } from '@codemirror/view';
import { SyntaxRule, SyntaxRuleContext } from '../types';
import { isCursorNearRange } from './utils';

// Get the extended context type that includes the decorations array
interface DecorationItem {
  from: number;
  to: number;
  decoration: Decoration;
}

type ExtendedContext = SyntaxRuleContext & {
  decorations?: DecorationItem[];
};

export class ListDecorator implements SyntaxRule {
  // Regex to match list items at the beginning of a line
  // Captures the specific marker used (-, +, *) or (1., 2., etc.)
  private listItemRegex = /^(\s*)([-+*]|\d+\.)(\s+)(.*)$/gm;

  process(context: SyntaxRuleContext): void {
    const { builder, docText, textSliceFrom, cursorPositions } = context;
    // Cast to get access to the decorations array
    const extContext = context as ExtendedContext;
    const decorations = extContext.decorations || [];

    // Process all list items with a single regex
    this.processListItems(context, this.listItemRegex);
  }

  private processListItems(context: SyntaxRuleContext, regex: RegExp): void {
    const { builder, docText, textSliceFrom, cursorPositions } = context;
    // Cast to get access to the decorations array
    const extContext = context as ExtendedContext;
    const decorations = extContext.decorations || [];

    // Create a new RegExp instance to reset lastIndex
    const localRegex = new RegExp(regex.source, 'gm');
    let match;

    while ((match = localRegex.exec(docText)) !== null) {
      const [fullMatch, leadingWhitespace, marker, spacesAfterMarker, content] = match;
      const isNumberedList = /^\d+\.$/.test(marker);
      const matchStartIndexInSlice = match.index;

      // Calculate positions in the document
      const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
      
      const markerStartInDoc = fullMatchStartInDoc + leadingWhitespace.length;
      const markerEndInDoc = markerStartInDoc + marker.length;
      
      // Check if cursor is exactly adjacent to the list marker
      const isAdjacentToMarker = cursorPositions.some(cursor => 
        cursor === markerStartInDoc || cursor === markerEndInDoc
      );

      // For numbered lists, always show the original number
      if (isNumberedList) {
        // Apply the list styling to the number
        const decoration = Decoration.mark({ class: isAdjacentToMarker ? 'markdown-syntax-active' : 'markdown-list-dim' });
        if (decorations) {
          decorations.push({
            from: markerStartInDoc,
            to: markerEndInDoc,
            decoration
          });
        } else {
          builder.add(markerStartInDoc, markerEndInDoc, decoration);
        }
      } 
      // For unordered lists, show bullet when not adjacent
      else if (isAdjacentToMarker) {
        // Show original marker (-, +, *) with active style
        const decoration = Decoration.mark({ class: 'markdown-syntax-active' });
        if (decorations) {
          decorations.push({
            from: markerStartInDoc,
            to: markerEndInDoc,
            decoration
          });
        } else {
          builder.add(markerStartInDoc, markerEndInDoc, decoration);
        }
      } else {
        // Show bullet for unordered lists when cursor is not adjacent
        if (decorations) {
          decorations.push({
            from: markerStartInDoc,
            to: markerEndInDoc,
            decoration: Decoration.replace({
              widget: new ListBulletWidget(marker),
              class: 'markdown-list-dim'
            })
          });
        } else {
          builder.add(markerStartInDoc, markerEndInDoc, Decoration.replace({
            widget: new ListBulletWidget(marker),
            class: 'markdown-list-dim'
          }));
        }
      }
    }
  }
}

// Widget to display a round bullet
class ListBulletWidget extends WidgetType {
  constructor(private readonly originalMarker: string = '•', private readonly isOrdered: boolean = false) {
    super();
  }

  eq(other: ListBulletWidget): boolean {
    return other.originalMarker === this.originalMarker && other.isOrdered === this.isOrdered;
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.textContent = '•'; // Unicode bullet character
    span.className = 'markdown-list-dim';
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
