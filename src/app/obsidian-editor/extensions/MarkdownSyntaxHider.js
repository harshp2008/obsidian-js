import {Decoration, ViewPlugin } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Create a ViewPlugin for hiding markdown syntax
export const markdownSyntaxHider = ViewPlugin.fromClass(
  class {
    decorations;

    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }

    update(update) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view) {
      // Use an array to collect and sort decorations
      const decorationsArray = [];
      const doc = view.state.doc;
      const fullText = doc.toString();
      
      // Get all cursor positions (support multi-cursor)
      const cursorPositions = [];
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
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, '_', '_', 'markdown-italic-active');
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, '~~', '~~', 'markdown-strikethrough-active');
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, '==', '==', 'markdown-highlight-active');
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, '`', '`', 'markdown-code-active');
      
      // Sort decorations by position
      decorationsArray.sort((a, b) => {
        if (a.from !== b.from) return a.from - b.from;
        return a.to - b.to;
      });
      
      // Add sorted decorations to the builder
      const builder = new RangeSetBuilder();
      for (const decoration of decorationsArray) {
        builder.add(
          decoration.from,
          decoration.to,
          decoration.decoration
        );
      }
      
      return builder.finish();
    }
    
    // Find heading decorations
    findHeadingDecorations(decorations, start, text, cursorPositions) {
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
    
    // Special method for bold text formatting
    findBoldDecorations(decorations, start, text, cursorPositions) {
      const pattern = /\*\*(.*?)\*\*/g;
      const escapeChar = '\\';
      
      let match;
      while ((match = pattern.exec(text)) !== null) {
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
    }
    
    // Generic method for other formatting types
    findFormattingDecorations(decorations, start, text, cursorPositions, openMarker, closeMarker, styleClass) {
      const escapeChar = '\\'; // Backslash for escaping
      const markerLength = openMarker.length;

      const openRegexString = this.escapeRegExp(openMarker);
      const closeRegexString = this.escapeRegExp(closeMarker);
      let pattern;

      if (openMarker === '_' && closeMarker === '_') { // Changed from '*' to '_'
        // Specific regex for underscore italics:
        // - (?<![\_]): Negative lookbehind for a backslash or an underscore
        // - _: Matches the literal underscore.
        // - ([\s\S]*?): Matches any character (including newlines) non-greedily (the content).
        // - _: Matches the literal closing underscore.
        // - (?![\_]): Negative lookahead for a backslash or an underscore
        pattern = new RegExp("(?<![\\_])_([\\s\\S]*?)_(?![\\_])", 'g'); // Regex for _italics_
      } else {
        // General pattern for other markers (like bold, strikethrough, etc.)
        pattern = new RegExp(openRegexString + '([\s\S]*?)' + closeRegexString, 'g');
      }

      let match;

      while ((match = pattern.exec(text)) !== null) {
        const matchStartIndex = match.index;

        // For non-italic markers, perform explicit escape checking.
        // The italic regex handles its own complex escaping via lookarounds.
        if (!(openMarker === '_' && closeMarker === '_')) {
          if (matchStartIndex > 0 && text.charAt(matchStartIndex - 1) === escapeChar) {
            // Count preceding backslashes to determine if the marker is truly escaped
            let backslashCount = 0;
            let currentPos = matchStartIndex - 1;
            while (currentPos >= 0 && text.charAt(currentPos) === escapeChar) {
              backslashCount++;
              currentPos--;
            }
            if (backslashCount % 2 !== 0) { // Odd number of backslashes means it's escaped
              continue;
            }
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

        let isCursorClose = false;
        for (const cursorPos of cursorPositions) {
          // Check if cursor is within or immediately adjacent to the entire formatted segment
          if (cursorPos >= openMarkerStart -1 && cursorPos <= closeMarkerEnd + 1) {
            isCursorClose = true;
            break;
          }
        }

        // Apply styling to the content itself if it's not empty
        if (contentText && contentText.length > 0) { // Added a check for contentText existence
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
    escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
