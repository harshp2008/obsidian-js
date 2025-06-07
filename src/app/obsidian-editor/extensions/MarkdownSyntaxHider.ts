import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

/**
 * ViewPlugin for hiding and styling Markdown syntax in the editor
 * Combines functionality from both the TS and JS implementations
 */
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

    buildDecorations(view: EditorView): DecorationSet {
      // Use an array to collect and sort decorations
      const decorationsArray: Array<{from: number, to: number, decoration: Decoration}> = [];
      const doc = view.state.doc;
      const fullText = doc.toString();
      
      // Get all cursor positions (support multi-cursor)
      const cursorPositions: number[] = [];
      for (const range of view.state.selection.ranges) {
        cursorPositions.push(range.head);
        // Also include anchor position for text selections
        if (range.head !== range.anchor) {
          cursorPositions.push(range.anchor);
        }
      }
      
      // Find and collect all decorations
      this.findHeadingDecorations(decorationsArray, 0, fullText, cursorPositions);
      this.findBoldDecorations(decorationsArray, 0, fullText, cursorPositions);
      this.findItalicDecorations(decorationsArray, 0, fullText, cursorPositions);
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, '~~', '~~', 'markdown-strikethrough-active');
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, '==', '==', 'markdown-highlight-active');
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, '`', '`', 'markdown-code-active');
      
      // Sort decorations by position
      decorationsArray.sort((a, b) => {
        if (a.from !== b.from) return a.from - b.from;
        return a.to - b.to;
      });
      
      // Add sorted decorations to the builder
      const builder = new RangeSetBuilder<Decoration>();
      for (const {from, to, decoration} of decorationsArray) {
        if (from < to) {
          builder.add(from, to, decoration);
        }
      }
      
      return builder.finish();
    }
    
    // Find heading decorations (# Heading)
    findHeadingDecorations(
      decorations: Array<{from: number, to: number, decoration: Decoration}>, 
      start: number, 
      text: string, 
      cursorPositions: number[]
    ): void {
      const headingRegex = /^(#{1,6})\s(.*)$/gm;
      let match;
      
      while ((match = headingRegex.exec(text)) !== null) {
        // Skip escaped heading markers
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === '\\') {
          continue;
        }

        const lineStart = start + matchStart;
        const hashMarks = match[1];
        const hashCount = hashMarks.length;
        
        // Calculate positions
        const hashStart = lineStart;
        const hashEnd = hashStart + hashCount;
        const spaceEnd = hashEnd + 1; // +1 for the space after #
        const lineEnd = lineStart + match[0].length;
        
        // Check if any cursor is near the heading marker
        let isCursorNearHash = false;
        for (const cursor of cursorPositions) {
          if (cursor >= hashStart - 1 && cursor <= spaceEnd + 1) {
            isCursorNearHash = true;
            break;
          }
        }
        
        // Add heading styling to the text content
        decorations.push({
          from: spaceEnd,
          to: lineEnd,
          decoration: Decoration.mark({ class: `markdown-heading-${hashCount}` })
        });
        
        // Add marker decorations
        if (isCursorNearHash) {
          // Show the # symbols when cursor is near
          decorations.push({
            from: hashStart,
            to: hashEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
          
          decorations.push({
            from: hashEnd,
            to: spaceEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
        } else {
          // Hide the # symbols when cursor is not near
          decorations.push({
            from: hashStart,
            to: hashEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
          
          decorations.push({
            from: hashEnd,
            to: spaceEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
        }
      }
    }
    
    // Find bold text formatting (**bold** or __bold__)
    findBoldDecorations(
      decorations: Array<{from: number, to: number, decoration: Decoration}>, 
      start: number, 
      text: string, 
      cursorPositions: number[]
    ): void {
      // Find **bold** patterns
      const boldPattern = /\*\*(.*?)\*\*/g;
      const escapeChar = '\\';
      
      let match;
      while ((match = boldPattern.exec(text)) !== null) {
        // Skip escaped markers
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === escapeChar) {
          continue;
        }
        
        const fullMatch = match[0]; // The entire match including ** markers
        const content = match[1];   // Just the content between markers
        
        // Calculate positions
        const fullStart = start + matchStart;
        const fullEnd = fullStart + fullMatch.length;
        
        const openStart = fullStart;
        const openEnd = fullStart + 2; // ** length is 2
        
        const contentStart = openEnd;
        const contentEnd = fullEnd - 2;
        
        const closeStart = contentEnd;
        const closeEnd = fullEnd;
        
        // Check if any cursor is anywhere near this bold text
        let isCursorNearBold = false;
        for (const cursor of cursorPositions) {
          // Consider cursor near if it's close to either marker or inside content
          if (cursor >= openStart - 1 && cursor <= closeEnd + 1) {
            isCursorNearBold = true;
            break;
          }
        }
        
        // Apply bold styling to the content
        decorations.push({
          from: contentStart,
          to: contentEnd,
          decoration: Decoration.mark({ class: 'markdown-bold-active' })
        });
        
        // Always show or hide both markers together
        if (isCursorNearBold) {
          // Show both opening and closing markers
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
        } else {
          // Hide both opening and closing markers
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
        }
      }
      
      // Find __bold__ patterns
      const boldUnderscorePattern = /__(.*?)__/g;
      
      while ((match = boldUnderscorePattern.exec(text)) !== null) {
        // Skip escaped markers
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === escapeChar) {
          continue;
        }
        
        const fullMatch = match[0];
        const content = match[1];
        
        // Calculate positions
        const fullStart = start + matchStart;
        const fullEnd = fullStart + fullMatch.length;
        
        const openStart = fullStart;
        const openEnd = fullStart + 2; // __ length is 2
        
        const contentStart = openEnd;
        const contentEnd = fullEnd - 2;
        
        const closeStart = contentEnd;
        const closeEnd = fullEnd;
        
        // Check if any cursor is anywhere near this bold text
        let isCursorNearBold = false;
        for (const cursor of cursorPositions) {
          if (cursor >= openStart - 1 && cursor <= closeEnd + 1) {
            isCursorNearBold = true;
            break;
          }
        }
        
        // Apply bold styling to the content
        decorations.push({
          from: contentStart,
          to: contentEnd,
          decoration: Decoration.mark({ class: 'markdown-bold-active' })
        });
        
        // Always show or hide both markers together
        if (isCursorNearBold) {
          // Show both opening and closing markers
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
        } else {
          // Hide both opening and closing markers
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
        }
      }
    }
    
    // Find italic text formatting (*italic* or _italic_)
    findItalicDecorations(
      decorations: Array<{from: number, to: number, decoration: Decoration}>, 
      start: number, 
      text: string, 
      cursorPositions: number[]
    ): void {
      // Find *italic* patterns (making sure they're not part of ** bold **)
      const italicRegex = /(?<!\*)\*(?!\*)([^\*]+)\*(?!\*)/g;
      const escapeChar = '\\';
      
      // Keep track of positions we've already processed
      const processedPositions = new Set<number>();
      
      let match;
      while ((match = italicRegex.exec(text)) !== null) {
        // Skip escaped markers
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === escapeChar) {
          continue;
        }
        
        // Skip if we've already processed this position
        if (processedPositions.has(matchStart)) {
          continue;
        }
        
        // Mark this position as processed
        processedPositions.add(matchStart);
        
        const fullMatch = match[0];
        const content = match[1];
        
        // Calculate positions
        const fullStart = start + matchStart;
        const fullEnd = fullStart + fullMatch.length;
        
        const openStart = fullStart;
        const openEnd = fullStart + 1; // * is 1 char
        
        const contentStart = openEnd;
        const contentEnd = fullEnd - 1;
        
        const closeStart = contentEnd;
        const closeEnd = fullEnd;
        
        // Check if any cursor is near this italic text
        let isCursorNearItalic = false;
        for (const cursor of cursorPositions) {
          if (cursor >= openStart - 1 && cursor <= closeEnd + 1) {
            isCursorNearItalic = true;
            break;
          }
        }
        
        // Apply italic styling to the content
        decorations.push({
          from: contentStart,
          to: contentEnd,
          decoration: Decoration.mark({ class: 'markdown-italic-active' })
        });
        
        // Show or hide markers
        if (isCursorNearItalic) {
          // Show both markers when cursor is inside
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
        } else {
          // Hide both markers when cursor is outside
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
        }
      }
      
      // Find _italic_ patterns
      const italicUnderscoreRegex = /(?<!_)_(?!_)([^_]+)_(?!_)/g;
      
      while ((match = italicUnderscoreRegex.exec(text)) !== null) {
        // Skip escaped markers
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === escapeChar) {
          continue;
        }
        
        const fullMatch = match[0];
        const content = match[1];
        
        // Calculate positions
        const fullStart = start + matchStart;
        const fullEnd = fullStart + fullMatch.length;
        
        const openStart = fullStart;
        const openEnd = fullStart + 1; // _ is 1 char
        
        const contentStart = openEnd;
        const contentEnd = fullEnd - 1;
        
        const closeStart = contentEnd;
        const closeEnd = fullEnd;
        
        // Check if any cursor is near this italic text
        let isCursorNearItalic = false;
        for (const cursor of cursorPositions) {
          if (cursor >= openStart - 1 && cursor <= closeEnd + 1) {
            isCursorNearItalic = true;
            break;
          }
        }
        
        // Apply italic styling to the content
        decorations.push({
          from: contentStart,
          to: contentEnd,
          decoration: Decoration.mark({ class: 'markdown-italic-active' })
        });
        
        // Show or hide markers
        if (isCursorNearItalic) {
          // Show both markers when cursor is inside
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-active' })
          });
        } else {
          // Hide both markers when cursor is outside
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: 'markdown-syntax-dim' })
          });
        }
      }
    }
    
    // Generic method for other formatting types (strikethrough, highlight, code)
    findFormattingDecorations(
      decorations: Array<{from: number, to: number, decoration: Decoration}>,
      start: number,
      text: string,
      cursorPositions: number[],
      openMarker: string,
      closeMarker: string,
      styleClass: string
    ): void {
      const escapeChar = '\\'; // Backslash for escaping
      const markerLength = openMarker.length;

      // Escape special characters for regex
      const openRegexString = this.escapeRegExp(openMarker);
      const closeRegexString = this.escapeRegExp(closeMarker);
      
      // Create the regex pattern
      const pattern = new RegExp(openRegexString + '([\\s\\S]*?)' + closeRegexString, 'g');

      let match;
      while ((match = pattern.exec(text)) !== null) {
        const matchStartIndex = match.index;

        // Check for escaped markers
        if (matchStartIndex > 0 && text.charAt(matchStartIndex - 1) === escapeChar) {
          // Count preceding backslashes to determine if truly escaped
          let backslashCount = 0;
          let currentPos = matchStartIndex - 1;
          while (currentPos >= 0 && text.charAt(currentPos) === escapeChar) {
            backslashCount++;
            currentPos--;
          }
          if (backslashCount % 2 !== 0) { // Odd number means it's escaped
            continue;
          }
        }

        const fullMatchedText = match[0];
        const contentText = match[1];

        const absoluteMatchStart = start + matchStartIndex;
        const absoluteMatchEnd = absoluteMatchStart + fullMatchedText.length;

        const openMarkerStart = absoluteMatchStart;
        const openMarkerEnd = absoluteMatchStart + markerLength;

        const contentBodyStart = openMarkerEnd;
        const contentBodyEnd = absoluteMatchEnd - markerLength;

        const closeMarkerStart = contentBodyEnd;
        const closeMarkerEnd = absoluteMatchEnd;

        // Check if cursor is near
        let isCursorClose = false;
        for (const cursorPos of cursorPositions) {
          // Check if cursor is within or immediately adjacent
          if (cursorPos >= openMarkerStart - 1 && cursorPos <= closeMarkerEnd + 1) {
            isCursorClose = true;
            break;
          }
        }

        // Apply styling to the content itself if it's not empty
        if (contentText && contentText.length > 0) {
          decorations.push({
            from: contentBodyStart,
            to: contentBodyEnd,
            decoration: Decoration.mark({ class: styleClass })
          });
        }

        // Determine marker visibility
        const markerVisibilityClass = isCursorClose ? 'markdown-syntax-active' : 'markdown-syntax-dim';

        // Decorate opening marker
        decorations.push({
          from: openMarkerStart,
          to: openMarkerEnd,
          decoration: Decoration.mark({ class: markerVisibilityClass })
        });

        // Decorate closing marker
        decorations.push({
          from: closeMarkerStart,
          to: closeMarkerEnd,
          decoration: Decoration.mark({ class: markerVisibilityClass })
        });
      }
    }
    
    // Helper function to escape special regex characters
    escapeRegExp(string: string): string {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
