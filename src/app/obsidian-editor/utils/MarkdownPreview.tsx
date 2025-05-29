'use client';

import React from 'react';

/**
 * Converts markdown text to HTML for preview
 */
export const convertMarkdownToHtml = (markdown: string): string => {
  // Process code blocks first (to avoid conflicts with other formatting)
  let html = markdown;
  
  // Process code blocks with language specification
  html = html.replace(/```([a-z]*)(\n[\s\S]*?\n)```/g, (match, lang, code) => {
    return `<pre class="language-${lang || 'text'}"><code>${code.trim()}</code></pre>`;
  });
  
  // Process inline elements
  html = html
    // Bold
    .replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^\*\n]+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`\n]+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]\n]+?)\]\(([^)\n]+?)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[([^\]\n]*?)\]\(([^)\n]+?)\)/g, '<img src="$2" alt="$1" />');
  
  // Process block elements
  const lines = html.split('\n');
  let inList = false;
  let listType = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Headings
    if (line.match(/^# (.+)$/)) {
      lines[i] = line.replace(/^# (.+)$/, '<h1>$1</h1>');
    } else if (line.match(/^## (.+)$/)) {
      lines[i] = line.replace(/^## (.+)$/, '<h2>$1</h2>');
    } else if (line.match(/^### (.+)$/)) {
      lines[i] = line.replace(/^### (.+)$/, '<h3>$1</h3>');
    } else if (line.match(/^#### (.+)$/)) {
      lines[i] = line.replace(/^#### (.+)$/, '<h4>$1</h4>');
    } else if (line.match(/^##### (.+)$/)) {
      lines[i] = line.replace(/^##### (.+)$/, '<h5>$1</h5>');
    } else if (line.match(/^###### (.+)$/)) {
      lines[i] = line.replace(/^###### (.+)$/, '<h6>$1</h6>');
    }
    // Blockquotes
    else if (line.match(/^> (.+)$/)) {
      lines[i] = line.replace(/^> (.+)$/, '<blockquote>$1</blockquote>');
    }
    // Unordered lists
    else if (line.match(/^[\*\-\+] (.+)$/)) {
      if (!inList || listType !== 'ul') {
        lines[i] = '<ul><li>' + line.replace(/^[\*\-\+] (.+)$/, '$1') + '</li>';
        inList = true;
        listType = 'ul';
      } else {
        lines[i] = '<li>' + line.replace(/^[\*\-\+] (.+)$/, '$1') + '</li>';
      }
      
      // Check if next line is not a list item
      if (i === lines.length - 1 || !lines[i + 1].match(/^[\*\-\+] (.+)$/)) {
        lines[i] += '</ul>';
        inList = false;
      }
    }
    // Ordered lists
    else if (line.match(/^\d+\. (.+)$/)) {
      if (!inList || listType !== 'ol') {
        lines[i] = '<ol><li>' + line.replace(/^\d+\. (.+)$/, '$1') + '</li>';
        inList = true;
        listType = 'ol';
      } else {
        lines[i] = '<li>' + line.replace(/^\d+\. (.+)$/, '$1') + '</li>';
      }
      
      // Check if next line is not a list item
      if (i === lines.length - 1 || !lines[i + 1].match(/^\d+\. (.+)$/)) {
        lines[i] += '</ol>';
        inList = false;
      }
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      lines[i] = '<hr />';
    }
    // Empty lines create paragraph breaks
    else if (line.trim() === '') {
      lines[i] = '<br />';
    }
    // Regular paragraph text (not in a list)
    else if (!inList && line.trim() !== '') {
      lines[i] = '<p>' + line + '</p>';
    }
  }
  
  return lines.join('\n');
};

interface MarkdownPreviewProps {
  html: string;
}

/**
 * Component to render markdown preview
 */
export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ html }) => {
  return (
    <div className="overflow-y-auto p-4 prose dark:prose-invert max-w-none">
      <div 
        className="markdown-preview" 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </div>
  );
};
