# HTML Testing Examples

## Simple HTML Elements

### Inline Elements

This is a paragraph with <span style="color: red; font-weight: bold;">inline styled text</span> and some <em>native emphasis</em> and <strong>strong text</strong>.

### Block Elements

<div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 10px 0;">
  <h3>This is a div with styling</h3>
  <p>Content inside the div has its own paragraph.</p>
  <p>Multiple paragraphs are possible as well.</p>
</div>

## HTML Lists

<ul style="color: #555; list-style-type: square;">
  <li>Custom styled unordered list</li>
  <li>With multiple items</li>
  <li>And a third item for good measure</li>
</ul>

<ol type="A" start="3">
  <li>Custom ordered list starting at C</li>
  <li>Then D</li>
  <li>And finally E</li>
</ol>

## Nested HTML Structures

<div style="border: 1px solid #ddd; padding: 10px;">
  <h3>Outer Container</h3>
  <div style="background-color: #eef; padding: 10px; margin: 5px;">
    <h4>Inner Container</h4>
    <p>This content is nested two levels deep.</p>
    <div style="background-color: #ffe; padding: 5px; margin: 5px; border: 1px dashed #aaa;">
      <p>This is <strong>three levels</strong> of nesting.</p>
      <span style="color: green;">With some colored text.</span>
    </div>
  </div>
</div>

## HTML Tables

<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
  <thead>
    <tr style="background-color: #f0f0f0;">
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 1</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 2</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Cell 1</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Cell 2</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Cell 3</td>
    </tr>
    <tr style="background-color: #f9f9f9;">
      <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Cell 1</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Cell 2</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Cell 3</td>
    </tr>
  </tbody>
</table>

## HTML with Markdown Mixed

<div style="background-color: #f8f8f8; padding: 15px; border-left: 5px solid #8a2be2;">

# This is markdown H1 inside div

This is a paragraph with **bold text** and _italic text_ inside an HTML div.

- List item inside HTML
- Another list item
  - Nested list item

</div>

## Self-closing Tags and Void Elements

<hr style="height: 3px; background-color: #8a2be2; border: none; margin: 20px 0;" />

<img src="https://via.placeholder.com/150" alt="Placeholder image" style="border-radius: 50%;" />

<br />

<input type="text" placeholder="Input example" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;" />

## HTML with JavaScript (should be sanitized)

<button onclick="alert('This should not work!')">Try clicking me</button>

<script>
  console.log('This script should not be executed');
</script>

## HTML with iframes (may be disabled)

<iframe src="https://example.com" width="100%" height="200" style="border: 1px solid #ddd;"></iframe>

## Edge Cases

### Malformed HTML (unclosed tags)

<div>This div doesn't have a closing tag

### Deeply Nested Tags (test for performance)

<div>
  <span>
    <strong>
      <em>
        <a>
          <code>
            <mark>Deep nesting test</mark>
          </code>
        </a>
      </em>
    </strong>
  </span>
</div>

### HTML Comments

<!-- This is a comment and should not be visible in preview mode -->

Normal text after a comment.

### Complex Attributes

<div data-custom="test" class="multiple classes here" id="unique-id" data-json='{"test": "value"}'>
  Testing complex attributes
</div>

### Special Characters in HTML

<div title="Quote &quot; and apostrophe &#39; and ampersand &amp;">
  Special characters and entities
</div>
