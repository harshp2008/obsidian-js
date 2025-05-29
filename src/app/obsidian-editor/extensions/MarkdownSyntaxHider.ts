import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Create a ViewPlugin for hiding markdown syntax
export const markdownSyntaxHider = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      const cursor = view.state.selection.main.head;
      
      // Process each visible line
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        
        // Process headings first
        this.processHeadings(builder, from, text, cursor);
        
        // Process formatting elements
        this.processFormatting(builder, from, text, cursor);
      }

      return builder.finish();
    }
    
    // Process headings (# Heading)
    processHeadings(builder: RangeSetBuilder<Decoration>, start: number, text: string, cursor: number) {
      const headingRegex = /^(#{1,6})\s(.*)$/gm;
      let match;
      
      while ((match = headingRegex.exec(text)) !== null) {
        const lineStart = start + match.index;
        const hashMarks = match[1];
        const hashCount = hashMarks.length;
        
        // Calculate positions
        const hashStart = lineStart;
        const hashEnd = hashStart + hashCount;
        const spaceEnd = hashEnd + 1; // +1 for the space after #
        const lineEnd = lineStart + match[0].length;
        
        // Check if cursor is near the heading marker
        const isCursorNearHash = cursor >= hashStart && cursor <= spaceEnd;
        
        // Apply decoration to # symbols and the space
        if (!isCursorNearHash) {
          // Hide the # symbols when cursor is not near
          builder.add(hashStart, hashEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(hashEnd, spaceEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        } else {
          // Show the # symbols when cursor is near
          builder.add(hashStart, hashEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(hashEnd, spaceEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        }
        
        // Apply heading styling to the text content
        builder.add(spaceEnd, lineEnd, Decoration.mark({ class: `markdown-heading-${hashCount}` }));
      }
    }
    
    // Process all formatting elements
    processFormatting(builder: RangeSetBuilder<Decoration>, start: number, text: string, cursor: number) {
      // Process bold text with ** and __
      this.processBold(builder, start, text, cursor);
      
      // Process italic text with * and _
      this.processItalic(builder, start, text, cursor);
      
      // Process strikethrough text
      this.processStrikethrough(builder, start, text, cursor);
      
      // Process highlighting
      this.processHighlight(builder, start, text, cursor);
      
      // Process edge cases with adjacent formatting
      this.processEdgeCases(builder, start, text, cursor);
    }
    
    // Process bold text (**bold**)
    processBold(builder: RangeSetBuilder<Decoration>, start: number, text: string, cursor: number) {
      // Find all **bold** patterns
      const boldPattern = /\*\*(.*?)\*\*/g;
      let match;
      
      while ((match = boldPattern.exec(text)) !== null) {
        const matchStart = start + match.index;
        const matchEnd = matchStart + match[0].length;
        
        const openStart = matchStart;
        const openEnd = matchStart + 2; // ** is 2 chars
        
        const closeStart = matchEnd - 2; // ** is 2 chars
        const closeEnd = matchEnd;
        
        // Check if cursor is inside the bold text
        const isCursorInBold = cursor >= matchStart && cursor <= matchEnd;
        
        if (isCursorInBold) {
          // Show both markers when cursor is inside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Always apply bold styling to content
        builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-bold-active' }));
      }
      
      // Find all __bold__ patterns
      const boldUnderscorePattern = /__(.*?)__/g;
      
      while ((match = boldUnderscorePattern.exec(text)) !== null) {
        const matchStart = start + match.index;
        const matchEnd = matchStart + match[0].length;
        
        const openStart = matchStart;
        const openEnd = matchStart + 2; // __ is 2 chars
        
        const closeStart = matchEnd - 2; // __ is 2 chars
        const closeEnd = matchEnd;
        
        // Check if cursor is inside the bold text
        const isCursorInBold = cursor >= matchStart && cursor <= matchEnd;
        
        if (isCursorInBold) {
          // Show both markers when cursor is inside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Always apply bold styling to content
        builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-bold-active' }));
      }
    }
    
    // Process italic text (*italic*)
    processItalic(builder: RangeSetBuilder<Decoration>, start: number, text: string, cursor: number) {
      // Find all *italic* patterns
      const italicPattern = /\*(.*?)\*/g;
      let match;
      
      // Keep track of positions we've already processed
      const processedPositions = new Set<number>();
      
      try {
        while ((match = italicPattern.exec(text)) !== null) {
          const matchStart = start + match.index;
          const matchEnd = matchStart + match[0].length;
          
          // Skip if we've already processed this position
          if (processedPositions.has(matchStart)) {
            continue;
          }
          
          // Skip if this is part of a bold marker
          // Check if the asterisk is part of a bold marker
          const prevChar = match.index > 0 ? text.charAt(match.index - 1) : '';
          const nextChar = match.index + 1 < text.length ? text.charAt(match.index + 1) : '';
          const endPrevChar = match.index + match[0].length - 2 >= 0 ? text.charAt(match.index + match[0].length - 2) : '';
          const endNextChar = match.index + match[0].length < text.length ? text.charAt(match.index + match[0].length) : '';
          
          // Skip if it's part of a bold marker
          if (prevChar === '*' || nextChar === '*' || endPrevChar === '*' || endNextChar === '*') {
            // This is likely part of a bold marker or adjacent formatting
            // Let the edge cases handler deal with it
            continue;
          }
          
          // Mark this position as processed
          processedPositions.add(matchStart);
          
          const openStart = matchStart;
          const openEnd = matchStart + 1; // * is 1 char
          
          const closeStart = matchEnd - 1; // * is 1 char
          const closeEnd = matchEnd;
          
          // Check if cursor is inside the italic text
          const isCursorInItalic = cursor >= matchStart && cursor <= matchEnd;
          
          if (isCursorInItalic) {
            // Show both markers when cursor is inside
            builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
            builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          } else {
            // Hide both markers when cursor is outside
            builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
            builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          }
          
          // Always apply italic styling to content
          builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-italic-active' }));
        }
      } catch (e) {
        // Fallback if the regex with lookahead/lookbehind doesn't work
        const simpleItalicPattern = /\*([^*]+)\*/g;
        
        while ((match = simpleItalicPattern.exec(text)) !== null) {
          // Skip if this is part of a bold marker
          if (text.substring(match.index - 1, match.index + 1) === '**' || 
              text.substring(match.index + match[0].length - 1, match.index + match[0].length + 1) === '**') {
            continue;
          }
          
          const matchStart = start + match.index;
          const matchEnd = matchStart + match[0].length;
          
          const openStart = matchStart;
          const openEnd = matchStart + 1; // * is 1 char
          
          const closeStart = matchEnd - 1; // * is 1 char
          const closeEnd = matchEnd;
          
          // Check if cursor is inside the italic text
          const isCursorInItalic = cursor >= matchStart && cursor <= matchEnd;
          
          if (isCursorInItalic) {
            // Show both markers when cursor is inside
            builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
            builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          } else {
            // Hide both markers when cursor is outside
            builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
            builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          }
          
          // Always apply italic styling to content
          builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-italic-active' }));
        }
      }
      
      // Find all _italic_ patterns
      const italicUnderscorePattern = /(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g;
      
      try {
        while ((match = italicUnderscorePattern.exec(text)) !== null) {
          const matchStart = start + match.index;
          const matchEnd = matchStart + match[0].length;
          
          const openStart = matchStart;
          const openEnd = matchStart + 1; // _ is 1 char
          
          const closeStart = matchEnd - 1; // _ is 1 char
          const closeEnd = matchEnd;
          
          // Check if cursor is inside the italic text
          const isCursorInItalic = cursor >= matchStart && cursor <= matchEnd;
          
          if (isCursorInItalic) {
            // Show both markers when cursor is inside
            builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
            builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          } else {
            // Hide both markers when cursor is outside
            builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
            builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          }
          
          // Always apply italic styling to content
          builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-italic-active' }));
        }
      } catch (e) {
        // Fallback if the regex with lookahead/lookbehind doesn't work
        const simpleItalicUnderscorePattern = /_([^_]+)_/g;
        
        while ((match = simpleItalicUnderscorePattern.exec(text)) !== null) {
          // Skip if this is part of a bold marker
          if (text.substring(match.index - 1, match.index + 1) === '__' || 
              text.substring(match.index + match[0].length - 1, match.index + match[0].length + 1) === '__') {
            continue;
          }
          
          const matchStart = start + match.index;
          const matchEnd = matchStart + match[0].length;
          
          const openStart = matchStart;
          const openEnd = matchStart + 1; // _ is 1 char
          
          const closeStart = matchEnd - 1; // _ is 1 char
          const closeEnd = matchEnd;
          
          // Check if cursor is inside the italic text
          const isCursorInItalic = cursor >= matchStart && cursor <= matchEnd;
          
          if (isCursorInItalic) {
            // Show both markers when cursor is inside
            builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
            builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          } else {
            // Hide both markers when cursor is outside
            builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
            builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          }
          
          // Always apply italic styling to content
          builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-italic-active' }));
        }
      }
    }
    
    // Process strikethrough text (~~text~~)
    processStrikethrough(builder: RangeSetBuilder<Decoration>, start: number, text: string, cursor: number) {
      // Find all ~~strikethrough~~ patterns with better regex
      // Avoid matching empty content and ensure we don't match part of ~~~~ (which could be code blocks)
      const strikethroughPattern = /(?<!~)~~(?!~)([^~]+?)~~(?!~)/g;
      let match;
      
      while ((match = strikethroughPattern.exec(text)) !== null) {
        // Skip if we're at an escaped strikethrough
        if (match.index > 0 && text.charAt(match.index - 1) === '\\') {
          continue;
        }
        
        const matchStart = start + match.index;
        const matchEnd = matchStart + match[0].length;
        
        const openStart = matchStart;
        const openEnd = matchStart + 2; // ~~ is 2 chars
        
        const closeStart = matchEnd - 2; // ~~ is 2 chars
        const closeEnd = matchEnd;
        
        // Check if cursor is inside the strikethrough text
        const isCursorInStrikethrough = cursor >= matchStart && cursor <= matchEnd;
        
        if (isCursorInStrikethrough) {
          // Show both markers when cursor is inside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Always apply strikethrough styling to content
        builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-strikethrough-active' }));
      }
    }
    
    // Process highlighting (==text==)
    processHighlight(builder: RangeSetBuilder<Decoration>, start: number, text: string, cursor: number) {
      // Find all ==highlight== patterns with better regex
      // Avoid matching empty content and ensure we don't match part of === (which could be headings)
      const highlightPattern = /(?<!=)==((?!=).[^=]*?)==/g;
      let match;
      
      while ((match = highlightPattern.exec(text)) !== null) {
        // Skip if we're at an escaped highlight
        if (match.index > 0 && text.charAt(match.index - 1) === '\\') {
          continue;
        }
        
        const matchStart = start + match.index;
        const matchEnd = matchStart + match[0].length;
        
        const openStart = matchStart;
        const openEnd = matchStart + 2; // == is 2 chars
        
        const closeStart = matchEnd - 2; // == is 2 chars
        const closeEnd = matchEnd;
        
        // Ensure there's content between the markers
        if (openEnd >= closeStart) continue;
        
        // Check if cursor is inside the highlighted text
        const isCursorInHighlight = cursor >= matchStart && cursor <= matchEnd;
        
        if (isCursorInHighlight) {
          // Show both markers when cursor is inside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Always apply highlight styling to content
        builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-highlight-active' }));
      }
    }
    
    // Process edge cases with adjacent formatting
    processEdgeCases(builder: RangeSetBuilder<Decoration>, start: number, text: string, cursor: number) {
      // Handle bold immediately followed by italic: **bold***italic*
      this.processSpecificPattern(
        builder, start, text, cursor,
        /\*\*(.*?)\*\*\*(.*?)\*/g,
        2, 2, 1, 1,
        'markdown-bold-active', 'markdown-italic-active'
      );
      
      // Handle italic immediately followed by bold: *italic***bold**
      this.processSpecificPattern(
        builder, start, text, cursor,
        /\*(.*?)\*\*\*(.*?)\*\*/g,
        1, 1, 2, 2,
        'markdown-italic-active', 'markdown-bold-active'
      );
      
      // Handle bold with italic inside: ***bold and italic***
      this.processSpecificPattern(
        builder, start, text, cursor,
        /\*\*\*(.*?)\*\*\*/g,
        3, 3, 0, 0,
        'markdown-bold-active markdown-italic-active', ''
      );
      
      // Handle specific edge cases for the test document
      // Bold text immediately followed by italic text: **bold***italic*
      this.processSpecificPattern(
        builder, start, text, cursor,
        /\*\*([^*]+)\*\*\*([^*]+)\*/g,
        2, 2, 1, 1,
        'markdown-bold-active', 'markdown-italic-active'
      );
      
      // Italic text immediately followed by bold text: *italic***bold**
      this.processSpecificPattern(
        builder, start, text, cursor,
        /\*([^*]+)\*\*\*([^*]+)\*\*/g,
        1, 1, 2, 2,
        'markdown-italic-active', 'markdown-bold-active'
      );
      
      // Plain text immediately followed by italic: text*italic*
      const textItalicPattern = /([^\s*])(\*[^*]+\*)/g;
      let match;
      
      while ((match = textItalicPattern.exec(text)) !== null) {
        const italicText = match[2];
        const italicStart = start + match.index + 1; // +1 to skip the plain text character
        const italicEnd = italicStart + italicText.length;
        
        const openStart = italicStart;
        const openEnd = italicStart + 1; // * is 1 char
        const closeStart = italicEnd - 1;
        const closeEnd = italicEnd;
        
        // Check if cursor is inside the italic text
        const isCursorInItalic = cursor >= italicStart && cursor <= italicEnd;
        
        if (isCursorInItalic) {
          // Show both markers when cursor is inside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Apply italic styling to content
        builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-italic-active' }));
      }
      
      // Italic text immediately followed by plain text: *italic*text
      const italicTextPattern = /(\*[^*]+\*)([^\s*])/g;
      
      while ((match = italicTextPattern.exec(text)) !== null) {
        const italicText = match[1];
        const italicStart = start + match.index;
        const italicEnd = italicStart + italicText.length;
        
        const openStart = italicStart;
        const openEnd = italicStart + 1; // * is 1 char
        const closeStart = italicEnd - 1;
        const closeEnd = italicEnd;
        
        // Check if cursor is inside the italic text
        const isCursorInItalic = cursor >= italicStart && cursor <= italicEnd;
        
        if (isCursorInItalic) {
          // Show both markers when cursor is inside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Apply italic styling to content
        builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-italic-active' }));
      }
      
      // Plain text immediately followed by bold: text**bold**
      const textBoldPattern = /([^\s*])(\*\*[^*]+\*\*)/g;
      
      while ((match = textBoldPattern.exec(text)) !== null) {
        const boldText = match[2];
        const boldStart = start + match.index + 1; // +1 to skip the plain text character
        const boldEnd = boldStart + boldText.length;
        
        const openStart = boldStart;
        const openEnd = boldStart + 2; // ** is 2 chars
        const closeStart = boldEnd - 2;
        const closeEnd = boldEnd;
        
        // Check if cursor is inside the bold text
        const isCursorInBold = cursor >= boldStart && cursor <= boldEnd;
        
        if (isCursorInBold) {
          // Show both markers when cursor is inside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Apply bold styling to content
        builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-bold-active' }));
      }
      
      // Bold text immediately followed by plain text: **bold**text
      const boldTextPattern = /(\*\*[^*]+\*\*)([^\s*])/g;
      
      while ((match = boldTextPattern.exec(text)) !== null) {
        const boldText = match[1];
        const boldStart = start + match.index;
        const boldEnd = boldStart + boldText.length;
        
        const openStart = boldStart;
        const openEnd = boldStart + 2; // ** is 2 chars
        const closeStart = boldEnd - 2;
        const closeEnd = boldEnd;
        
        // Check if cursor is inside the bold text
        const isCursorInBold = cursor >= boldStart && cursor <= boldEnd;
        
        if (isCursorInBold) {
          // Show both markers when cursor is inside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(openStart, openEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(closeStart, closeEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Apply bold styling to content
        builder.add(openEnd, closeStart, Decoration.mark({ class: 'markdown-bold-active' }));
      }
    }
    
    // Helper method to process specific patterns of adjacent formatting
    processSpecificPattern(
      builder: RangeSetBuilder<Decoration>,
      start: number,
      text: string,
      cursor: number,
      pattern: RegExp,
      firstOpenLen: number,
      firstCloseLen: number,
      secondOpenLen: number,
      secondCloseLen: number,
      firstClass: string,
      secondClass: string
    ) {
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const firstText = match[1];
        const secondText = match[2];
        
        const matchStart = start + match.index;
        const firstEnd = matchStart + firstOpenLen + firstText.length + firstCloseLen;
        const matchEnd = firstEnd + secondOpenLen + secondText.length + secondCloseLen;
        
        // First element markers
        const firstOpenStart = matchStart;
        const firstOpenEnd = matchStart + firstOpenLen;
        const firstCloseStart = firstEnd - firstCloseLen;
        const firstCloseEnd = firstEnd;
        
        // Second element markers
        const secondOpenStart = firstEnd;
        const secondOpenEnd = firstEnd + secondOpenLen;
        const secondCloseStart = matchEnd - secondCloseLen;
        const secondCloseEnd = matchEnd;
        
        // Check cursor positions
        const isCursorInFirst = cursor >= matchStart && cursor <= firstEnd;
        const isCursorInSecond = cursor >= firstEnd && cursor <= matchEnd;
        
        // Handle first element markers
        if (isCursorInFirst) {
          // Show both markers when cursor is inside
          builder.add(firstOpenStart, firstOpenEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(firstCloseStart, firstCloseEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(firstOpenStart, firstOpenEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(firstCloseStart, firstCloseEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Handle second element markers
        if (isCursorInSecond) {
          // Show both markers when cursor is inside
          builder.add(secondOpenStart, secondOpenEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
          builder.add(secondCloseStart, secondCloseEnd, Decoration.mark({ class: 'markdown-syntax-active' }));
        } else {
          // Hide both markers when cursor is outside
          builder.add(secondOpenStart, secondOpenEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
          builder.add(secondCloseStart, secondCloseEnd, Decoration.mark({ class: 'markdown-syntax-dim' }));
        }
        
        // Apply styling to content
        builder.add(firstOpenEnd, firstCloseStart, Decoration.mark({ class: firstClass }));
        builder.add(secondOpenEnd, secondCloseStart, Decoration.mark({ class: secondClass }));
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
