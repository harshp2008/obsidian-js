# Text Formatting Tests

## Basic Formatting Tests

### Bold Text (using \*\* only)

**This text should display as bold** using double asterisks.

**This text might not display as bold** since it uses underscores instead of asterisks.

This has **bold words** in the middle of a sentence.

This **entire sentence should be bold with some _italics_ inside** to test nesting.

### Italic Text (using \_ only)

_This text should display as italics_ using single underscores.

_This text might not display as italics_ since it uses asterisks instead of underscores.

This has _italic words_ in the middle of a sentence.

This _entire sentence should be italic with some **bold** inside_ to test nesting.

### Strikethrough Text

~~This text should have a strikethrough~~ using double tildes.

This sentence has ~~strikethrough words~~ in the middle.

~~**Bold and strikethrough**~~ and ~~_italic and strikethrough_~~ for nesting tests.

### Highlight Text

==This text should be highlighted== using double equal signs.

This sentence has ==highlighted words== in the middle.

==**Bold and highlighted**== and ==_italic and highlighted_== for nesting tests.

### Code Text

`This is inline code` using backticks.

This sentence has `inline code` in the middle.

`**Bold syntax inside code**` should not apply bold formatting.

## Combined Formatting Tests

**_Bold and italic together_** (bold outside, italic inside).

_**Italic and bold together**_ (italic outside, bold inside).

**_~~Bold, italic, and strikethrough~~_** (all three together).

**==Bold and highlighted==** (bold with highlight).

_==Italic and highlighted==_ (italic with highlight).

`==Code with highlight syntax==` (highlight syntax inside code - should not apply).

~~==Strikethrough and highlighted==~~ (strikethrough with highlight).

## Edge Cases

**Bold text
across multiple
lines** should still work.

_Italic text
across multiple
lines_ should still work.

**_~~==Multiple
formatting
styles==~~_** across lines.

**A very very very very very very very very very very very very very very very very very very very long bold text to test wrapping behavior.**

_A very very very very very very very very very very very very very very very very very very very long italic text to test wrapping behavior._

## Code Blocks

```
This is a simple code block
without language specification
It should render as plain text
```

```javascript
// This is JavaScript code
function testFunction() {
  const x = "This should have syntax highlighting";
  return x.length > 10;
}
```

```python
# This is Python code
def test_function():
    x = "This should have syntax highlighting"
    return len(x) > 10
```

```css
/* This is CSS code */
.highlight {
  background-color: yellow;
  color: black;
  padding: 2px 4px;
}
```

## Special Cases

\*\*Escaped asterisks should not make bold text\*\*

\_Escaped underscores should not make italic text\_

\~~Escaped tildes should not make strikethrough text~~

\==Escaped equals should not make highlighted text==

**Bold \* with asterisk** inside.

_Italic _ with underscore\_ inside.

Let's also test 2\*4=8 with asterisks in math expressions.

**Bold text with a /_ comment _/ inside** should maintain bold.

**Bold unbalanced with \_italic** should handle well.

_Italic unbalanced with \*\*bold_ should handle well.

## Empty Formatting

---

---

````

====

``

## Paste Handler Tests

### Plain Text Paste Test
This text simulates content that might be pasted from a plain text source.
Multiple lines
With various spacing
    And indentation
Should be preserved correctly.

### Rich Text Paste Test
This text simulates content from a rich text source with format markings.
This would be *bold* in source.
This would be _italic_ in source.
This would be <u>underlined</u> in source.
This would be <span style="color: red;">colored</span> in source.

### Code Paste Test
```javascript
// This represents code that might be copied from an IDE or website
function calculateTotal(items) {
  return items
    .filter(item => item.price > 0)
    .map(item => item.price * item.quantity)
    .reduce((total, value) => total + value, 0);
}
```

### Table Structure Paste Test
| Name     | Age | Occupation    |
|----------|-----|---------------|
| John     | 28  | Developer     |
| Jane     | 32  | Designer      |
| Robert   | 45  | Manager       |

### HTML Content Paste Test
<div style="background-color: #f0f0f0; padding: 10px;">
  <h3>HTML Content</h3>
  <p>This represents <strong>formatted content</strong> that might be copied from a website.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>
````
