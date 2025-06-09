import { Plugin, createStateField } from '../index';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { Extension, RangeSetBuilder } from '@codemirror/state';

/**
 * A plugin that counts words, characters, and lines in the document
 * Also displays a word count indicator in the editor
 */
export class WordCountPlugin extends Plugin {
  // Store for the element that displays the word count
  private statusElement: HTMLElement | null = null;
  
  // Store the style element for cleanup
  private styleElement: HTMLStyleElement | null = null;
  
  // Store counts to avoid unnecessary DOM updates
  private lastCounts = { words: 0, chars: 0, lines: 0 };
  
  /**
   * Enable the plugin
   */
  protected async onEnable(): Promise<void> {
    // Add styles for the word count display
    this.addStyles();
    
    // Create state field to track document statistics
    const statsStateField = createStateField(
      { words: 0, chars: 0, lines: 0 },
      (value, tr) => {
        if (tr.docChanged) {
          const text = tr.newDoc.toString();
          return {
            words: text.split(/\s+/).filter(Boolean).length,
            chars: text.length,
            lines: tr.newDoc.lines
          };
        }
        return value;
      }
    );
    
    // Register the state field
    this.registerExtension('stats-state-field', statsStateField);
    
    // Create an extension for the status bar
    const statusBarExtension = EditorView.updateListener.of(update => {
      if (update.docChanged || !this.statusElement) {
        this.createOrUpdateStatusBar(update.view);
      }
    });
    
    // Register the status bar extension
    this.registerExtension('status-bar-extension', statusBarExtension);
    
    // Add a command to show word count stats in an alert
    this.registerCommand(
      'show-word-count',
      'Show Word Count Statistics',
      (view) => {
        const stats = this.getDocumentStats(view.state.doc.toString());
        alert(
          `Document Statistics:\n` +
          `- Words: ${stats.words}\n` +
          `- Characters: ${stats.chars}\n` +
          `- Lines: ${stats.lines}`
        );
        return true;
      }
    );
    
    // Setup highlight for long paragraphs
    this.registerExtension(
      'long-paragraph-highlighter',
      this.createLongParagraphHighlighter()
    );
    
    // Add a hook for document changes to log stats in console
    this.registerHook('document:change', (content: string) => {
      const stats = this.getDocumentStats(content);
      console.log('Document statistics:', stats);
    });
  }
  
  /**
   * Clean up when the plugin is disabled
   */
  protected async onDisable(): Promise<void> {
    // Remove the status bar element if it exists
    if (this.statusElement && this.statusElement.parentElement) {
      this.statusElement.parentElement.removeChild(this.statusElement);
      this.statusElement = null;
    }
    
    // Remove the styles
    if (this.styleElement && this.styleElement.parentElement) {
      this.styleElement.parentElement.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }
  
  /**
   * Add CSS styles for the plugin
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.id = `${this.manifest.id}-styles`;
    style.textContent = `
      .word-count-status {
        position: absolute;
        bottom: 8px;
        right: 10px;
        font-size: 12px;
        color: #888;
        user-select: none;
        z-index: 10;
        background: rgba(255, 255, 255, 0.7);
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
      }
      
      .word-count-status:hover {
        background: rgba(255, 255, 255, 0.9);
        color: #333;
      }
      
      .long-paragraph {
        background-color: rgba(255, 235, 235, 0.5);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
    this.styleElement = style;
  }
  
  /**
   * Create or update the status bar element
   */
  private createOrUpdateStatusBar(view: EditorView): void {
    const stats = this.getDocumentStats(view.state.doc.toString());
    
    // Skip DOM update if stats haven't changed
    if (
      this.statusElement && 
      stats.words === this.lastCounts.words && 
      stats.chars === this.lastCounts.chars && 
      stats.lines === this.lastCounts.lines
    ) {
      return;
    }
    
    this.lastCounts = stats;
    
    if (!this.statusElement) {
      // Create the element if it doesn't exist
      this.statusElement = document.createElement('div');
      this.statusElement.className = 'word-count-status';
      view.dom.parentElement?.appendChild(this.statusElement);
      
      // Add click handler to show full stats
      this.statusElement.addEventListener('click', () => {
        if (view) {
          this.executeCommand('show-word-count');
        }
      });
    }
    
    // Update the content
    this.statusElement.innerHTML = `${stats.words} words`;
    this.statusElement.title = 
      `${stats.words} words\n${stats.chars} characters\n${stats.lines} lines`;
  }
  
  /**
   * Calculate document statistics
   */
  private getDocumentStats(text: string) {
    return {
      words: text.split(/\s+/).filter(Boolean).length,
      chars: text.length,
      lines: (text.match(/\n/g) || []).length + 1
    };
  }
  
  /**
   * Create an extension that highlights long paragraphs
   * (more than 100 words)
   */
  private createLongParagraphHighlighter(): Extension {
    return EditorView.decorations.compute(["doc"], state => {
      const builder = new RangeSetBuilder<Decoration>();
      const doc = state.doc;
      
      // Safely process the document line by line rather than splitting
      // which could lead to position calculation errors
      let paraStart = 0;
      let currentPara = '';
      let lineCount = doc.lines;
      
      for (let i = 1; i <= lineCount; i++) {
        const line = doc.line(i);
        const isEmptyLine = line.text.trim() === '';
        
        // If we encounter an empty line or reach the end, process the paragraph
        if (isEmptyLine || i === lineCount) {
          if (currentPara.trim() !== '') {
            const wordCount = currentPara.split(/\s+/).filter(Boolean).length;
            
            // If the paragraph has more than 100 words, highlight it
            if (wordCount > 100) {
              builder.add(
                paraStart,
                line.from - 1, // End before the empty line
                Decoration.mark({
                  class: 'long-paragraph',
                  attributes: { title: `Long paragraph (${wordCount} words)` }
                })
              );
            }
          }
          
          // Start a new paragraph after this empty line
          paraStart = line.to;
          currentPara = '';
        } else {
          // Add this line to the current paragraph
          if (currentPara) {
            currentPara += ' ' + line.text;
          } else {
            currentPara = line.text;
            paraStart = line.from;
          }
        }
      }
      
      return builder.finish();
    });
  }
}

/**
 * Create an instance of the word count plugin
 */
export function createWordCountPlugin(): WordCountPlugin {
  return new WordCountPlugin({
    id: 'word-count',
    name: 'Word Count',
    version: '1.0.0',
    description: 'Displays word count and other document statistics',
    author: 'Obsidian-js Team'
  });
} 