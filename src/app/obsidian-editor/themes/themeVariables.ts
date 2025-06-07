import { EditorView } from "@codemirror/view";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// This file connects the CSS variables to the actual editor theme implementation

// Function to get CSS variable value with fallback
function getCssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

// Create light theme from CSS variables
export function createLightThemeFromCssVars() {
  return EditorView.theme(
    {
      "&": {
        color: "var(--light-text-normal, #1a1a1a)",
        backgroundColor: "var(--light-background-primary, #ffffff)",
      },
      ".cm-content": { caretColor: "var(--light-cursor, #3b82f6)" },
      ".cm-gutters": {
        backgroundColor: "var(--light-background-secondary, #f8f9fa)",
        color: "var(--light-text-muted, #6c757d)",
        border: "none",
      },
      ".cm-activeLine": { backgroundColor: "var(--light-active-line, rgba(0, 0, 0, 0.03))" },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--light-active-line-gutter, rgba(0, 0, 0, 0.05))",
      },
      ".cm-selectionBackground": { backgroundColor: "var(--light-selection-bg, #b3d7ff)" },
      ".cm-line": { padding: "0 4px" },
      ".cm-cursor": {
        borderLeftWidth: "2px",
        borderLeftColor: "var(--light-cursor, #3b82f6)",
      },
    },
    { dark: false }
  );
}

// Create dark theme from CSS variables
export function createDarkThemeFromCssVars() {
  return EditorView.theme(
    {
      "&": {
        color: "var(--dark-text-normal, #e0e0e0)",
        backgroundColor: "var(--dark-background-primary, #1e1e1e)",
      },
      ".cm-content": { caretColor: "var(--dark-cursor, #3b82f6)" },
      ".cm-gutters": {
        backgroundColor: "var(--dark-background-secondary, #252525)",
        color: "var(--dark-text-muted, #858585)",
        border: "none",
      },
      ".cm-activeLine": { backgroundColor: "var(--dark-active-line, rgba(255, 255, 255, 0.05))" },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--dark-active-line-gutter, rgba(255, 255, 255, 0.1))",
      },
      ".cm-selectionBackground": { backgroundColor: "var(--dark-selection-bg, #3a4b6d)" },
      ".cm-line": { padding: "0 4px" },
      ".cm-cursor": {
        borderLeftWidth: "2px",
        borderLeftColor: "var(--dark-cursor, #3b82f6)",
      },
    },
    { dark: true }
  );
}

// Create highlight styles from CSS variables
export function createHighlightStyleFromCssVars() {
  return HighlightStyle.define([
    {
      tag: tags.heading1,
      fontSize: "1.6em",
      fontWeight: "bold",
      color: "var(--light-heading-color, #1a1a1a)",
    },
    {
      tag: tags.heading2,
      fontSize: "1.4em",
      fontWeight: "bold",
      color: "var(--light-heading-color, #1a1a1a)",
    },
    {
      tag: tags.heading3,
      fontSize: "1.2em",
      fontWeight: "bold",
      color: "var(--light-heading-color, #1a1a1a)",
    },
    {
      tag: tags.emphasis,
      fontStyle: "italic",
      color: "var(--light-emphasis-color, #1a1a1a)",
    },
    { 
      tag: tags.strong, 
      fontWeight: "bold", 
      color: "var(--light-strong-color, #1a1a1a)" 
    },
    {
      tag: tags.link,
      color: "var(--light-link-color, #2563eb)",
      textDecoration: "underline",
    },
    {
      tag: tags.monospace,
      color: "var(--light-code-color, #10b981)",
      fontFamily: "monospace",
    },
  ]);
} 