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
 * Toggle bold formatting for the selected text
 * 
 * @param selection - The current editor selection
 * @param doc - The document text
 * @returns Changes to apply to the document
 */
export function toggleBold(selection: EditorSelection, doc: string) {
  const changes = [];
  const newSelections = [];
  
  for (const range of selection.ranges) {
    // Skip empty selections
    if (range.empty) {
      const from = range.from;
      changes.push({ from, to: from, insert: '**Bold text**' });
      newSelections.push(EditorSelection.range(from + 2, from + 10));
      continue;
    }
    
    const text = doc.slice(range.from, range.to);
    const isBold = text.startsWith('**') && text.endsWith('**');
    
    if (isBold) {
      // Remove bold formatting
      const innerText = text.slice(2, -2);
      changes.push({ from: range.from, to: range.to, insert: innerText });
      newSelections.push(EditorSelection.range(range.from, range.from + innerText.length));
    } else {
      // Add bold formatting
      changes.push({ from: range.from, to: range.to, insert: `**${text}**` });
      newSelections.push(EditorSelection.range(range.from, range.to + 4));
    }
  }
  
  return {
    changes,
    selection: EditorSelection.create(newSelections)
  };
}

/**
 * Toggle italic formatting for the selected text
 * 
 * @param selection - The current editor selection
 * @param doc - The document text
 * @returns Changes to apply to the document
 */
export function toggleItalic(selection: EditorSelection, doc: string) {
  const changes = [];
  const newSelections = [];
  
  for (const range of selection.ranges) {
    // Skip empty selections
    if (range.empty) {
      const from = range.from;
      changes.push({ from, to: from, insert: '*Italic text*' });
      newSelections.push(EditorSelection.range(from + 1, from + 12));
      continue;
    }
    
    const text = doc.slice(range.from, range.to);
    const isItalic = text.startsWith('*') && text.endsWith('*') && !text.startsWith('**');
    
    if (isItalic) {
      // Remove italic formatting
      const innerText = text.slice(1, -1);
      changes.push({ from: range.from, to: range.to, insert: innerText });
      newSelections.push(EditorSelection.range(range.from, range.from + innerText.length));
    } else {
      // Add italic formatting
      changes.push({ from: range.from, to: range.to, insert: `*${text}*` });
      newSelections.push(EditorSelection.range(range.from, range.to + 2));
    }
  }
  
  return {
    changes,
    selection: EditorSelection.create(newSelections)
  };
}

/**
 * Toggle heading formatting for the selected text
 * 
 * @param selection - The current editor selection
 * @param doc - The document text
 * @param level - Heading level (1-6)
 * @returns Changes to apply to the document
 */
export function toggleHeading(selection: EditorSelection, doc: string, level: number) {
  // Ensure level is between 1 and 6
  level = Math.max(1, Math.min(6, level));
  
  const changes = [];
  const newSelections = [];
  const prefix = '#'.repeat(level) + ' ';
  
  for (const range of selection.ranges) {
    // Get the line containing the selection
    const line = getLineAt(doc, range.from);
    
    // Check if the line already has a heading of this level
    const hasHeading = line.text.trimStart().startsWith(prefix);
    
    if (hasHeading) {
      // Remove heading
      const headingStart = line.from + line.text.indexOf(prefix);
      changes.push({ from: headingStart, to: headingStart + prefix.length, insert: '' });
      newSelections.push(EditorSelection.range(range.from - prefix.length, range.to - prefix.length));
    } else {
      // Check if the line has a different heading level
      const existingHeadingMatch = line.text.trimStart().match(/^(#{1,6})\s/);
      
      if (existingHeadingMatch) {
        // Replace existing heading with new heading level
        const existingPrefix = existingHeadingMatch[0];
        const headingStart = line.from + line.text.indexOf(existingPrefix);
        changes.push({ from: headingStart, to: headingStart + existingPrefix.length, insert: prefix });
        
        // Adjust selection based on difference in prefix length
        const diff = prefix.length - existingPrefix.length;
        newSelections.push(EditorSelection.range(range.from + diff, range.to + diff));
      } else {
        // Add heading to the start of the line
        changes.push({ from: line.from, to: line.from, insert: prefix });
        newSelections.push(EditorSelection.range(range.from + prefix.length, range.to + prefix.length));
      }
    }
  }
  
  return {
    changes,
    selection: EditorSelection.create(newSelections)
  };
}

/**
 * Get line information at a specific position in the document
 * 
 * @param doc - The document text
 * @param pos - Position in the document
 * @returns Line information (from, to, text)
 */
function getLineAt(doc: string, pos: number) {
  let lineStart = pos;
  let lineEnd = pos;
  
  // Find the start of the line
  while (lineStart > 0 && doc[lineStart - 1] !== '\n') {
    lineStart--;
  }
  
  // Find the end of the line
  while (lineEnd < doc.length && doc[lineEnd] !== '\n') {
    lineEnd++;
  }
  
  return {
    from: lineStart,
    to: lineEnd,
    text: doc.slice(lineStart, lineEnd)
  };
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
  let newRanges: Array<{anchor: number, head: number}> = [];
  
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
      newRanges.push({
        anchor: range.from + 1,
        head: range.from + 10
      });
    } else {
      // Use selected text as link text
      const selectedText = doc.slice(range.from, range.to);
      changes.push({
        from: range.from,
        to: range.to,
        insert: `[${selectedText}](url)`
      });
      
      // Place cursor at the URL position
      newRanges.push({
        anchor: range.from + selectedText.length + 3,
        head: range.from + selectedText.length + 3
      });
    }
  }
  
  return { 
    changes,
    selection: newRanges.length > 0 
      ? EditorSelection.create(
          newRanges.map(range => EditorSelection.range(range.anchor, range.head))
        ) 
      : undefined
  };
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
  const newRanges: Array<{anchor: number, head: number}> = [];
  
  for (const range of selection.ranges) {
    if (range.empty) {
      // No selection - insert inline code markers
      changes.push({
        from: range.from,
        to: range.to,
        insert: '`code`'
      });
      
      // Select the word "code" for easy replacement
      newRanges.push({
        anchor: range.from + 1,
        head: range.from + 5
      });
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
  
  return { 
    changes,
    selection: newRanges.length > 0 
      ? EditorSelection.create(
          newRanges.map(range => EditorSelection.range(range.anchor, range.head))
        ) 
      : undefined
  };
} 