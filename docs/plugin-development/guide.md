# Obsidian-js Plugin Development Guide

This guide will help you create powerful plugins for the Obsidian-js editor. Plugins can customize nearly any aspect of the editor, from adding new features to changing the visual appearance.

## Table of Contents

- [Plugin Architecture Overview](#plugin-architecture-overview)
- [Creating Your First Plugin](#creating-your-first-plugin)
  - [Plugin Structure](#plugin-structure)
  - [Basic Example](#basic-example)
- [Core API Reference](#core-api-reference)
  - [Plugin Lifecycle](#plugin-lifecycle)
  - [Editor Interactions](#editor-interactions)
  - [Commands and Keymaps](#commands-and-keymaps)
  - [Event Hooks](#event-hooks)
- [Extension Points](#extension-points)
  - [Syntax Decorators](#syntax-decorators)
  - [State Fields](#state-fields)
  - [Text Modifiers](#text-modifiers)
  - [Event Trackers](#event-trackers)
- [Advanced Topics](#advanced-topics)
  - [Working with CodeMirror Directly](#working-with-codemirror-directly)
  - [Styling Your Plugin](#styling-your-plugin)
  - [Plugin Settings](#plugin-settings)
  - [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)
  - [Plugin Safety](#plugin-safety)
  - [Working with Other Plugins](#working-with-other-plugins)
- [Distribution](#distribution)

## Plugin Architecture Overview

The Obsidian-js plugin system is built on top of CodeMirror 6, providing a simpler API for common tasks while still allowing direct access to CodeMirror's powerful capabilities when needed.

Plugins in Obsidian-js:

- Are JavaScript/TypeScript classes that extend the base `Plugin` class
- Have a defined lifecycle (load, enable, disable, unload)
- Can modify editor behavior through extensions
- Can add user-facing commands
- Can respond to editor events
- Can interact with the document content

## Creating Your First Plugin

### Plugin Structure

Every plugin must have:

1. A unique identifier
2. A class that extends the `Plugin` base class
3. Implementations of the `onEnable` and `onDisable` methods

### Basic Example

Here's a simple plugin that adds a command to insert the current date:

```typescript
import { Plugin } from "obsidian-js/extensions/plugin-api";

export class DateInserterPlugin extends Plugin {
  onEnable() {
    // Register a command that users can trigger
    this.registerCommand(
      "insert-date", // Command ID
      "Insert Current Date", // Display name
      (view) => {
        // Command implementation
        this.insertAtCursor(new Date().toDateString());
        return true; // indicate command was handled
      }
    );
  }

  onDisable() {
    // Cleanup is handled automatically by the base Plugin class
  }
}

// Create and export plugin instance
export function createDateInserterPlugin() {
  return new DateInserterPlugin({
    id: "date-inserter",
    name: "Date Inserter",
    version: "1.0.0",
    description: "Inserts the current date at the cursor position",
    author: "Your Name",
  });
}
```

## Core API Reference

### Plugin Lifecycle

Plugins have a defined lifecycle with these key methods:

- `constructor(manifest)`: Set up your plugin instance with metadata
- `onEnable()`: Called when the plugin is enabled (register extensions, commands, hooks)
- `onDisable()`: Called when the plugin is disabled (cleanup)

The Plugin Manager handles:

- Loading plugins (`pluginManager.loadPlugin()`)
- Enabling plugins (`pluginManager.enablePlugin()`)
- Disabling plugins (`pluginManager.disablePlugin()`)
- Unloading plugins (`pluginManager.unloadPlugin()`)

### Editor Interactions

The base `Plugin` class provides methods to interact with the editor:

```typescript
// Get the current document content
const content = this.getContent();

// Replace the entire document content
this.setContent("New content");

// Insert text at the cursor position
this.insertAtCursor("Text to insert");
```

### Commands and Keymaps

Commands are actions users can trigger through the command palette, menus, or keyboard shortcuts:

```typescript
// Register a command
this.registerCommand("command-id", "Human-readable name", (view) => {
  // Command implementation
  return true; // Return true if handled
});

// Register a keyboard shortcut
this.registerExtension(
  "my-shortcut",
  createKeymap("Ctrl-Alt-T", (view) => {
    // Shortcut implementation
    return true; // Return true if handled
  })
);
```

### Event Hooks

You can hook into various editor events:

```typescript
// Listen for document changes
this.registerHook("document:change", (content) => {
  console.log("Document changed:", content);
});

// Listen for selection changes
this.registerHook("selection:change", (selection) => {
  console.log("Selection changed:", selection);
});

// Listen for theme changes
this.registerHook("theme:change", (newTheme) => {
  console.log("Theme changed to:", newTheme);
});
```

## Extension Points

### Syntax Decorators

Syntax decorators add visual styling or behavior to specific syntax elements:

```typescript
// Add styling to headings
this.registerExtension(
  "heading-decorator",
  createSyntaxDecorator(["ATXHeading1", "ATXHeading2"], (node, view) => {
    return Decoration.mark({
      class: "my-heading-style",
      attributes: {
        style: "color: blue; font-size: 1.5em;",
      },
    });
  })
);
```

### State Fields

State fields allow plugins to store and manage their own state:

```typescript
// Create a state field for word count
const wordCountField = createStateField(
  0, // initial value
  (value, tr) => {
    if (tr.docChanged) {
      const text = tr.newDoc.toString();
      return text.split(/\s+/).filter(Boolean).length;
    }
    return value;
  }
);

this.registerExtension("word-count-field", wordCountField);
```

### Text Modifiers

Text modifiers can transform text as it's being entered:

```typescript
// Auto-capitalize sentences
this.registerExtension(
  "auto-capitalize",
  createTextModifier(
    (text, from, to, view) => {
      // Check if this is the first letter after a period and space
      const before = view.state.doc.sliceString(Math.max(0, from - 2), from);
      return before === ". " || before === ".\n";
    },
    (text, from, to, view) => {
      // Capitalize the inserted text
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
  )
);
```

### Event Trackers

Event trackers let you respond to editor events:

```typescript
// Track cursor movements
this.registerExtension(
  "cursor-tracker",
  createEventTracker({
    onSelectionChanged: (update) => {
      const cursorPos = update.state.selection.main.head;
      const line = update.state.doc.lineAt(cursorPos);
      console.log(
        `Cursor at line ${line.number}, column ${cursorPos - line.from + 1}`
      );
    },
  })
);
```

## Advanced Topics

### Working with CodeMirror Directly

You can access the underlying CodeMirror EditorView through `this.view`:

```typescript
// Access the EditorView directly
protected onEnable() {
  if (this.view) {
    const state = this.view.state;
    const selection = state.selection;

    // Use CodeMirror's API directly
    this.view.dispatch({
      effects: myCustomEffect.of(myValue)
    });
  }
}
```

### Styling Your Plugin

Add CSS for your plugin:

```typescript
// Add custom styles for your plugin
protected onEnable() {
  // Create a style element
  const style = document.createElement('style');
  style.id = `${this.manifest.id}-styles`;
  style.textContent = `
    .custom-heading-1 {
      color: #2563eb;
      font-size: 1.8em;
      font-weight: bold;
    }
    .custom-heading-2 {
      color: #3b82f6;
      font-size: 1.5em;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  // Store reference for cleanup
  this._styleElement = style;
}

protected onDisable() {
  // Remove the style element
  if (this._styleElement) {
    this._styleElement.remove();
    this._styleElement = null;
  }
}
```

### Plugin Settings

Manage plugin settings:

```typescript
interface MyPluginSettings {
  enableFeatureX: boolean;
  colorTheme: string;
}

class SettingsPlugin extends Plugin {
  settings: MyPluginSettings = {
    enableFeatureX: true,
    colorTheme: "blue",
  };

  protected async onEnable() {
    // Load settings from storage
    await this.loadSettings();

    // Use settings to configure plugin
    if (this.settings.enableFeatureX) {
      this.enableFeatureX();
    }
  }

  private async loadSettings() {
    // Load from local storage
    const savedSettings = localStorage.getItem(`${this.manifest.id}-settings`);
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
  }

  public saveSettings() {
    // Save to local storage
    localStorage.setItem(
      `${this.manifest.id}-settings`,
      JSON.stringify(this.settings)
    );
  }
}
```

### Performance Considerations

Tips for efficient plugins:

- Use decorations sparingly and only in visible regions
- Avoid unnecessary recomputation in update handlers
- Debounce event handlers for frequent events
- Cache results when processing large documents
- Profile your plugin with browser developer tools

## Best Practices

### Plugin Safety

Guidelines for writing safe plugins:

1. **Error handling**: Wrap code in try-catch blocks to prevent crashes
2. **Document mutations**: Use the editor's transaction system for all changes
3. **Cleanup**: Properly clean up resources in `onDisable()`
4. **Namespace**: Prefix CSS classes and IDs with your plugin ID
5. **User confirmation**: Ask before making large or destructive changes

Example of safe error handling:

```typescript
protected onEnable() {
  try {
    // Plugin initialization
    this.registerCommand('my-command', 'My Command', (view) => {
      try {
        // Command implementation
        return true;
      } catch (error) {
        console.error('Error in my-command:', error);
        return false;
      }
    });
  } catch (error) {
    console.error(`Failed to enable ${this.manifest.id}:`, error);
    throw error; // Re-throw to signal failed initialization
  }
}
```

### Working with Other Plugins

Interacting with other plugins:

```typescript
// Check if another plugin is available
const otherPlugin = pluginManager.getPlugin("other-plugin-id");
if (otherPlugin && otherPlugin.enabled) {
  // Interact with the other plugin
}

// Provide an API for other plugins
class MyPlugin extends Plugin {
  // Public API methods
  public doSomethingUseful() {
    // Implementation
  }

  protected onEnable() {
    // Register your plugin's API
    window.obsidianPlugins = window.obsidianPlugins || {};
    window.obsidianPlugins[this.manifest.id] = {
      doSomethingUseful: this.doSomethingUseful.bind(this),
    };
  }

  protected onDisable() {
    // Clean up API
    if (window.obsidianPlugins?.[this.manifest.id]) {
      delete window.obsidianPlugins[this.manifest.id];
    }
  }
}
```

## Distribution

To distribute your plugin:

1. Build your plugin with a bundler (webpack, rollup, etc.)
2. Create a single JavaScript file that registers your plugin
3. Provide installation instructions
4. Consider publishing to npm or a plugin repository

Example build output:

```javascript
// my-plugin.js
(function () {
  class MyPlugin extends obsidianJS.Plugin {
    // Plugin implementation
  }

  // Register the plugin
  obsidianJS.pluginManager.loadPlugin(
    new MyPlugin({
      id: "my-plugin",
      name: "My Plugin",
      version: "1.0.0",
      description: "Does something useful",
      author: "Your Name",
    })
  );
})();
```

Installation instructions:

```html
<!-- Add to your HTML -->
<script src="https://example.com/my-plugin.js"></script>
<script>
  // Enable the plugin once Obsidian-js is loaded
  document.addEventListener("obsidian-ready", () => {
    obsidianJS.pluginManager.enablePlugin("my-plugin");
  });
</script>
```

---

With this guide, you should be well-equipped to create powerful and reliable plugins for Obsidian-js. Happy coding!
