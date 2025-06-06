'use client';

/**
 * This file re-exports all formatting functions to provide a unified API
 */

// Export basic text formatting functions
export { insertBold, insertItalic } from './basicFormatting';

// Export heading and code formatting functions
export { insertHeading, insertCode } from './headingAndCodeFormatting';

// Export link and list formatting functions
export { insertLink, insertList, isListItem } from './linkAndListFormatting';

// Export indentation utilities
export { 
  NBSP, 
  INDENT_UNIT, 
  indentText, 
  unindentText,
  isBlockquote 
} from './indentationUtils';

// Export key handlers
export {
  handleBackspaceIndent,
  handleEnterListBlockquote
} from './keyHandlers'; 