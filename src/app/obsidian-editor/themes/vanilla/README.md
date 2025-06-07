# Vanilla Theme for obsidian-js

A clean, minimal theme with neutral colors for the obsidian-js editor.

## Features

- Light and dark variants
- Soft, neutral color palette
- Customizable through CSS variables
- Designed for readability and focus

## Preview

### Light Mode

Clean, minimal interface with subtle purple accents and excellent readability.

### Dark Mode

Dark grey background with light purple accents for comfortable night-time editing.

## Usage

### Basic Usage

The vanilla theme is included in the obsidian-js library. You can select it from the theme dropdown in the editor toolbar.

### Programmatic Usage

You can also set the theme programmatically:

```typescript
import { setEditorTheme } from "obsidian-js";

// Set the theme to vanilla
setEditorTheme("vanilla");
```

### Importing in Your Application

Make sure to import the theme CSS files in your application:

```typescript
// In your entry file
import "obsidian-js/src/app/obsidian-editor/themes/vanilla/light.css";
import "obsidian-js/src/app/obsidian-editor/themes/vanilla/dark.css";
```

## Customization

The vanilla theme uses CSS variables that you can override in your own CSS:

```css
:root {
  /* Light theme customization */
  --vanilla-light-background-primary: #f5f5f5;
  --vanilla-light-text-normal: #333333;
  --vanilla-light-text-accent: #6b4d9e;

  /* Dark theme customization */
  --vanilla-dark-background-primary: #222222;
  --vanilla-dark-text-normal: #eeeeee;
  --vanilla-dark-text-accent: #c4a5ff;
}
```

## Variables Reference

### Light Theme Variables

| Variable                               | Default   | Description                        |
| -------------------------------------- | --------- | ---------------------------------- |
| `--vanilla-light-background-primary`   | `#fcfcfc` | Main editor background             |
| `--vanilla-light-background-secondary` | `#f5f5f5` | Secondary backgrounds like gutters |
| `--vanilla-light-text-normal`          | `#2c2c2c` | Main text color                    |
| `--vanilla-light-text-muted`           | `#707070` | Subdued text color                 |
| `--vanilla-light-text-accent`          | `#625772` | Accent color for highlights        |
| `--vanilla-light-cursor`               | `#625772` | Cursor color                       |
| `--vanilla-light-heading-color`        | `#42404d` | Heading text color                 |
| `--vanilla-light-link-color`           | `#625772` | Link text color                    |

### Dark Theme Variables

| Variable                              | Default   | Description                        |
| ------------------------------------- | --------- | ---------------------------------- |
| `--vanilla-dark-background-primary`   | `#262626` | Main editor background             |
| `--vanilla-dark-background-secondary` | `#2d2d2d` | Secondary backgrounds like gutters |
| `--vanilla-dark-text-normal`          | `#e0e0e0` | Main text color                    |
| `--vanilla-dark-text-muted`           | `#a0a0a0` | Subdued text color                 |
| `--vanilla-dark-text-accent`          | `#bfb1d5` | Accent color for highlights        |
| `--vanilla-dark-cursor`               | `#bfb1d5` | Cursor color                       |
| `--vanilla-dark-heading-color`        | `#e6e0f0` | Heading text color                 |
| `--vanilla-dark-link-color`           | `#bfb1d5` | Link text color                    |
