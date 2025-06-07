# Paste Handler Test Document

This document contains various sections to test the paste handler functionality. Copy content from these sections and paste it elsewhere to test how the paste handler processes different types of content.

## 1. Plain Text

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget justo nec urna tincidunt tincidunt.
Vivamus at eros ac arcu vestibulum facilisis. Duis sit amet dui eu nisi tincidunt finibus.

## 2. Formatted Markdown

### Headers and Text

# Header 1

## Header 2

### Header 3

Normal paragraph with **bold text**, _italic text_, and ~~strikethrough text~~.

### Lists

- Unordered list item 1
- Unordered list item 2
  - Nested item A
  - Nested item B
- Unordered list item 3

1. Ordered list item 1
2. Ordered list item 2
   1. Nested numbered item A
   2. Nested numbered item B
3. Ordered list item 3

### Code

Inline `code` and:

```javascript
function testFunction() {
  const message = "Hello, world!";
  console.log(message);
  return message.length;
}
```

## 3. HTML Content

<div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px;">
  <h3>HTML Section Title</h3>
  <p>This is a <strong>paragraph</strong> with <em>formatting</em> inside HTML.</p>
  <ul>
    <li>First item in HTML list</li>
    <li>Second item in HTML list</li>
  </ul>
</div>

## 4. Mixed Content

This paragraph has **bold** and _italic_ text, plus an `inline code` segment.

<div style="color: blue;">
  This is HTML content with **markdown bold** inside it.
</div>

> This is a blockquote with a [link](https://example.com) and **formatting**.

## 5. Table Content

| Name        | Age | Occupation | Salary   |
| ----------- | --- | ---------- | -------- |
| John Doe    | 28  | Developer  | $85,000  |
| Jane Smith  | 34  | Designer   | $72,000  |
| Bob Johnson | 45  | Manager    | $120,000 |
| Alice Brown | 31  | Analyst    | $78,000  |

## 6. Special Characters & Whitespace

This text has lots of spaces between words.

Line 1
Line 2
Line 3
Line 4

Tab-indented:
Level 1
Level 2
Level 3

Special characters: © ® ™ € £ ¥ § ¶ • ○ ● ◎ ◆ ★

## 7. Rich Text Simulation

The following text pretends to be from a rich text editor:

<span style="font-weight: bold;">Bold text</span>
<span style="font-style: italic;">Italic text</span>
<span style="text-decoration: underline;">Underlined text</span>
<span style="color: red;">Red text</span>

<h3>Heading from rich text</h3>

## 8. Code From IDE

```python
# This simulates code copied from an IDE
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return f"Hello, my name is {self.name} and I am {self.age} years old."

    @property
    def is_adult(self):
        return self.age >= 18
```

## 9. URL Test

https://www.example.com/path/to/page?param1=value1&param2=value2#section

## 10. Large Code Block

```javascript
/**
 * A larger code block that spans multiple lines
 * to test handling of larger paste operations.
 */
class DataProcessor {
  constructor(options = {}) {
    this.options = {
      caseSensitive: false,
      trimWhitespace: true,
      maxLength: 255,
      ...options,
    };
    this.processed = 0;
    this.errors = 0;
  }

  process(data) {
    if (!data || !Array.isArray(data)) {
      this.errors++;
      throw new Error("Invalid data format");
    }

    return data
      .map((item) => {
        try {
          const result = this._processItem(item);
          this.processed++;
          return result;
        } catch (error) {
          this.errors++;
          console.error(`Error processing item: ${error.message}`);
          return null;
        }
      })
      .filter(Boolean);
  }

  _processItem(item) {
    if (typeof item !== "string") {
      throw new Error("Item must be a string");
    }

    let result = item;

    if (this.options.trimWhitespace) {
      result = result.trim();
    }

    if (!this.options.caseSensitive) {
      result = result.toLowerCase();
    }

    if (result.length > this.options.maxLength) {
      result = result.substring(0, this.options.maxLength);
    }

    return result;
  }

  getStats() {
    return {
      processed: this.processed,
      errors: this.errors,
      success:
        this.processed > 0
          ? ((this.processed - this.errors) / this.processed) * 100
          : 0,
    };
  }
}
```
