import { RangeSetBuilder, EditorState } from '@codemirror/state';
import { EditorView, Decoration } from '@codemirror/view';

/**
 * Represents a range in the document.
 */
export interface DocRange {
  from: number;
  to: number;
}

/**
 * Item for collecting decorations that will be sorted later
 */
export interface DecorationItem {
  from: number;
  to: number;
  decoration: Decoration;
}

/**
 * Context passed to each syntax rule processor.
 */
export interface SyntaxRuleContext {
  builder: RangeSetBuilder<Decoration>;
  docText: string; // Full document text or relevant slice
  textSliceFrom: number; // Starting position of the textSlice in the full document
  state: EditorState;
  cursorPositions: number[];
  view?: EditorView; // View might not be available in all contexts (e.g., StateField.update)
  decorations?: DecorationItem[]; // Optional array for collecting decorations to sort later
  currentMode: 'live' | 'preview';
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
