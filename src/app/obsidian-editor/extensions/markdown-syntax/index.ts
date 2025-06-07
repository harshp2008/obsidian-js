import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder, StateField, StateEffect, EditorState, Extension } from '@codemirror/state';
import { SyntaxRule, SyntaxRuleContext } from './types';
import { HeadingDecorator } from './rules/headingDecorator';
import { BoldDecorator } from './rules/boldDecorator';
import { ItalicDecorator } from './rules/italicDecorator';
import { StrikethroughDecorator } from './rules/strikethroughDecorator';
import { CodeDecorator } from './rules/codeDecorator';
import { HighlightDecorator } from './rules/highlightDecorator';
import { OldBoldDecorator } from './rules/oldBoldDecorator';
import { OldItalicDecorator } from './rules/oldItalicDecorator';
import { ListDecorator } from './rules/listDecorator';
import { FencedCodeBlockDecorator } from './rules/FencedCodeBlockDecorator';
import { HorizontalRuleDecorator } from './rules/horizontalRuleDecorator';
import { LineBreakDecorator } from './rules/lineBreakDecorator';
import { HTMLTagDecorator } from './html-decorator';
import { BlockquoteDecorator } from './rules/blockquoteDecorator';

/**
 * Represents a decoration item with its position and decoration object
 */
interface DecorationItem {
  /** Start position of the decoration */
  from: number;
  /** End position of the decoration */
  to: number;
  /** The decoration object to apply */
  decoration: Decoration;
}

/**
 * Array of syntax rules to apply for markdown formatting
 * Each rule handles a specific markdown syntax feature
 */
const syntaxRules: SyntaxRule[] = [
  new HeadingDecorator(),
  new BoldDecorator(),
  new ItalicDecorator(),
  new StrikethroughDecorator(),
  new CodeDecorator(),
  new HighlightDecorator(),
  new OldBoldDecorator(),
  new OldItalicDecorator(),
  new ListDecorator(),
  new BlockquoteDecorator(),
  new FencedCodeBlockDecorator(),
  // HorizontalRuleDecorator is now a ViewPlugin and managed separately
];

/**
 * StateEffect to change the rendering mode between live editing and preview
 * This allows toggling between showing markdown syntax or rendered content
 */
export const setMarkdownSyntaxMode = StateEffect.define<'live' | 'preview'>();

/**
 * Helper function to build decorations for legacy syntax rules
 * 
 * @param state - The current editor state
 * @param currentMode - The current rendering mode ('live' or 'preview')
 * @param view - Optional editor view, used to determine visible ranges
 * @returns A DecorationSet containing all markdown syntax decorations
 */
function buildLegacyDecorations(state: EditorState, currentMode: 'live' | 'preview', view?: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const allDecorations: DecorationItem[] = [];

  // Collect all cursor positions to determine which syntax elements should be highlighted
  const cursorPositions: number[] = [];
  for (const range of state.selection.ranges) {
    cursorPositions.push(range.head);
  }
  
  // Determine which ranges of the document to process
  const rangesToProcess = view ? view.visibleRanges : [{ from: 0, to: state.doc.length }];

  // Process each visible range
  for (const { from, to } of rangesToProcess) {
    const docTextSlice = state.doc.sliceString(from, to);
    
    // Create the context for syntax rules
    const context: SyntaxRuleContext = {
      builder,
      docText: docTextSlice,
      textSliceFrom: from,
      cursorPositions,
      state: state,
      view: view,
      decorations: allDecorations,
      currentMode: currentMode
    };

    // Apply each syntax rule
    for (const rule of syntaxRules) {
      try {
        if (typeof rule.process === 'function') {
          rule.process(context);
        } else {
          console.warn(`Rule ${rule.constructor.name} does not have a process method.`);
        }
      } catch (error) {
        console.error('Error processing legacy rule:', rule.constructor.name, error);
      }
    }
  }

  // Sort and add decorations to the builder to handle overlaps correctly
  const groupedDecorations = new Map<number, DecorationItem[]>();
  for (const item of allDecorations) {
    if (!groupedDecorations.has(item.from)) {
      groupedDecorations.set(item.from, []);
    }
    if (item.decoration) {
        groupedDecorations.get(item.from)!.push(item);
    } else {
        console.warn("Encountered an item with undefined decoration during legacy build:", item);
    }
  }
  
  // Sort decorations by position and add them to the builder
  const sortedFromPositions = [...groupedDecorations.keys()].sort((a, b) => a - b);
  for (const fromPos of sortedFromPositions) {
    const group = groupedDecorations.get(fromPos)!;
    group.sort((a, b) => a.to - b.to); // Sort by 'to' within each 'from' group
    for (const item of group) {
      builder.add(item.from, item.to, item.decoration);
    }
  }
  
  return builder.finish();
}

/**
 * StateField that manages markdown syntax decorations
 * This keeps track of the current mode and decorations,
 * and updates them when necessary
 */
export const markdownSyntaxStateField = StateField.define<{
  /** The current set of decorations */
  decorations: DecorationSet;
  /** The current rendering mode */
  currentMode: 'live' | 'preview';
}>({
  /**
   * Creates the initial state for the field
   * @param state - The editor state
   * @returns The initial field value
   */
  create(state) {
    const initialMode = 'live'; 
    return {
      decorations: buildLegacyDecorations(state, initialMode, undefined),
      currentMode: initialMode,
    };
  },

  /**
   * Updates the field value based on transactions
   * @param value - The current field value
   * @param tr - The transaction to apply
   * @returns The updated field value
   */
  update(value, tr) {
    let newMode = value.currentMode;
    let needsRebuild = false;

    // Check for mode change effects
    for (const effect of tr.effects) {
      if (effect.is(setMarkdownSyntaxMode)) {
        newMode = effect.value;
        needsRebuild = true;
      }
    }

    let modeChangedByEffect = false;
    for (const effect of tr.effects) {
      if (effect.is(setMarkdownSyntaxMode)) {
        if (newMode !== effect.value) {
            newMode = effect.value;
            modeChangedByEffect = true;
        }
      }
    }

    // Rebuild decorations if document changed, selection changed, or mode changed
    if (tr.docChanged || 
        (tr.selection && !tr.startState.selection.eq(tr.selection)) || 
        modeChangedByEffect) {
      return {
        decorations: buildLegacyDecorations(tr.state, newMode, undefined),
        currentMode: newMode,
      };
    }
    
    // If mode changed without other triggers (e.g. initial load with a different mode)
    if (value.currentMode !== newMode) {
        return {
            decorations: buildLegacyDecorations(tr.state, newMode, undefined),
            currentMode: newMode,
        };
    }

    return value; // No change to decorations or mode
  },

  /**
   * Provides the decorations to the editor view
   */
  provide: f => EditorView.decorations.from(f, value => value.decorations)
});

/**
 * Creates the markdown syntax plugin with all necessary extensions
 * @returns An array of extensions for markdown syntax highlighting
 */
export function createMarkdownSyntaxPlugin(): Extension[] {
  return [
    markdownSyntaxStateField,
    LineBreakDecorator,
    HTMLTagDecorator,
    HorizontalRuleDecorator
  ];
}

