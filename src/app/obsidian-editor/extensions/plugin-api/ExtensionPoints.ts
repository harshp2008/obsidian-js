import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, keymap } from '@codemirror/view';
import { Extension, RangeSetBuilder, StateField, Transaction } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

/**
 * Creates a decoration extension that adds decorations to specific types of nodes in the syntax tree
 * 
 * @param nodeTypes - Array of syntax node types to match
 * @param createDecoration - Function that creates decorations for matching nodes
 * @returns CodeMirror extension
 */
export function createSyntaxDecorator(
  nodeTypes: string[], 
  createDecoration: (node: any, view: EditorView) => Decoration | null
): Extension {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      
      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter: (node) => {
            if (nodeTypes.includes(node.type.name)) {
              const decoration = createDecoration(node, view);
              if (decoration) {
                builder.add(node.from, node.to, decoration);
              }
            }
          }
        });
      }
      
      return builder.finish();
    }
  }, {
    decorations: v => v.decorations
  });
}

/**
 * Creates an extension that tracks specific events in the editor
 * 
 * @param options - Configuration options for the tracker
 * @returns CodeMirror extension
 */
export function createEventTracker(options: {
  onDocChanged?: (update: ViewUpdate) => void;
  onSelectionChanged?: (update: ViewUpdate) => void;
  onViewportChanged?: (update: ViewUpdate) => void;
  onTransaction?: (tr: Transaction, view: EditorView) => void;
}): Extension {
  return ViewPlugin.fromClass(class {
    constructor(view: EditorView) {}
    
    update(update: ViewUpdate) {
      if (update.docChanged && options.onDocChanged) {
        options.onDocChanged(update);
      }
      
      if (update.selectionSet && options.onSelectionChanged) {
        options.onSelectionChanged(update);
      }
      
      if (update.viewportChanged && options.onViewportChanged) {
        options.onViewportChanged(update);
      }
      
      update.transactions.forEach(tr => {
        if (options.onTransaction) {
          options.onTransaction(tr, update.view);
        }
      });
    }
  });
}

/**
 * Creates a state field to store and persist plugin data
 * 
 * @param initialValue - Initial value for the state field
 * @param update - Function to update the state field value
 * @returns CodeMirror state field extension
 */
export function createStateField<T>(
  initialValue: T,
  update: (value: T, tr: Transaction) => T
): StateField<T> {
  return StateField.define<T>({
    create: () => initialValue,
    update: (value, tr) => update(value, tr)
  });
}

/**
 * Creates a custom keymap handler
 * 
 * @param key - Key combination (e.g., "Ctrl-b")
 * @param run - Handler function
 * @returns CodeMirror extension
 */
export function createKeymap(
  key: string,
  run: (view: EditorView) => boolean
): Extension {
  return keymap.of([{
    key,
    run
  }]);
}

/**
 * Utility for creating inline decorations for text matching a pattern
 * 
 * @param pattern - Regular expression pattern to match
 * @param createDecoration - Function to create a decoration for each match
 * @returns CodeMirror extension
 */
export function createInlineDecorator(
  pattern: RegExp,
  createDecoration: (match: RegExpExecArray, view: EditorView) => Decoration | null
): Extension {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        let match;
        
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null) {
          const decoration = createDecoration(match, view);
          if (decoration) {
            const matchFrom = from + match.index;
            const matchTo = matchFrom + match[0].length;
            builder.add(matchFrom, matchTo, decoration);
          }
        }
      }
      
      return builder.finish();
    }
  }, {
    decorations: v => v.decorations
  });
}

/**
 * Creates a plugin that can modify document text as it's being entered
 * 
 * @param shouldActivate - Function to determine if the modification should happen
 * @param modifyText - Function to modify the text
 * @returns CodeMirror extension
 */
export function createTextModifier(
  shouldActivate: (text: string, from: number, to: number, view: EditorView) => boolean,
  modifyText: (text: string, from: number, to: number, view: EditorView) => string
): Extension {
  return EditorView.updateListener.of(update => {
    if (!update.docChanged) return;
    
    update.transactions.forEach(tr => {
      if (!tr.isUserEvent("input")) return;
      
      tr.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
        const insertedText = update.state.doc.sliceString(fromB, toB);
        
        if (shouldActivate(insertedText, fromB, toB, update.view)) {
          const newText = modifyText(insertedText, fromB, toB, update.view);
          
          if (newText !== insertedText) {
            // Schedule the change for the next update cycle to avoid conflicts
            setTimeout(() => {
              update.view.dispatch({
                changes: { from: fromB, to: toB, insert: newText },
                userEvent: "input.textModifier"
              });
            }, 0);
          }
        }
      });
    });
  });
} 