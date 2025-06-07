# Obsidian JS Extensions

## Overview

This document describes the extension system used in Obsidian JS. Extensions allow for adding new functionality to the editor without modifying the core code.

## Available Extensions

### Markdown Syntax

Located in `src/app/obsidian-editor/extensions/markdown-syntax/`, these extensions handle markdown formatting and syntax highlighting.

#### HTML Decorator

The HTML decorator extension adds HTML rendering capabilities to markdown content.

## Creating Extensions

Extensions follow a plugin architecture that allows the editor to be extended with new functionality.

### Extension Structure

A typical extension follows this structure:

```
extensions/
└── my-extension/
    ├── index.js       # Main entry point
    ├── README.md      # Documentation
    └── components/    # Any UI components needed
```

### Extension Interface

Extensions should implement the following interface:

```typescript
interface Extension {
  id: string; // Unique identifier
  name: string; // Display name
  description: string; // Brief description

  // Initialize the extension
  initialize(editor: EditorInstance): void;

  // Clean up when extension is disabled
  cleanup(): void;

  // Optional methods
  getCommands?(): Command[];
  getKeyBindings?(): KeyBinding[];
  getUIComponents?(): UIComponent[];
}
```

### Registering Extensions

Extensions are registered with the editor using the extension manager:

```javascript
import MyExtension from "./my-extension";
import { extensionManager } from "../core";

// Register the extension
extensionManager.register(new MyExtension());

// Enable the extension
extensionManager.enable("my-extension-id");
```

## Best Practices

When developing extensions:

1. Keep extensions focused on a single responsibility
2. Document the extension's API and behavior
3. Test extensions in isolation
4. Provide clear error messages
5. Clean up resources when the extension is disabled

## Extension Development Guide

To create a new extension:

1. Create a new directory in the appropriate extensions folder
2. Implement the extension interface
3. Document the extension
4. Test the extension
5. Register the extension with the editor

_More detailed guides will be added as the extension system evolves._
