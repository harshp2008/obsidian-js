import { Plugin } from '../../../src/app/obsidian-editor/extensions/plugin-api';
import { createStateField } from '../../../src/app/obsidian-editor/extensions/plugin-api/ExtensionPoints';
import { EditorView, Decoration } from '@codemirror/view';
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
      console.log('[Demo Word Count Plugin] Document statistics:', stats);
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
    
    console.log('[Demo Word Count Plugin] Plugin disabled');
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
    console.log('[Word Count Plugin] Creating/updating status bar');
    const stats = this.getDocumentStats(view.state.doc.toString());
    
    // Log the stats for debugging
    console.log(`[Word Count Plugin] Document stats: ${stats.words} words, ${stats.chars} chars, ${stats.lines} lines`);
    
    // Skip DOM update if stats haven't changed
    if (
      this.statusElement && 
      stats.words === this.lastCounts.words && 
      stats.chars === this.lastCounts.chars && 
      stats.lines === this.lastCounts.lines
    ) {
      console.log('[Word Count Plugin] Stats unchanged, skipping update');
      return;
    }
    
    this.lastCounts = stats;
    
    if (!this.statusElement) {
      console.log('[Word Count Plugin] Creating new status bar element');
      // Create the element if it doesn't exist
      this.statusElement = document.createElement('div');
      this.statusElement.className = 'word-count-status';
      
      // Check if view.dom has a parent before appending
      if (view.dom.parentElement) {
        view.dom.parentElement.appendChild(this.statusElement);
        console.log('[Word Count Plugin] Status bar element added to DOM');
      } else {
        console.warn('[Word Count Plugin] Cannot add status bar - editor DOM has no parent');
      }
      
      // Add click handler to show full stats
      this.statusElement.addEventListener('click', () => {
        if (view) {
          this.executeCommand('show-word-count');
        }
      });
    } else {
      console.log('[Word Count Plugin] Updating existing status bar element');
    }
    
    // Update the content
    this.statusElement.innerHTML = `${stats.words} words`;
    this.statusElement.title = 
      `${stats.words} words\n${stats.chars} characters\n${stats.lines} lines`;
    console.log('[Word Count Plugin] Status bar updated');
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
      try {
        console.log('[Word Count Plugin] Computing long paragraph decorations');
        const builder = new RangeSetBuilder<Decoration>();
        const doc = state.doc;
        
        // Log document content for debugging
        console.log(`[Word Count Plugin] Document has ${doc.lines} lines`);
        
        // Safely process the document line by line rather than splitting
        // which could lead to position calculation errors
        let paraStart = 0;
        let currentPara = '';
        let lineCount = doc.lines;
        let longParasFound = 0;
        
        for (let i = 1; i <= lineCount; i++) {
          const line = doc.line(i);
          const isEmptyLine = line.text.trim() === '';
          
          // If we encounter an empty line or reach the end, process the paragraph
          if (isEmptyLine || i === lineCount) {
            if (currentPara.trim() !== '') {
              const wordCount = currentPara.split(/\s+/).filter(Boolean).length;
              
              // If the paragraph has more than 100 words, highlight it
              if (wordCount > 100) {
                console.log(`[Word Count Plugin] Found long paragraph (${wordCount} words) from ${paraStart} to ${line.from - 1}`);
                longParasFound++;
                
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
        
        console.log(`[Word Count Plugin] Found ${longParasFound} long paragraphs`);
        return builder.finish();
      } catch (error) {
        console.error('[Word Count Plugin] Error in paragraph highlighter:', error);
        return Decoration.none;
      }
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
    author: 'Obsidian-js Demo Team'
  });
} 