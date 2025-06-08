import { EditorSelection } from '@codemirror/state';

/**
 * Change type representing a text change in the editor.
 * @interface TextChange
 */
interface TextChange {
  from: number;
  to: number;
  insert: string;
}

/**
 * Result of a formatting operation.
 * @interface FormattingResult
 */
interface FormattingResult {
  changes: TextChange[];
  selection?: EditorSelection;
}

/**
 * Toggles bold formatting for the selected text.
 * If no text is selected, inserts "**" markers and places cursor between them.
 * 
 * @param selection - The current editor selection
 * @param doc - The current document text
 * @returns FormattingResult with changes to apply
 */
export function toggleBold(selection: EditorSelection, doc: string): FormattingResult {
  const changes: TextChange[] = [];
  let newSelection: EditorSelection | undefined;
  
  // Handle each range in the selection
  for (const range of selection.ranges) {
    if (range.empty) {
      // No selection - insert bold markers and place cursor between them
      changes.push({
        from: range.from,
        to: range.to,
        insert: '**bold text**'
      });
      
      // Position cursor inside the bold markers (after '**')
      const cursorPos = range.from + 2;
      newSelection = EditorSelection.cursor(cursorPos);
    } else {
      // Text is selected
      const selectedText = doc.slice(range.from, range.to);
      
      // Check if selection is already bold
      if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
        // Remove bold markers
        changes.push({
          from: range.from,
          to: range.to,
          insert: selectedText.slice(2, -2)
        });
      } else {
        // Add bold markers
        changes.push({
          from: range.from,
          to: range.to,
          insert: `**${selectedText}**`
        });
      }
    }
  }
  
  return { changes, selection: newSelection };
}

/**
 * Toggles italic formatting for the selected text.
 * If no text is selected, inserts "*" markers and places cursor between them.
 * 
 * @param selection - The current editor selection
 * @param doc - The current document text
 * @returns FormattingResult with changes to apply
 */
export function toggleItalic(selection: EditorSelection, doc: string): FormattingResult {
  const changes: TextChange[] = [];
  let newSelection: EditorSelection | undefined;
  
  for (const range of selection.ranges) {
    if (range.empty) {
      // No selection - insert italic markers and place cursor between them
      changes.push({
        from: range.from,
        to: range.to,
        insert: '*italic text*'
      });
      
      // Position cursor inside the italic markers (after '*')
      const cursorPos = range.from + 1;
      newSelection = EditorSelection.cursor(cursorPos);
    } else {
      // Text is selected
      const selectedText = doc.slice(range.from, range.to);
      
      // Check if selection is already italic
      if (selectedText.startsWith('*') && selectedText.endsWith('*') && 
          !(selectedText.startsWith('**') && selectedText.endsWith('**'))) {
        // Remove italic markers
        changes.push({
          from: range.from,
          to: range.to,
          insert: selectedText.slice(1, -1)
        });
      } else {
        // Add italic markers
        changes.push({
          from: range.from,
          to: range.to,
          insert: `*${selectedText}*`
        });
      }
    }
  }
  
  return { changes, selection: newSelection };
}

/**
 * Toggles heading of specified level for the current line.
 * If the line already has a heading of the specified level, removes it.
 * 
 * @param selection - The current editor selection
 * @param doc - The current document text
 * @param level - Heading level (1-6)
 * @returns FormattingResult with changes to apply
 */
export function toggleHeading(
  selection: EditorSelection, 
  doc: string, 
  level: number
): FormattingResult {
  const changes: TextChange[] = [];
  
  // Validate heading level
  if (level < 1 || level > 6) {
    console.error('Invalid heading level. Must be between 1 and 6.');
    return { changes: [] };
  }
  
  // Create heading marker based on level
  const headingMarker = '#'.repeat(level) + ' ';
  
  for (const range of selection.ranges) {
    // Find the start of the line containing the selection
    let lineStart = range.from;
    while (lineStart > 0 && doc.charAt(lineStart - 1) !== '\n') {
      lineStart--;
    }
    
    // Get the current line content
    const lineEndSearch = doc.indexOf('\n', lineStart);
    const lineEnd = lineEndSearch === -1 ? doc.length : lineEndSearch;
    const line = doc.slice(lineStart, lineEnd);
    
    // Check if line already has a heading 
    const headingRegex = /^(#{1,6})\s/;
    const match = line.match(headingRegex);
    
    if (match && match[1].length === level) {
      // Remove heading of the same level
      changes.push({
        from: lineStart,
        to: lineStart + match[0].length,
        insert: ''
      });
    } else if (match) {
      // Replace existing heading with new level
      changes.push({
        from: lineStart,
        to: lineStart + match[0].length,
        insert: headingMarker
      });
    } else {
      // Add heading marker to start of line
      changes.push({
        from: lineStart,
        to: lineStart,
        insert: headingMarker
      });
    }
  }
  
  return { changes };
}

/**
 * Creates a link with the selected text as the label.
 * If no text is selected, inserts a template link and selects the label part.
 * 
 * @param selection - The current editor selection
 * @param doc - The current document text
 * @returns FormattingResult with changes to apply
 */
export function createLink(selection: EditorSelection, doc: string): FormattingResult {
  const changes: TextChange[] = [];
  let newSelection: EditorSelection | undefined;
  
  for (const range of selection.ranges) {
    if (range.empty) {
      // No selection - insert link template
      const template = '[link text](url)';
      changes.push({
        from: range.from,
        to: range.to,
        insert: template
      });
      
      // Select the "link text" part for easy replacement
      newSelection = EditorSelection.range(
        range.from + 1,
        range.from + 10
      );
    } else {
      // Use selected text as link text
      const selectedText = doc.slice(range.from, range.to);
      changes.push({
        from: range.from,
        to: range.to,
        insert: `[${selectedText}](url)`
      });
      
      // Place cursor at the URL position
      newSelection = EditorSelection.cursor(range.from + selectedText.length + 3);
    }
  }
  
  return { changes, selection: newSelection };
}

/**
 * Toggles a code block or inline code formatting.
 * - For multi-line selections: Uses fenced code blocks ```
 * - For single-line selections: Uses inline code formatting `code`
 * 
 * @param selection - The current editor selection
 * @param doc - The current document text
 * @returns FormattingResult with changes to apply
 */
export function toggleCode(selection: EditorSelection, doc: string): FormattingResult {
  const changes: TextChange[] = [];
  let newSelection: EditorSelection | undefined;
  
  for (const range of selection.ranges) {
    if (range.empty) {
      // No selection - insert inline code markers
      changes.push({
        from: range.from,
        to: range.to,
        insert: '`code`'
      });
      
      // Select the word "code" for easy replacement
      newSelection = EditorSelection.range(
        range.from + 1, 
        range.from + 5
      );
    } else {
      const selectedText = doc.slice(range.from, range.to);
      
      // Check if selection contains multiple lines
      if (selectedText.includes('\n')) {
        // Multi-line selection - use code block
        if (selectedText.startsWith('```') && selectedText.endsWith('```')) {
          // Remove code block formatting
          changes.push({
            from: range.from,
            to: range.to,
            insert: selectedText.slice(3, -3).trim()
          });
        } else {
          // Add code block formatting
          changes.push({
            from: range.from,
            to: range.to,
            insert: `\`\`\`\n${selectedText}\n\`\`\``
          });
        }
      } else {
        // Single line - use inline code
        if (selectedText.startsWith('`') && selectedText.endsWith('`')) {
          // Remove inline code formatting
          changes.push({
            from: range.from,
            to: range.to,
            insert: selectedText.slice(1, -1)
          });
        } else {
          // Add inline code formatting
          changes.push({
            from: range.from,
            to: range.to,
            insert: `\`${selectedText}\``
          });
        }
      }
    }
  }
  
  return { changes, selection: newSelection };
} 