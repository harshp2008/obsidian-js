import { EditorView } from "@codemirror/view";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// Create vanilla light theme from CSS variables
export function createVanillaLightTheme() {
  return EditorView.theme(
    {
      "&": {
        color: "var(--vanilla-light-text-normal, #2c2c2c)",
        backgroundColor: "var(--vanilla-light-background-primary, #fcfcfc)",
      },
      ".cm-content": { 
        caretColor: "var(--vanilla-light-cursor, #625772)",
        fontFamily: "'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
      },
      ".cm-gutters": {
        backgroundColor: "var(--vanilla-light-background-secondary, #f5f5f5)",
        color: "var(--vanilla-light-text-muted, #707070)",
        border: "none",
      },
      ".cm-activeLine": { 
        backgroundColor: "var(--vanilla-light-active-line, rgba(0, 0, 0, 0.03))",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--vanilla-light-active-line-gutter, rgba(0, 0, 0, 0.05))",
      },
      ".cm-selectionBackground": { 
        backgroundColor: "var(--vanilla-light-selection-bg, rgba(98, 87, 114, 0.15))",
      },
      ".cm-line": { padding: "0 4px" },
      ".cm-cursor": {
        borderLeftWidth: "2px",
        borderLeftColor: "var(--vanilla-light-cursor, #625772)",
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "var(--vanilla-light-cursor, #625772)",
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--vanilla-light-selection-bg, rgba(98, 87, 114, 0.15))",
      },
      ".cm-tooltip": {
        backgroundColor: "var(--vanilla-light-background-primary, #fcfcfc)",
        border: "1px solid var(--vanilla-light-border-color, #e2e2e2)",
        boxShadow: "var(--vanilla-light-shadow, 0 1px 3px rgba(0, 0, 0, 0.08))",
      },
    },
    { dark: false }
  );
}

// Create vanilla dark theme from CSS variables
export function createVanillaDarkTheme() {
  return EditorView.theme(
    {
      "&": {
        color: "var(--vanilla-dark-text-normal, #e0e0e0)",
        backgroundColor: "var(--vanilla-dark-background-primary, #262626)",
      },
      ".cm-content": { 
        caretColor: "var(--vanilla-dark-cursor, #bfb1d5)",
        fontFamily: "'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
      },
      ".cm-gutters": {
        backgroundColor: "var(--vanilla-dark-background-secondary, #2d2d2d)",
        color: "var(--vanilla-dark-text-muted, #a0a0a0)",
        border: "none",
      },
      ".cm-activeLine": { 
        backgroundColor: "var(--vanilla-dark-active-line, rgba(255, 255, 255, 0.05))",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--vanilla-dark-active-line-gutter, rgba(255, 255, 255, 0.08))",
      },
      ".cm-selectionBackground": { 
        backgroundColor: "var(--vanilla-dark-selection-bg, rgba(191, 177, 213, 0.2))",
      },
      ".cm-line": { padding: "0 4px" },
      ".cm-cursor": {
        borderLeftWidth: "2px",
        borderLeftColor: "var(--vanilla-dark-cursor, #bfb1d5)",
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "var(--vanilla-dark-cursor, #bfb1d5)",
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--vanilla-dark-selection-bg, rgba(191, 177, 213, 0.2))",
      },
      ".cm-tooltip": {
        backgroundColor: "var(--vanilla-dark-background-primary, #262626)",
        border: "1px solid var(--vanilla-dark-border-color, #3d3d3d)",
        boxShadow: "var(--vanilla-dark-shadow, 0 2px 6px rgba(0, 0, 0, 0.25))",
      },
    },
    { dark: true }
  );
}

// Create highlight styles for syntax highlighting
export function createVanillaHighlightStyle() {
  return HighlightStyle.define([
    // Light theme styles
    {
      tag: tags.heading1,
      fontSize: "1.6em",
      fontWeight: "bold",
      color: "var(--vanilla-light-heading-color, #42404d)",
      class: "light-mode"
    },
    {
      tag: tags.heading2,
      fontSize: "1.4em",
      fontWeight: "bold",
      color: "var(--vanilla-light-heading-color, #42404d)",
      class: "light-mode"
    },
    {
      tag: tags.heading3,
      fontSize: "1.2em",
      fontWeight: "bold",
      color: "var(--vanilla-light-heading-color, #42404d)",
      class: "light-mode"
    },
    {
      tag: tags.heading4,
      fontSize: "1.1em",
      fontWeight: "bold",
      color: "var(--vanilla-light-heading-color, #42404d)",
      class: "light-mode"
    },
    {
      tag: tags.heading5,
      fontSize: "1.1em",
      fontWeight: "bold",
      color: "var(--vanilla-light-heading-color, #42404d)",
      class: "light-mode"
    },
    {
      tag: tags.heading6,
      fontSize: "1.1em",
      fontWeight: "bold",
      color: "var(--vanilla-light-heading-color, #42404d)",
      class: "light-mode"
    },
    {
      tag: tags.emphasis,
      fontStyle: "italic",
      color: "var(--vanilla-light-emphasis-color, #2c2c2c)",
      class: "light-mode"
    },
    {
      tag: tags.strong,
      fontWeight: "bold",
      color: "var(--vanilla-light-strong-color, #222222)",
      class: "light-mode"
    },
    {
      tag: tags.link,
      color: "var(--vanilla-light-link-color, #625772)",
      textDecoration: "underline",
      class: "light-mode"
    },
    {
      tag: tags.monospace,
      fontFamily: "'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
      fontSize: "0.9em",
      color: "var(--vanilla-light-code-color, #625772)",
      class: "light-mode"
    },
    
    // Dark theme styles
    {
      tag: tags.heading1,
      fontSize: "1.6em",
      fontWeight: "bold",
      color: "var(--vanilla-dark-heading-color, #e6e0f0)",
      class: "dark-mode"
    },
    {
      tag: tags.heading2,
      fontSize: "1.4em",
      fontWeight: "bold",
      color: "var(--vanilla-dark-heading-color, #e6e0f0)",
      class: "dark-mode"
    },
    {
      tag: tags.heading3,
      fontSize: "1.2em",
      fontWeight: "bold",
      color: "var(--vanilla-dark-heading-color, #e6e0f0)",
      class: "dark-mode"
    },
    {
      tag: tags.heading4,
      fontSize: "1.1em",
      fontWeight: "bold",
      color: "var(--vanilla-dark-heading-color, #e6e0f0)",
      class: "dark-mode"
    },
    {
      tag: tags.heading5,
      fontSize: "1.1em",
      fontWeight: "bold",
      color: "var(--vanilla-dark-heading-color, #e6e0f0)",
      class: "dark-mode"
    },
    {
      tag: tags.heading6,
      fontSize: "1.1em",
      fontWeight: "bold",
      color: "var(--vanilla-dark-heading-color, #e6e0f0)",
      class: "dark-mode"
    },
    {
      tag: tags.emphasis,
      fontStyle: "italic",
      color: "var(--vanilla-dark-emphasis-color, #e0e0e0)",
      class: "dark-mode"
    },
    {
      tag: tags.strong,
      fontWeight: "bold",
      color: "var(--vanilla-dark-strong-color, #ffffff)",
      class: "dark-mode"
    },
    {
      tag: tags.link,
      color: "var(--vanilla-dark-link-color, #bfb1d5)",
      textDecoration: "underline",
      class: "dark-mode"
    },
    {
      tag: tags.monospace,
      fontFamily: "'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
      fontSize: "0.9em",
      color: "var(--vanilla-dark-code-color, #bfb1d5)",
      class: "dark-mode"
    },
  ]);
} 