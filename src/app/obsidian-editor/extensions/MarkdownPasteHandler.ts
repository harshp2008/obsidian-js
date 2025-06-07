import { EditorView } from '@codemirror/view'; 
import { Prec } from '@codemirror/state';
import { marked } from 'marked';

// Regex to find *italic* text, ensuring it's not part of **bold** or escaped.
// - (?<![\\*]): Negative lookbehind for a backslash or an asterisk.
// - \\*: Matches the literal asterisk.
// - ([\\s\\S]*?): Matches any character (including newlines) non-greedily.
// - \\*: Matches the literal closing asterisk.
// - (?![\\*]): Negative lookahead for an asterisk.
// Robust regex for *italic*
const asteriskItalicRegex = /(?<![\\*])\*(?!\*)([\s\S]+?)(?<!\*)\*/g; // Content must not be empty
// Regex for __bold__
const underscoreBoldRegex = /__([\s\S]+?)__/g;

/**
 * Handler for clipboard paste events to apply Markdown formatting
 */
export const markdownPasteHandler = Prec.highest(EditorView.domEventHandlers({
  paste(event: ClipboardEvent, view: EditorView): boolean {
    console.log('[MarkdownPasteHandler] Paste event triggered.'); 

    const clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) {
      console.log('[MarkdownPasteHandler] No clipboard data found.'); 
      return false;
    }

    let pastedText = clipboardData.getData('text/plain');
    console.log('[MarkdownPasteHandler] Original pastedText:', JSON.stringify(pastedText)); 

    if (!pastedText) {
      console.log('[MarkdownPasteHandler] No plain text in clipboard.'); 
      return false;
    }

    // 1. Pre-processing: __bold__ -> **bold**
    let textToConvert = pastedText.replace(/__([\s\S]+?)__/g, '**$1**');
    console.log('[MarkdownPasteHandler] After __ -> ** conversion:', JSON.stringify(textToConvert));

    // 2. Convert Markdown to inline HTML using marked.parseInline()
    const htmlOutput = marked.parseInline(textToConvert, { gfm: true }); // `breaks` option is not typically used with parseInline
    console.log('[MarkdownPasteHandler] Inline HTML output from marked:', JSON.stringify(htmlOutput));

    // 3. Convert specific HTML tags back to desired Markdown style
    let convertedText = htmlOutput;

    // Correct marked's GFM output for escaped em/strong: \<em> -> <em>, \<strong> -> <strong>, etc.
    // This handles cases where marked might output e.g. "Escaped \<em>italic\</em>"
    convertedText = convertedText.replace(/\\<em>/g, '<em>');
    convertedText = convertedText.replace(/\\<\/em>/g, '</em>');
    convertedText = convertedText.replace(/\\<strong>/g, '<strong>');
    convertedText = convertedText.replace(/\\<\/strong>/g, '</strong>');

    // Handle nested bold and italic first (most specific)
    // <em><strong>text</strong></em> -> _**text**_
    convertedText = convertedText.replace(/<em><strong>([\s\S]+?)<\/strong><\/em>/g, '_**$1**_');
    // <strong><em>text</em></strong> -> **_text_** (if marked produces this order)
    convertedText = convertedText.replace(/<strong><em>([\s\S]+?)<\/em><\/strong>/g, '**_$1_**');

    // Handle standalone bold: <strong>text</strong> -> **text**
    convertedText = convertedText.replace(/<strong>([\s\S]+?)<\/strong>/g, '**$1**');

    // Handle standalone italic: <em>text</em> -> _text_
    convertedText = convertedText.replace(/<em>([\s\S]+?)<\/em>/g, '_$1_');
    
    // Basic cleanup: decode HTML entities that marked might introduce
    const tempElement = document.createElement('textarea');
    tempElement.innerHTML = convertedText;
    convertedText = tempElement.value.trim(); // Decode and trim whitespace

    console.log('[MarkdownPasteHandler] Final convertedText after HTML to Markdown style:', JSON.stringify(convertedText));

    if (convertedText !== pastedText) {
      console.log('[MarkdownPasteHandler] Text was modified. Dispatching transaction.');
      view.dispatch(view.state.replaceSelection(convertedText));
      return true; // Indicate that we've handled the paste
    }

    console.log('[MarkdownPasteHandler] Text was not modified by conversion. Allowing default paste.');
    return false; 
  }
})); 