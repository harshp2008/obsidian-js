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
  
  // Helper: Parse lines into a tree of nested blockquotes
  function parseBlockquoteTree(lines: string[]): any[] {
    const root = [];
    let stack = [{ level: 0, children: root }];

    for (let line of lines) {
      const match = line.match(/^(>+)(\s?)(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = match[3];
        // Find the correct parent for this level
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }
        const node = { level, content, children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
      } else {
        // Not a blockquote, attach to current parent
        stack[stack.length - 1].children.push({ level: 0, content: line, children: [] });
      }
    }
    return root;
  }

  // Helper: Render the blockquote tree as HTML
  function renderBlockquoteTree(nodes: any[]): string {
    return nodes.map(node => {
      if (node.level > 0) {
        return `<blockquote>${renderBlockquoteTree(node.children.length ? node.children : [{...node, level: 0}])}</blockquote>`;
      } else {
        return node.content;
      }
    }).join('\n');
  }

  // Group and render blockquotes as a tree
  const bqTree = parseBlockquoteTree(lines);
  let rendered = renderBlockquoteTree(bqTree);

  // Now process non-blockquote lines for headings, lists, etc.
  rendered = rendered.split('\n').map(line => {
    if (line.match(/^# (.+)$/)) {
      return line.replace(/^# (.+)$/, '<h1>$1</h1>');
    } else if (line.match(/^## (.+)$/)) {
      return line.replace(/^## (.+)$/, '<h2>$1</h2>');
    } else if (line.match(/^### (.+)$/)) {
      return line.replace(/^### (.+)$/, '<h3>$1</h3>');
    } else if (line.match(/^#### (.+)$/)) {
      return line.replace(/^#### (.+)$/, '<h4>$1</h4>');
    } else if (line.match(/^##### (.+)$/)) {
      return line.replace(/^##### (.+)$/, '<h5>$1</h5>');
    } else if (line.match(/^###### (.+)$/)) {
      return line.replace(/^###### (.+)$/, '<h6>$1</h6>');
    } else if (line.match(/^[\*\-\+] (.+)$/)) {
      if (!inList || listType !== 'ul') {
        inList = true; listType = 'ul';
        return '<ul><li>' + line.replace(/^[\*\-\+] (.+)$/, '$1') + '</li>';
      } else {
        return '<li>' + line.replace(/^[\*\-\+] (.+)$/, '$1') + '</li>';
      }
    } else if (line.match(/^\d+\. (.+)$/)) {
      if (!inList || listType !== 'ol') {
        inList = true; listType = 'ol';
        return '<ol><li>' + line.replace(/^\d+\. (.+)$/, '$1') + '</li>';
      } else {
        return '<li>' + line.replace(/^\d+\. (.+)$/, '$1') + '</li>';
      }
    } else if (line.match(/^---+$/)) {
      return '<hr />';
    } else if (line.trim() === '') {
      return '<br />';
    } else if (!inList && line.trim() !== '') {
      return '<p>' + line + '</p>';
    } else {
      return line;
    }
  }).join('\n');

  // Close any open lists
  if (inList && listType === 'ul') rendered += '</ul>';
  if (inList && listType === 'ol') rendered += '</ol>';

  return rendered;
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
