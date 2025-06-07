import { RangeSetBuilder, EditorState } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';

/**
 * Represents a range in the document.
 */
export interface DocRange {
  from: number;
  to: number;
}

/**
 * Interface representing a decoration item with its position and decoration object
 */
export interface DecorationItem {
  /** Start position of the decoration */
  from: number;
  /** End position of the decoration */
  to: number;
  /** The decoration object to apply */
  decoration: Decoration;
}

/**
 * Context provided to syntax rules for processing
 */
export interface SyntaxRuleContext {
  /** Builder used to build decorations */
  builder: RangeSetBuilder<Decoration>;
  /** Current document text */
  docText: string;
  /** The offset at which the slice starts in the document */
  textSliceFrom: number;
  /** Array of current cursor positions */
  cursorPositions: number[];
  /** Current editor state */
  state: EditorState;
  /** Editor view, if available */
  view?: EditorView;
  /** Collection of decorations being built */
  decorations: DecorationItem[];
  /** Current rendering mode */
  currentMode: 'live' | 'preview';
  /** HTML edit regions that should be excluded from markdown parsing (optional) */
  htmlEditRegions?: {from: number, to: number}[];
}

/**
 * Interface for a Markdown syntax processing rule.
 * Each rule is responsible for finding its specific syntax and adding decorations.
 */
export interface SyntaxRule {
  /**
   * Processes the document or a slice of it to find and apply decorations for a specific Markdown syntax.
   * @param context - The context containing the editor state, text, and decoration builder.
   */
  process(context: SyntaxRuleContext): void;
}
