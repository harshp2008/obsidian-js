import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { EditorView, ViewPlugin, Decoration, WidgetType, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view';
import { LRLanguage, HighlightStyle, indentNodeProp, foldNodeProp, continuedIndent, delimitedIndent, flatIndent, foldInside, sublanguageProp, defineLanguageFacet, syntaxTree, syntaxHighlighting, LanguageSupport, Language, foldService, LanguageDescription, ParseContext, bracketMatchingHandle, indentUnit, languageDataProp } from '@codemirror/language';
import { styleTags, tags } from '@lezer/highlight';
import { StateEffect, StateField, RangeSet, RangeSetBuilder, Compartment, Prec, EditorState, EditorSelection, countColumn } from '@codemirror/state';
import { snippetCompletion, ifNotIn, completeFromList, CompletionContext } from '@codemirror/autocomplete';
import { MarkdownParser, parseCode, parser as parser$1, GFM, Subscript, Superscript, Emoji } from '@lezer/markdown';
import { languages } from '@codemirror/language-data';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { marked } from 'marked';

var ThemeContext = createContext({
  theme: "light",
  mounted: false,
  toggleTheme: () => {
  }
});
var ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (storedTheme === "dark" || !storedTheme && prefersDark) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { theme, mounted, toggleTheme }, children });
};
var useTheme = () => useContext(ThemeContext);
function createVanillaLightTheme() {
  return EditorView.theme(
    {
      "&": {
        color: "var(--vanilla-light-text-normal, #2c2c2c)",
        backgroundColor: "var(--vanilla-light-background-primary, #fcfcfc)"
      },
      "&.cm-editor": {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          pointerEvents: "none"
        }
      },
      ".cm-content": {
        caretColor: "var(--vanilla-light-cursor, #625772)",
        fontFamily: "'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
      },
      ".cm-gutters": {
        backgroundColor: "var(--vanilla-light-background-secondary, #f5f5f5)",
        color: "var(--vanilla-light-text-muted, #707070)",
        border: "none"
      },
      ".cm-activeLine": {
        backgroundColor: "var(--vanilla-light-active-line, rgba(0, 0, 0, 0.03))"
      },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--vanilla-light-active-line-gutter, rgba(0, 0, 0, 0.05))"
      },
      ".cm-selectionBackground": {
        backgroundColor: "var(--vanilla-light-selection-bg, rgba(98, 87, 114, 0.15))"
      },
      ".cm-line": { padding: "0 4px" },
      ".cm-cursor": {
        borderLeftWidth: "2px",
        borderLeftColor: "var(--vanilla-light-cursor, #625772)"
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "var(--vanilla-light-cursor, #625772)"
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--vanilla-light-selection-bg, rgba(98, 87, 114, 0.15))"
      },
      ".cm-tooltip": {
        backgroundColor: "var(--vanilla-light-background-primary, #fcfcfc)",
        border: "1px solid var(--vanilla-light-border-color, #e2e2e2)",
        boxShadow: "var(--vanilla-light-shadow, 0 1px 3px rgba(0, 0, 0, 0.08))"
      }
    },
    { dark: false }
  );
}
function createVanillaDarkTheme() {
  return EditorView.theme(
    {
      "&": {
        color: "var(--vanilla-dark-text-normal, #e0e0e0)",
        backgroundColor: "var(--vanilla-dark-background-primary, #262626)"
      },
      "&.cm-editor": {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          pointerEvents: "none"
        }
      },
      ".cm-content": {
        caretColor: "var(--vanilla-dark-cursor, #bfb1d5)",
        fontFamily: "'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
      },
      ".cm-gutters": {
        backgroundColor: "var(--vanilla-dark-background-secondary, #2d2d2d)",
        color: "var(--vanilla-dark-text-muted, #a0a0a0)",
        border: "none"
      },
      ".cm-activeLine": {
        backgroundColor: "var(--vanilla-dark-active-line, rgba(255, 255, 255, 0.05))"
      },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--vanilla-dark-active-line-gutter, rgba(255, 255, 255, 0.08))"
      },
      ".cm-selectionBackground": {
        backgroundColor: "var(--vanilla-dark-selection-bg, rgba(191, 177, 213, 0.2))"
      },
      ".cm-line": { padding: "0 4px" },
      ".cm-cursor": {
        borderLeftWidth: "2px",
        borderLeftColor: "var(--vanilla-dark-cursor, #bfb1d5)"
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "var(--vanilla-dark-cursor, #bfb1d5)"
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--vanilla-dark-selection-bg, rgba(191, 177, 213, 0.2))"
      },
      ".cm-tooltip": {
        backgroundColor: "var(--vanilla-dark-background-primary, #262626)",
        border: "1px solid var(--vanilla-dark-border-color, #3d3d3d)",
        boxShadow: "var(--vanilla-dark-shadow, 0 2px 6px rgba(0, 0, 0, 0.25))"
      }
    },
    { dark: true }
  );
}
function createVanillaHighlightStyle() {
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
    }
  ]);
}

// src/app/obsidian-editor/themes/vanilla/index.ts
var vanillaLightTheme = createVanillaLightTheme();
var vanillaDarkTheme = createVanillaDarkTheme();
createVanillaHighlightStyle();

// src/app/obsidian-editor/utils/theme.ts
var THEME_STORAGE_KEY = "obsidian-js-editor-theme";
var DEFAULT_THEME = "default";
var getCurrentDocumentTheme = () => {
  if (typeof window !== "undefined") {
    const storedTheme = localStorage.getItem("obsidian-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }
  return "light";
};
function getCurrentEditorTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme || DEFAULT_THEME;
}
function setEditorTheme(themeName) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(THEME_STORAGE_KEY, themeName);
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const mode = isDark ? "dark" : "light";
  root.setAttribute("data-theme", `${themeName}-${mode}`);
  const event = new CustomEvent("editorThemeChange", {
    detail: { theme: themeName, mode }
  });
  document.dispatchEvent(event);
}
var obsidianCssVariables = {
  light: {
    "--background-primary": "#ffffff",
    "--background-secondary": "#f8f8f8",
    "--text-normal": "#2e3338",
    "--text-muted": "#888888",
    "--text-faint": "#999999",
    "--text-error": "#e75545",
    "--text-accent": "#705dcf",
    "--interactive-normal": "#f2f3f5",
    "--interactive-hover": "#e9e9e9",
    "--interactive-accent": "#7b6cd9",
    "--interactive-accent-hover": "#8875ff",
    "--link-color": "#5E81AC",
    "--hr-color": "#dcddde",
    "--tag-color": "#2991e3",
    "--selection-background": "rgba(104, 134, 197, 0.3)",
    "--code-background": "rgba(0, 0, 0, 0.03)"
  },
  dark: {
    "--background-primary": "#2b2b2b",
    "--background-secondary": "#363636",
    "--text-normal": "#dcddde",
    "--text-muted": "#999999",
    "--text-faint": "#666666",
    "--text-error": "#ff3333",
    "--text-accent": "#a277ff",
    "--interactive-normal": "#3f3f3f",
    "--interactive-hover": "#4a4a4a",
    "--interactive-accent": "#7b6cd9",
    "--interactive-accent-hover": "#8875ff",
    "--link-color": "#a8c0e0",
    "--hr-color": "#444444",
    "--tag-color": "#4097e3",
    "--selection-background": "rgba(104, 134, 197, 0.2)",
    "--code-background": "rgba(255, 255, 255, 0.05)"
  }
};
var applyThemeVariables = (theme) => {
  if (typeof document !== "undefined") {
    const variables = obsidianCssVariables[theme];
    const root = document.documentElement;
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }
};
var lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--background-primary, #ffffff)",
    color: "var(--text-normal, #2e3338)"
  },
  ".cm-content": {
    caretColor: "var(--text-normal, #2e3338)"
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--text-normal, #2e3338)"
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--selection-background, rgba(104, 134, 197, 0.3))"
  },
  ".cm-activeLine": {
    backgroundColor: "var(--background-secondary, #f5f6f8)"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--background-secondary, #f5f6f8)"
  }
}, { dark: false });
var darkTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--background-primary, #202020)",
    color: "var(--text-normal, #dcddde)"
  },
  ".cm-content": {
    caretColor: "var(--text-normal, #dcddde)"
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--text-normal, #dcddde)"
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--selection-background, rgba(104, 134, 197, 0.2))"
  },
  ".cm-activeLine": {
    backgroundColor: "var(--background-secondary, #161616)"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--background-secondary, #161616)"
  }
}, { dark: true });
var getTheme = (themeName, mode) => {
  if (themeName === "vanilla") {
    return mode === "dark" ? vanillaDarkTheme : vanillaLightTheme;
  } else {
    return mode === "dark" ? darkTheme : lightTheme;
  }
};
if (typeof window !== "undefined") {
  setTimeout(() => {
    const initialTheme = getCurrentDocumentTheme();
    applyThemeVariables(initialTheme);
    getCurrentEditorTheme();
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("obsidian-theme")) {
          const newTheme = e.matches ? "dark" : "light";
          applyThemeVariables(newTheme);
        }
      });
    }
  }, 0);
}

// node_modules/@lezer/common/dist/index.js
var DefaultBufferLength = 1024;
var nextPropID = 0;
var Range = class {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
};
var NodeProp = class {
  /**
  Create a new node prop type.
  */
  constructor(config = {}) {
    this.id = nextPropID++;
    this.perNode = !!config.perNode;
    this.deserialize = config.deserialize || (() => {
      throw new Error("This node type doesn't define a deserialize function");
    });
  }
  /**
  This is meant to be used with
  [`NodeSet.extend`](#common.NodeSet.extend) or
  [`LRParser.configure`](#lr.ParserConfig.props) to compute
  prop values for each node type in the set. Takes a [match
  object](#common.NodeType^match) or function that returns undefined
  if the node type doesn't get this prop, and the prop's value if
  it does.
  */
  add(match) {
    if (this.perNode)
      throw new RangeError("Can't add per-node props to node types");
    if (typeof match != "function")
      match = NodeType.match(match);
    return (type) => {
      let result = match(type);
      return result === void 0 ? null : [this, result];
    };
  }
};
NodeProp.closedBy = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.openedBy = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.group = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.isolate = new NodeProp({ deserialize: (value) => {
  if (value && value != "rtl" && value != "ltr" && value != "auto")
    throw new RangeError("Invalid value for isolate: " + value);
  return value || "auto";
} });
NodeProp.contextHash = new NodeProp({ perNode: true });
NodeProp.lookAhead = new NodeProp({ perNode: true });
NodeProp.mounted = new NodeProp({ perNode: true });
var MountedTree = class {
  constructor(tree, overlay, parser5) {
    this.tree = tree;
    this.overlay = overlay;
    this.parser = parser5;
  }
  /**
  @internal
  */
  static get(tree) {
    return tree && tree.props && tree.props[NodeProp.mounted.id];
  }
};
var noProps = /* @__PURE__ */ Object.create(null);
var NodeType = class _NodeType {
  /**
  @internal
  */
  constructor(name, props, id2, flags = 0) {
    this.name = name;
    this.props = props;
    this.id = id2;
    this.flags = flags;
  }
  /**
  Define a node type.
  */
  static define(spec) {
    let props = spec.props && spec.props.length ? /* @__PURE__ */ Object.create(null) : noProps;
    let flags = (spec.top ? 1 : 0) | (spec.skipped ? 2 : 0) | (spec.error ? 4 : 0) | (spec.name == null ? 8 : 0);
    let type = new _NodeType(spec.name || "", props, spec.id, flags);
    if (spec.props)
      for (let src of spec.props) {
        if (!Array.isArray(src))
          src = src(type);
        if (src) {
          if (src[0].perNode)
            throw new RangeError("Can't store a per-node prop on a node type");
          props[src[0].id] = src[1];
        }
      }
    return type;
  }
  /**
  Retrieves a node prop for this type. Will return `undefined` if
  the prop isn't present on this node.
  */
  prop(prop) {
    return this.props[prop.id];
  }
  /**
  True when this is the top node of a grammar.
  */
  get isTop() {
    return (this.flags & 1) > 0;
  }
  /**
  True when this node is produced by a skip rule.
  */
  get isSkipped() {
    return (this.flags & 2) > 0;
  }
  /**
  Indicates whether this is an error node.
  */
  get isError() {
    return (this.flags & 4) > 0;
  }
  /**
  When true, this node type doesn't correspond to a user-declared
  named node, for example because it is used to cache repetition.
  */
  get isAnonymous() {
    return (this.flags & 8) > 0;
  }
  /**
  Returns true when this node's name or one of its
  [groups](#common.NodeProp^group) matches the given string.
  */
  is(name) {
    if (typeof name == "string") {
      if (this.name == name)
        return true;
      let group = this.prop(NodeProp.group);
      return group ? group.indexOf(name) > -1 : false;
    }
    return this.id == name;
  }
  /**
  Create a function from node types to arbitrary values by
  specifying an object whose property names are node or
  [group](#common.NodeProp^group) names. Often useful with
  [`NodeProp.add`](#common.NodeProp.add). You can put multiple
  names, separated by spaces, in a single property name to map
  multiple node names to a single value.
  */
  static match(map) {
    let direct = /* @__PURE__ */ Object.create(null);
    for (let prop in map)
      for (let name of prop.split(" "))
        direct[name] = map[prop];
    return (node) => {
      for (let groups = node.prop(NodeProp.group), i = -1; i < (groups ? groups.length : 0); i++) {
        let found = direct[i < 0 ? node.name : groups[i]];
        if (found)
          return found;
      }
    };
  }
};
NodeType.none = new NodeType(
  "",
  /* @__PURE__ */ Object.create(null),
  0,
  8
  /* NodeFlag.Anonymous */
);
var NodeSet = class _NodeSet {
  /**
  Create a set with the given types. The `id` property of each
  type should correspond to its position within the array.
  */
  constructor(types) {
    this.types = types;
    for (let i = 0; i < types.length; i++)
      if (types[i].id != i)
        throw new RangeError("Node type ids should correspond to array positions when creating a node set");
  }
  /**
  Create a copy of this set with some node properties added. The
  arguments to this method can be created with
  [`NodeProp.add`](#common.NodeProp.add).
  */
  extend(...props) {
    let newTypes = [];
    for (let type of this.types) {
      let newProps = null;
      for (let source of props) {
        let add = source(type);
        if (add) {
          if (!newProps)
            newProps = Object.assign({}, type.props);
          newProps[add[0].id] = add[1];
        }
      }
      newTypes.push(newProps ? new NodeType(type.name, newProps, type.id, type.flags) : type);
    }
    return new _NodeSet(newTypes);
  }
};
var CachedNode = /* @__PURE__ */ new WeakMap();
var CachedInnerNode = /* @__PURE__ */ new WeakMap();
var IterMode;
(function(IterMode2) {
  IterMode2[IterMode2["ExcludeBuffers"] = 1] = "ExcludeBuffers";
  IterMode2[IterMode2["IncludeAnonymous"] = 2] = "IncludeAnonymous";
  IterMode2[IterMode2["IgnoreMounts"] = 4] = "IgnoreMounts";
  IterMode2[IterMode2["IgnoreOverlays"] = 8] = "IgnoreOverlays";
})(IterMode || (IterMode = {}));
var Tree = class _Tree {
  /**
  Construct a new tree. See also [`Tree.build`](#common.Tree^build).
  */
  constructor(type, children, positions, length, props) {
    this.type = type;
    this.children = children;
    this.positions = positions;
    this.length = length;
    this.props = null;
    if (props && props.length) {
      this.props = /* @__PURE__ */ Object.create(null);
      for (let [prop, value] of props)
        this.props[typeof prop == "number" ? prop : prop.id] = value;
    }
  }
  /**
  @internal
  */
  toString() {
    let mounted = MountedTree.get(this);
    if (mounted && !mounted.overlay)
      return mounted.tree.toString();
    let children = "";
    for (let ch of this.children) {
      let str = ch.toString();
      if (str) {
        if (children)
          children += ",";
        children += str;
      }
    }
    return !this.type.name ? children : (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (children.length ? "(" + children + ")" : "");
  }
  /**
  Get a [tree cursor](#common.TreeCursor) positioned at the top of
  the tree. Mode can be used to [control](#common.IterMode) which
  nodes the cursor visits.
  */
  cursor(mode = 0) {
    return new TreeCursor(this.topNode, mode);
  }
  /**
  Get a [tree cursor](#common.TreeCursor) pointing into this tree
  at the given position and side (see
  [`moveTo`](#common.TreeCursor.moveTo).
  */
  cursorAt(pos, side = 0, mode = 0) {
    let scope = CachedNode.get(this) || this.topNode;
    let cursor = new TreeCursor(scope);
    cursor.moveTo(pos, side);
    CachedNode.set(this, cursor._tree);
    return cursor;
  }
  /**
  Get a [syntax node](#common.SyntaxNode) object for the top of the
  tree.
  */
  get topNode() {
    return new TreeNode(this, 0, 0, null);
  }
  /**
  Get the [syntax node](#common.SyntaxNode) at the given position.
  If `side` is -1, this will move into nodes that end at the
  position. If 1, it'll move into nodes that start at the
  position. With 0, it'll only enter nodes that cover the position
  from both sides.
  
  Note that this will not enter
  [overlays](#common.MountedTree.overlay), and you often want
  [`resolveInner`](#common.Tree.resolveInner) instead.
  */
  resolve(pos, side = 0) {
    let node = resolveNode(CachedNode.get(this) || this.topNode, pos, side, false);
    CachedNode.set(this, node);
    return node;
  }
  /**
  Like [`resolve`](#common.Tree.resolve), but will enter
  [overlaid](#common.MountedTree.overlay) nodes, producing a syntax node
  pointing into the innermost overlaid tree at the given position
  (with parent links going through all parent structure, including
  the host trees).
  */
  resolveInner(pos, side = 0) {
    let node = resolveNode(CachedInnerNode.get(this) || this.topNode, pos, side, true);
    CachedInnerNode.set(this, node);
    return node;
  }
  /**
  In some situations, it can be useful to iterate through all
  nodes around a position, including those in overlays that don't
  directly cover the position. This method gives you an iterator
  that will produce all nodes, from small to big, around the given
  position.
  */
  resolveStack(pos, side = 0) {
    return stackIterator(this, pos, side);
  }
  /**
  Iterate over the tree and its children, calling `enter` for any
  node that touches the `from`/`to` region (if given) before
  running over such a node's children, and `leave` (if given) when
  leaving the node. When `enter` returns `false`, that node will
  not have its children iterated over (or `leave` called).
  */
  iterate(spec) {
    let { enter, leave, from = 0, to = this.length } = spec;
    let mode = spec.mode || 0, anon = (mode & IterMode.IncludeAnonymous) > 0;
    for (let c = this.cursor(mode | IterMode.IncludeAnonymous); ; ) {
      let entered = false;
      if (c.from <= to && c.to >= from && (!anon && c.type.isAnonymous || enter(c) !== false)) {
        if (c.firstChild())
          continue;
        entered = true;
      }
      for (; ; ) {
        if (entered && leave && (anon || !c.type.isAnonymous))
          leave(c);
        if (c.nextSibling())
          break;
        if (!c.parent())
          return;
        entered = true;
      }
    }
  }
  /**
  Get the value of the given [node prop](#common.NodeProp) for this
  node. Works with both per-node and per-type props.
  */
  prop(prop) {
    return !prop.perNode ? this.type.prop(prop) : this.props ? this.props[prop.id] : void 0;
  }
  /**
  Returns the node's [per-node props](#common.NodeProp.perNode) in a
  format that can be passed to the [`Tree`](#common.Tree)
  constructor.
  */
  get propValues() {
    let result = [];
    if (this.props)
      for (let id2 in this.props)
        result.push([+id2, this.props[id2]]);
    return result;
  }
  /**
  Balance the direct children of this tree, producing a copy of
  which may have children grouped into subtrees with type
  [`NodeType.none`](#common.NodeType^none).
  */
  balance(config = {}) {
    return this.children.length <= 8 ? this : balanceRange(NodeType.none, this.children, this.positions, 0, this.children.length, 0, this.length, (children, positions, length) => new _Tree(this.type, children, positions, length, this.propValues), config.makeTree || ((children, positions, length) => new _Tree(NodeType.none, children, positions, length)));
  }
  /**
  Build a tree from a postfix-ordered buffer of node information,
  or a cursor over such a buffer.
  */
  static build(data2) {
    return buildTree(data2);
  }
};
Tree.empty = new Tree(NodeType.none, [], [], 0);
var FlatBufferCursor = class _FlatBufferCursor {
  constructor(buffer, index) {
    this.buffer = buffer;
    this.index = index;
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  get pos() {
    return this.index;
  }
  next() {
    this.index -= 4;
  }
  fork() {
    return new _FlatBufferCursor(this.buffer, this.index);
  }
};
var TreeBuffer = class _TreeBuffer {
  /**
  Create a tree buffer.
  */
  constructor(buffer, length, set) {
    this.buffer = buffer;
    this.length = length;
    this.set = set;
  }
  /**
  @internal
  */
  get type() {
    return NodeType.none;
  }
  /**
  @internal
  */
  toString() {
    let result = [];
    for (let index = 0; index < this.buffer.length; ) {
      result.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result.join(",");
  }
  /**
  @internal
  */
  childString(index) {
    let id2 = this.buffer[index], endIndex = this.buffer[index + 3];
    let type = this.set.types[id2], result = type.name;
    if (/\W/.test(result) && !type.isError)
      result = JSON.stringify(result);
    index += 4;
    if (endIndex == index)
      return result;
    let children = [];
    while (index < endIndex) {
      children.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result + "(" + children.join(",") + ")";
  }
  /**
  @internal
  */
  findChild(startIndex, endIndex, dir, pos, side) {
    let { buffer } = this, pick = -1;
    for (let i = startIndex; i != endIndex; i = buffer[i + 3]) {
      if (checkSide(side, pos, buffer[i + 1], buffer[i + 2])) {
        pick = i;
        if (dir > 0)
          break;
      }
    }
    return pick;
  }
  /**
  @internal
  */
  slice(startI, endI, from) {
    let b = this.buffer;
    let copy = new Uint16Array(endI - startI), len = 0;
    for (let i = startI, j = 0; i < endI; ) {
      copy[j++] = b[i++];
      copy[j++] = b[i++] - from;
      let to = copy[j++] = b[i++] - from;
      copy[j++] = b[i++] - startI;
      len = Math.max(len, to);
    }
    return new _TreeBuffer(copy, len, this.set);
  }
};
function checkSide(side, pos, from, to) {
  switch (side) {
    case -2:
      return from < pos;
    case -1:
      return to >= pos && from < pos;
    case 0:
      return from < pos && to > pos;
    case 1:
      return from <= pos && to > pos;
    case 2:
      return to > pos;
    case 4:
      return true;
  }
}
function resolveNode(node, pos, side, overlays) {
  var _a;
  while (node.from == node.to || (side < 1 ? node.from >= pos : node.from > pos) || (side > -1 ? node.to <= pos : node.to < pos)) {
    let parent = !overlays && node instanceof TreeNode && node.index < 0 ? null : node.parent;
    if (!parent)
      return node;
    node = parent;
  }
  let mode = overlays ? 0 : IterMode.IgnoreOverlays;
  if (overlays)
    for (let scan = node, parent = scan.parent; parent; scan = parent, parent = scan.parent) {
      if (scan instanceof TreeNode && scan.index < 0 && ((_a = parent.enter(pos, side, mode)) === null || _a === void 0 ? void 0 : _a.from) != scan.from)
        node = parent;
    }
  for (; ; ) {
    let inner = node.enter(pos, side, mode);
    if (!inner)
      return node;
    node = inner;
  }
}
var BaseNode = class {
  cursor(mode = 0) {
    return new TreeCursor(this, mode);
  }
  getChild(type, before = null, after = null) {
    let r = getChildren(this, type, before, after);
    return r.length ? r[0] : null;
  }
  getChildren(type, before = null, after = null) {
    return getChildren(this, type, before, after);
  }
  resolve(pos, side = 0) {
    return resolveNode(this, pos, side, false);
  }
  resolveInner(pos, side = 0) {
    return resolveNode(this, pos, side, true);
  }
  matchContext(context) {
    return matchNodeContext(this.parent, context);
  }
  enterUnfinishedNodesBefore(pos) {
    let scan = this.childBefore(pos), node = this;
    while (scan) {
      let last = scan.lastChild;
      if (!last || last.to != scan.to)
        break;
      if (last.type.isError && last.from == last.to) {
        node = scan;
        scan = last.prevSibling;
      } else {
        scan = last;
      }
    }
    return node;
  }
  get node() {
    return this;
  }
  get next() {
    return this.parent;
  }
};
var TreeNode = class _TreeNode extends BaseNode {
  constructor(_tree, from, index, _parent) {
    super();
    this._tree = _tree;
    this.from = from;
    this.index = index;
    this._parent = _parent;
  }
  get type() {
    return this._tree.type;
  }
  get name() {
    return this._tree.type.name;
  }
  get to() {
    return this.from + this._tree.length;
  }
  nextChild(i, dir, pos, side, mode = 0) {
    for (let parent = this; ; ) {
      for (let { children, positions } = parent._tree, e = dir > 0 ? children.length : -1; i != e; i += dir) {
        let next = children[i], start = positions[i] + parent.from;
        if (!checkSide(side, pos, start, start + next.length))
          continue;
        if (next instanceof TreeBuffer) {
          if (mode & IterMode.ExcludeBuffers)
            continue;
          let index = next.findChild(0, next.buffer.length, dir, pos - start, side);
          if (index > -1)
            return new BufferNode(new BufferContext(parent, next, i, start), null, index);
        } else if (mode & IterMode.IncludeAnonymous || (!next.type.isAnonymous || hasChild(next))) {
          let mounted;
          if (!(mode & IterMode.IgnoreMounts) && (mounted = MountedTree.get(next)) && !mounted.overlay)
            return new _TreeNode(mounted.tree, start, i, parent);
          let inner = new _TreeNode(next, start, i, parent);
          return mode & IterMode.IncludeAnonymous || !inner.type.isAnonymous ? inner : inner.nextChild(dir < 0 ? next.children.length - 1 : 0, dir, pos, side);
        }
      }
      if (mode & IterMode.IncludeAnonymous || !parent.type.isAnonymous)
        return null;
      if (parent.index >= 0)
        i = parent.index + dir;
      else
        i = dir < 0 ? -1 : parent._parent._tree.children.length;
      parent = parent._parent;
      if (!parent)
        return null;
    }
  }
  get firstChild() {
    return this.nextChild(
      0,
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  get lastChild() {
    return this.nextChild(
      this._tree.children.length - 1,
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  childAfter(pos) {
    return this.nextChild(
      0,
      1,
      pos,
      2
      /* Side.After */
    );
  }
  childBefore(pos) {
    return this.nextChild(
      this._tree.children.length - 1,
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  enter(pos, side, mode = 0) {
    let mounted;
    if (!(mode & IterMode.IgnoreOverlays) && (mounted = MountedTree.get(this._tree)) && mounted.overlay) {
      let rPos = pos - this.from;
      for (let { from, to } of mounted.overlay) {
        if ((side > 0 ? from <= rPos : from < rPos) && (side < 0 ? to >= rPos : to > rPos))
          return new _TreeNode(mounted.tree, mounted.overlay[0].from + this.from, -1, this);
      }
    }
    return this.nextChild(0, 1, pos, side, mode);
  }
  nextSignificantParent() {
    let val = this;
    while (val.type.isAnonymous && val._parent)
      val = val._parent;
    return val;
  }
  get parent() {
    return this._parent ? this._parent.nextSignificantParent() : null;
  }
  get nextSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(
      this.index + 1,
      1,
      0,
      4
      /* Side.DontCare */
    ) : null;
  }
  get prevSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(
      this.index - 1,
      -1,
      0,
      4
      /* Side.DontCare */
    ) : null;
  }
  get tree() {
    return this._tree;
  }
  toTree() {
    return this._tree;
  }
  /**
  @internal
  */
  toString() {
    return this._tree.toString();
  }
};
function getChildren(node, type, before, after) {
  let cur = node.cursor(), result = [];
  if (!cur.firstChild())
    return result;
  if (before != null)
    for (let found = false; !found; ) {
      found = cur.type.is(before);
      if (!cur.nextSibling())
        return result;
    }
  for (; ; ) {
    if (after != null && cur.type.is(after))
      return result;
    if (cur.type.is(type))
      result.push(cur.node);
    if (!cur.nextSibling())
      return after == null ? result : [];
  }
}
function matchNodeContext(node, context, i = context.length - 1) {
  for (let p = node; i >= 0; p = p.parent) {
    if (!p)
      return false;
    if (!p.type.isAnonymous) {
      if (context[i] && context[i] != p.name)
        return false;
      i--;
    }
  }
  return true;
}
var BufferContext = class {
  constructor(parent, buffer, index, start) {
    this.parent = parent;
    this.buffer = buffer;
    this.index = index;
    this.start = start;
  }
};
var BufferNode = class _BufferNode extends BaseNode {
  get name() {
    return this.type.name;
  }
  get from() {
    return this.context.start + this.context.buffer.buffer[this.index + 1];
  }
  get to() {
    return this.context.start + this.context.buffer.buffer[this.index + 2];
  }
  constructor(context, _parent, index) {
    super();
    this.context = context;
    this._parent = _parent;
    this.index = index;
    this.type = context.buffer.set.types[context.buffer.buffer[index]];
  }
  child(dir, pos, side) {
    let { buffer } = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.context.start, side);
    return index < 0 ? null : new _BufferNode(this.context, this, index);
  }
  get firstChild() {
    return this.child(
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  get lastChild() {
    return this.child(
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  childAfter(pos) {
    return this.child(
      1,
      pos,
      2
      /* Side.After */
    );
  }
  childBefore(pos) {
    return this.child(
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  enter(pos, side, mode = 0) {
    if (mode & IterMode.ExcludeBuffers)
      return null;
    let { buffer } = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], side > 0 ? 1 : -1, pos - this.context.start, side);
    return index < 0 ? null : new _BufferNode(this.context, this, index);
  }
  get parent() {
    return this._parent || this.context.parent.nextSignificantParent();
  }
  externalSibling(dir) {
    return this._parent ? null : this.context.parent.nextChild(
      this.context.index + dir,
      dir,
      0,
      4
      /* Side.DontCare */
    );
  }
  get nextSibling() {
    let { buffer } = this.context;
    let after = buffer.buffer[this.index + 3];
    if (after < (this._parent ? buffer.buffer[this._parent.index + 3] : buffer.buffer.length))
      return new _BufferNode(this.context, this._parent, after);
    return this.externalSibling(1);
  }
  get prevSibling() {
    let { buffer } = this.context;
    let parentStart = this._parent ? this._parent.index + 4 : 0;
    if (this.index == parentStart)
      return this.externalSibling(-1);
    return new _BufferNode(this.context, this._parent, buffer.findChild(
      parentStart,
      this.index,
      -1,
      0,
      4
      /* Side.DontCare */
    ));
  }
  get tree() {
    return null;
  }
  toTree() {
    let children = [], positions = [];
    let { buffer } = this.context;
    let startI = this.index + 4, endI = buffer.buffer[this.index + 3];
    if (endI > startI) {
      let from = buffer.buffer[this.index + 1];
      children.push(buffer.slice(startI, endI, from));
      positions.push(0);
    }
    return new Tree(this.type, children, positions, this.to - this.from);
  }
  /**
  @internal
  */
  toString() {
    return this.context.buffer.childString(this.index);
  }
};
function iterStack(heads) {
  if (!heads.length)
    return null;
  let pick = 0, picked = heads[0];
  for (let i = 1; i < heads.length; i++) {
    let node = heads[i];
    if (node.from > picked.from || node.to < picked.to) {
      picked = node;
      pick = i;
    }
  }
  let next = picked instanceof TreeNode && picked.index < 0 ? null : picked.parent;
  let newHeads = heads.slice();
  if (next)
    newHeads[pick] = next;
  else
    newHeads.splice(pick, 1);
  return new StackIterator(newHeads, picked);
}
var StackIterator = class {
  constructor(heads, node) {
    this.heads = heads;
    this.node = node;
  }
  get next() {
    return iterStack(this.heads);
  }
};
function stackIterator(tree, pos, side) {
  let inner = tree.resolveInner(pos, side), layers = null;
  for (let scan = inner instanceof TreeNode ? inner : inner.context.parent; scan; scan = scan.parent) {
    if (scan.index < 0) {
      let parent = scan.parent;
      (layers || (layers = [inner])).push(parent.resolve(pos, side));
      scan = parent;
    } else {
      let mount = MountedTree.get(scan.tree);
      if (mount && mount.overlay && mount.overlay[0].from <= pos && mount.overlay[mount.overlay.length - 1].to >= pos) {
        let root = new TreeNode(mount.tree, mount.overlay[0].from + scan.from, -1, scan);
        (layers || (layers = [inner])).push(resolveNode(root, pos, side, false));
      }
    }
  }
  return layers ? iterStack(layers) : inner;
}
var TreeCursor = class {
  /**
  Shorthand for `.type.name`.
  */
  get name() {
    return this.type.name;
  }
  /**
  @internal
  */
  constructor(node, mode = 0) {
    this.mode = mode;
    this.buffer = null;
    this.stack = [];
    this.index = 0;
    this.bufferNode = null;
    if (node instanceof TreeNode) {
      this.yieldNode(node);
    } else {
      this._tree = node.context.parent;
      this.buffer = node.context;
      for (let n = node._parent; n; n = n._parent)
        this.stack.unshift(n.index);
      this.bufferNode = node;
      this.yieldBuf(node.index);
    }
  }
  yieldNode(node) {
    if (!node)
      return false;
    this._tree = node;
    this.type = node.type;
    this.from = node.from;
    this.to = node.to;
    return true;
  }
  yieldBuf(index, type) {
    this.index = index;
    let { start, buffer } = this.buffer;
    this.type = type || buffer.set.types[buffer.buffer[index]];
    this.from = start + buffer.buffer[index + 1];
    this.to = start + buffer.buffer[index + 2];
    return true;
  }
  /**
  @internal
  */
  yield(node) {
    if (!node)
      return false;
    if (node instanceof TreeNode) {
      this.buffer = null;
      return this.yieldNode(node);
    }
    this.buffer = node.context;
    return this.yieldBuf(node.index, node.type);
  }
  /**
  @internal
  */
  toString() {
    return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
  }
  /**
  @internal
  */
  enterChild(dir, pos, side) {
    if (!this.buffer)
      return this.yield(this._tree.nextChild(dir < 0 ? this._tree._tree.children.length - 1 : 0, dir, pos, side, this.mode));
    let { buffer } = this.buffer;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.buffer.start, side);
    if (index < 0)
      return false;
    this.stack.push(this.index);
    return this.yieldBuf(index);
  }
  /**
  Move the cursor to this node's first child. When this returns
  false, the node has no child, and the cursor has not been moved.
  */
  firstChild() {
    return this.enterChild(
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  /**
  Move the cursor to this node's last child.
  */
  lastChild() {
    return this.enterChild(
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  /**
  Move the cursor to the first child that ends after `pos`.
  */
  childAfter(pos) {
    return this.enterChild(
      1,
      pos,
      2
      /* Side.After */
    );
  }
  /**
  Move to the last child that starts before `pos`.
  */
  childBefore(pos) {
    return this.enterChild(
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  /**
  Move the cursor to the child around `pos`. If side is -1 the
  child may end at that position, when 1 it may start there. This
  will also enter [overlaid](#common.MountedTree.overlay)
  [mounted](#common.NodeProp^mounted) trees unless `overlays` is
  set to false.
  */
  enter(pos, side, mode = this.mode) {
    if (!this.buffer)
      return this.yield(this._tree.enter(pos, side, mode));
    return mode & IterMode.ExcludeBuffers ? false : this.enterChild(1, pos, side);
  }
  /**
  Move to the node's parent node, if this isn't the top node.
  */
  parent() {
    if (!this.buffer)
      return this.yieldNode(this.mode & IterMode.IncludeAnonymous ? this._tree._parent : this._tree.parent);
    if (this.stack.length)
      return this.yieldBuf(this.stack.pop());
    let parent = this.mode & IterMode.IncludeAnonymous ? this.buffer.parent : this.buffer.parent.nextSignificantParent();
    this.buffer = null;
    return this.yieldNode(parent);
  }
  /**
  @internal
  */
  sibling(dir) {
    if (!this.buffer)
      return !this._tree._parent ? false : this.yield(this._tree.index < 0 ? null : this._tree._parent.nextChild(this._tree.index + dir, dir, 0, 4, this.mode));
    let { buffer } = this.buffer, d = this.stack.length - 1;
    if (dir < 0) {
      let parentStart = d < 0 ? 0 : this.stack[d] + 4;
      if (this.index != parentStart)
        return this.yieldBuf(buffer.findChild(
          parentStart,
          this.index,
          -1,
          0,
          4
          /* Side.DontCare */
        ));
    } else {
      let after = buffer.buffer[this.index + 3];
      if (after < (d < 0 ? buffer.buffer.length : buffer.buffer[this.stack[d] + 3]))
        return this.yieldBuf(after);
    }
    return d < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + dir, dir, 0, 4, this.mode)) : false;
  }
  /**
  Move to this node's next sibling, if any.
  */
  nextSibling() {
    return this.sibling(1);
  }
  /**
  Move to this node's previous sibling, if any.
  */
  prevSibling() {
    return this.sibling(-1);
  }
  atLastNode(dir) {
    let index, parent, { buffer } = this;
    if (buffer) {
      if (dir > 0) {
        if (this.index < buffer.buffer.buffer.length)
          return false;
      } else {
        for (let i = 0; i < this.index; i++)
          if (buffer.buffer.buffer[i + 3] < this.index)
            return false;
      }
      ({ index, parent } = buffer);
    } else {
      ({ index, _parent: parent } = this._tree);
    }
    for (; parent; { index, _parent: parent } = parent) {
      if (index > -1)
        for (let i = index + dir, e = dir < 0 ? -1 : parent._tree.children.length; i != e; i += dir) {
          let child = parent._tree.children[i];
          if (this.mode & IterMode.IncludeAnonymous || child instanceof TreeBuffer || !child.type.isAnonymous || hasChild(child))
            return false;
        }
    }
    return true;
  }
  move(dir, enter) {
    if (enter && this.enterChild(
      dir,
      0,
      4
      /* Side.DontCare */
    ))
      return true;
    for (; ; ) {
      if (this.sibling(dir))
        return true;
      if (this.atLastNode(dir) || !this.parent())
        return false;
    }
  }
  /**
  Move to the next node in a
  [pre-order](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order,_NLR)
  traversal, going from a node to its first child or, if the
  current node is empty or `enter` is false, its next sibling or
  the next sibling of the first parent node that has one.
  */
  next(enter = true) {
    return this.move(1, enter);
  }
  /**
  Move to the next node in a last-to-first pre-order traversal. A
  node is followed by its last child or, if it has none, its
  previous sibling or the previous sibling of the first parent
  node that has one.
  */
  prev(enter = true) {
    return this.move(-1, enter);
  }
  /**
  Move the cursor to the innermost node that covers `pos`. If
  `side` is -1, it will enter nodes that end at `pos`. If it is 1,
  it will enter nodes that start at `pos`.
  */
  moveTo(pos, side = 0) {
    while (this.from == this.to || (side < 1 ? this.from >= pos : this.from > pos) || (side > -1 ? this.to <= pos : this.to < pos))
      if (!this.parent())
        break;
    while (this.enterChild(1, pos, side)) {
    }
    return this;
  }
  /**
  Get a [syntax node](#common.SyntaxNode) at the cursor's current
  position.
  */
  get node() {
    if (!this.buffer)
      return this._tree;
    let cache2 = this.bufferNode, result = null, depth = 0;
    if (cache2 && cache2.context == this.buffer) {
      scan: for (let index = this.index, d = this.stack.length; d >= 0; ) {
        for (let c = cache2; c; c = c._parent)
          if (c.index == index) {
            if (index == this.index)
              return c;
            result = c;
            depth = d + 1;
            break scan;
          }
        index = this.stack[--d];
      }
    }
    for (let i = depth; i < this.stack.length; i++)
      result = new BufferNode(this.buffer, result, this.stack[i]);
    return this.bufferNode = new BufferNode(this.buffer, result, this.index);
  }
  /**
  Get the [tree](#common.Tree) that represents the current node, if
  any. Will return null when the node is in a [tree
  buffer](#common.TreeBuffer).
  */
  get tree() {
    return this.buffer ? null : this._tree._tree;
  }
  /**
  Iterate over the current node and all its descendants, calling
  `enter` when entering a node and `leave`, if given, when leaving
  one. When `enter` returns `false`, any children of that node are
  skipped, and `leave` isn't called for it.
  */
  iterate(enter, leave) {
    for (let depth = 0; ; ) {
      let mustLeave = false;
      if (this.type.isAnonymous || enter(this) !== false) {
        if (this.firstChild()) {
          depth++;
          continue;
        }
        if (!this.type.isAnonymous)
          mustLeave = true;
      }
      for (; ; ) {
        if (mustLeave && leave)
          leave(this);
        mustLeave = this.type.isAnonymous;
        if (!depth)
          return;
        if (this.nextSibling())
          break;
        this.parent();
        depth--;
        mustLeave = true;
      }
    }
  }
  /**
  Test whether the current node matches a given context—a sequence
  of direct parent node names. Empty strings in the context array
  are treated as wildcards.
  */
  matchContext(context) {
    if (!this.buffer)
      return matchNodeContext(this.node.parent, context);
    let { buffer } = this.buffer, { types } = buffer.set;
    for (let i = context.length - 1, d = this.stack.length - 1; i >= 0; d--) {
      if (d < 0)
        return matchNodeContext(this._tree, context, i);
      let type = types[buffer.buffer[this.stack[d]]];
      if (!type.isAnonymous) {
        if (context[i] && context[i] != type.name)
          return false;
        i--;
      }
    }
    return true;
  }
};
function hasChild(tree) {
  return tree.children.some((ch) => ch instanceof TreeBuffer || !ch.type.isAnonymous || hasChild(ch));
}
function buildTree(data2) {
  var _a;
  let { buffer, nodeSet, maxBufferLength = DefaultBufferLength, reused = [], minRepeatType = nodeSet.types.length } = data2;
  let cursor = Array.isArray(buffer) ? new FlatBufferCursor(buffer, buffer.length) : buffer;
  let types = nodeSet.types;
  let contextHash = 0, lookAhead = 0;
  function takeNode(parentStart, minPos, children2, positions2, inRepeat, depth) {
    let { id: id2, start, end, size } = cursor;
    let lookAheadAtStart = lookAhead, contextAtStart = contextHash;
    while (size < 0) {
      cursor.next();
      if (size == -1) {
        let node2 = reused[id2];
        children2.push(node2);
        positions2.push(start - parentStart);
        return;
      } else if (size == -3) {
        contextHash = id2;
        return;
      } else if (size == -4) {
        lookAhead = id2;
        return;
      } else {
        throw new RangeError(`Unrecognized record size: ${size}`);
      }
    }
    let type = types[id2], node, buffer2;
    let startPos = start - parentStart;
    if (end - start <= maxBufferLength && (buffer2 = findBufferSize(cursor.pos - minPos, inRepeat))) {
      let data3 = new Uint16Array(buffer2.size - buffer2.skip);
      let endPos = cursor.pos - buffer2.size, index = data3.length;
      while (cursor.pos > endPos)
        index = copyToBuffer(buffer2.start, data3, index);
      node = new TreeBuffer(data3, end - buffer2.start, nodeSet);
      startPos = buffer2.start - parentStart;
    } else {
      let endPos = cursor.pos - size;
      cursor.next();
      let localChildren = [], localPositions = [];
      let localInRepeat = id2 >= minRepeatType ? id2 : -1;
      let lastGroup = 0, lastEnd = end;
      while (cursor.pos > endPos) {
        if (localInRepeat >= 0 && cursor.id == localInRepeat && cursor.size >= 0) {
          if (cursor.end <= lastEnd - maxBufferLength) {
            makeRepeatLeaf(localChildren, localPositions, start, lastGroup, cursor.end, lastEnd, localInRepeat, lookAheadAtStart, contextAtStart);
            lastGroup = localChildren.length;
            lastEnd = cursor.end;
          }
          cursor.next();
        } else if (depth > 2500) {
          takeFlatNode(start, endPos, localChildren, localPositions);
        } else {
          takeNode(start, endPos, localChildren, localPositions, localInRepeat, depth + 1);
        }
      }
      if (localInRepeat >= 0 && lastGroup > 0 && lastGroup < localChildren.length)
        makeRepeatLeaf(localChildren, localPositions, start, lastGroup, start, lastEnd, localInRepeat, lookAheadAtStart, contextAtStart);
      localChildren.reverse();
      localPositions.reverse();
      if (localInRepeat > -1 && lastGroup > 0) {
        let make = makeBalanced(type, contextAtStart);
        node = balanceRange(type, localChildren, localPositions, 0, localChildren.length, 0, end - start, make, make);
      } else {
        node = makeTree(type, localChildren, localPositions, end - start, lookAheadAtStart - end, contextAtStart);
      }
    }
    children2.push(node);
    positions2.push(startPos);
  }
  function takeFlatNode(parentStart, minPos, children2, positions2) {
    let nodes = [];
    let nodeCount = 0, stopAt = -1;
    while (cursor.pos > minPos) {
      let { id: id2, start, end, size } = cursor;
      if (size > 4) {
        cursor.next();
      } else if (stopAt > -1 && start < stopAt) {
        break;
      } else {
        if (stopAt < 0)
          stopAt = end - maxBufferLength;
        nodes.push(id2, start, end);
        nodeCount++;
        cursor.next();
      }
    }
    if (nodeCount) {
      let buffer2 = new Uint16Array(nodeCount * 4);
      let start = nodes[nodes.length - 2];
      for (let i = nodes.length - 3, j = 0; i >= 0; i -= 3) {
        buffer2[j++] = nodes[i];
        buffer2[j++] = nodes[i + 1] - start;
        buffer2[j++] = nodes[i + 2] - start;
        buffer2[j++] = j;
      }
      children2.push(new TreeBuffer(buffer2, nodes[2] - start, nodeSet));
      positions2.push(start - parentStart);
    }
  }
  function makeBalanced(type, contextHash2) {
    return (children2, positions2, length2) => {
      let lookAhead2 = 0, lastI = children2.length - 1, last, lookAheadProp;
      if (lastI >= 0 && (last = children2[lastI]) instanceof Tree) {
        if (!lastI && last.type == type && last.length == length2)
          return last;
        if (lookAheadProp = last.prop(NodeProp.lookAhead))
          lookAhead2 = positions2[lastI] + last.length + lookAheadProp;
      }
      return makeTree(type, children2, positions2, length2, lookAhead2, contextHash2);
    };
  }
  function makeRepeatLeaf(children2, positions2, base, i, from, to, type, lookAhead2, contextHash2) {
    let localChildren = [], localPositions = [];
    while (children2.length > i) {
      localChildren.push(children2.pop());
      localPositions.push(positions2.pop() + base - from);
    }
    children2.push(makeTree(nodeSet.types[type], localChildren, localPositions, to - from, lookAhead2 - to, contextHash2));
    positions2.push(from - base);
  }
  function makeTree(type, children2, positions2, length2, lookAhead2, contextHash2, props) {
    if (contextHash2) {
      let pair2 = [NodeProp.contextHash, contextHash2];
      props = props ? [pair2].concat(props) : [pair2];
    }
    if (lookAhead2 > 25) {
      let pair2 = [NodeProp.lookAhead, lookAhead2];
      props = props ? [pair2].concat(props) : [pair2];
    }
    return new Tree(type, children2, positions2, length2, props);
  }
  function findBufferSize(maxSize, inRepeat) {
    let fork = cursor.fork();
    let size = 0, start = 0, skip = 0, minStart = fork.end - maxBufferLength;
    let result = { size: 0, start: 0, skip: 0 };
    scan: for (let minPos = fork.pos - maxSize; fork.pos > minPos; ) {
      let nodeSize2 = fork.size;
      if (fork.id == inRepeat && nodeSize2 >= 0) {
        result.size = size;
        result.start = start;
        result.skip = skip;
        skip += 4;
        size += 4;
        fork.next();
        continue;
      }
      let startPos = fork.pos - nodeSize2;
      if (nodeSize2 < 0 || startPos < minPos || fork.start < minStart)
        break;
      let localSkipped = fork.id >= minRepeatType ? 4 : 0;
      let nodeStart = fork.start;
      fork.next();
      while (fork.pos > startPos) {
        if (fork.size < 0) {
          if (fork.size == -3)
            localSkipped += 4;
          else
            break scan;
        } else if (fork.id >= minRepeatType) {
          localSkipped += 4;
        }
        fork.next();
      }
      start = nodeStart;
      size += nodeSize2;
      skip += localSkipped;
    }
    if (inRepeat < 0 || size == maxSize) {
      result.size = size;
      result.start = start;
      result.skip = skip;
    }
    return result.size > 4 ? result : void 0;
  }
  function copyToBuffer(bufferStart, buffer2, index) {
    let { id: id2, start, end, size } = cursor;
    cursor.next();
    if (size >= 0 && id2 < minRepeatType) {
      let startIndex = index;
      if (size > 4) {
        let endPos = cursor.pos - (size - 4);
        while (cursor.pos > endPos)
          index = copyToBuffer(bufferStart, buffer2, index);
      }
      buffer2[--index] = startIndex;
      buffer2[--index] = end - bufferStart;
      buffer2[--index] = start - bufferStart;
      buffer2[--index] = id2;
    } else if (size == -3) {
      contextHash = id2;
    } else if (size == -4) {
      lookAhead = id2;
    }
    return index;
  }
  let children = [], positions = [];
  while (cursor.pos > 0)
    takeNode(data2.start || 0, data2.bufferStart || 0, children, positions, -1, 0);
  let length = (_a = data2.length) !== null && _a !== void 0 ? _a : children.length ? positions[0] + children[0].length : 0;
  return new Tree(types[data2.topID], children.reverse(), positions.reverse(), length);
}
var nodeSizeCache = /* @__PURE__ */ new WeakMap();
function nodeSize(balanceType, node) {
  if (!balanceType.isAnonymous || node instanceof TreeBuffer || node.type != balanceType)
    return 1;
  let size = nodeSizeCache.get(node);
  if (size == null) {
    size = 1;
    for (let child of node.children) {
      if (child.type != balanceType || !(child instanceof Tree)) {
        size = 1;
        break;
      }
      size += nodeSize(balanceType, child);
    }
    nodeSizeCache.set(node, size);
  }
  return size;
}
function balanceRange(balanceType, children, positions, from, to, start, length, mkTop, mkTree) {
  let total = 0;
  for (let i = from; i < to; i++)
    total += nodeSize(balanceType, children[i]);
  let maxChild = Math.ceil(
    total * 1.5 / 8
    /* Balance.BranchFactor */
  );
  let localChildren = [], localPositions = [];
  function divide(children2, positions2, from2, to2, offset) {
    for (let i = from2; i < to2; ) {
      let groupFrom = i, groupStart = positions2[i], groupSize = nodeSize(balanceType, children2[i]);
      i++;
      for (; i < to2; i++) {
        let nextSize = nodeSize(balanceType, children2[i]);
        if (groupSize + nextSize >= maxChild)
          break;
        groupSize += nextSize;
      }
      if (i == groupFrom + 1) {
        if (groupSize > maxChild) {
          let only = children2[groupFrom];
          divide(only.children, only.positions, 0, only.children.length, positions2[groupFrom] + offset);
          continue;
        }
        localChildren.push(children2[groupFrom]);
      } else {
        let length2 = positions2[i - 1] + children2[i - 1].length - groupStart;
        localChildren.push(balanceRange(balanceType, children2, positions2, groupFrom, i, groupStart, length2, null, mkTree));
      }
      localPositions.push(groupStart + offset - start);
    }
  }
  divide(children, positions, from, to, 0);
  return (mkTop || mkTree)(localChildren, localPositions, length);
}
var NodeWeakMap = class {
  constructor() {
    this.map = /* @__PURE__ */ new WeakMap();
  }
  setBuffer(buffer, index, value) {
    let inner = this.map.get(buffer);
    if (!inner)
      this.map.set(buffer, inner = /* @__PURE__ */ new Map());
    inner.set(index, value);
  }
  getBuffer(buffer, index) {
    let inner = this.map.get(buffer);
    return inner && inner.get(index);
  }
  /**
  Set the value for this syntax node.
  */
  set(node, value) {
    if (node instanceof BufferNode)
      this.setBuffer(node.context.buffer, node.index, value);
    else if (node instanceof TreeNode)
      this.map.set(node.tree, value);
  }
  /**
  Retrieve value for this syntax node, if it exists in the map.
  */
  get(node) {
    return node instanceof BufferNode ? this.getBuffer(node.context.buffer, node.index) : node instanceof TreeNode ? this.map.get(node.tree) : void 0;
  }
  /**
  Set the value for the node that a cursor currently points to.
  */
  cursorSet(cursor, value) {
    if (cursor.buffer)
      this.setBuffer(cursor.buffer.buffer, cursor.index, value);
    else
      this.map.set(cursor.tree, value);
  }
  /**
  Retrieve the value for the node that a cursor currently points
  to.
  */
  cursorGet(cursor) {
    return cursor.buffer ? this.getBuffer(cursor.buffer.buffer, cursor.index) : this.map.get(cursor.tree);
  }
};
var TreeFragment = class _TreeFragment {
  /**
  Construct a tree fragment. You'll usually want to use
  [`addTree`](#common.TreeFragment^addTree) and
  [`applyChanges`](#common.TreeFragment^applyChanges) instead of
  calling this directly.
  */
  constructor(from, to, tree, offset, openStart = false, openEnd = false) {
    this.from = from;
    this.to = to;
    this.tree = tree;
    this.offset = offset;
    this.open = (openStart ? 1 : 0) | (openEnd ? 2 : 0);
  }
  /**
  Whether the start of the fragment represents the start of a
  parse, or the end of a change. (In the second case, it may not
  be safe to reuse some nodes at the start, depending on the
  parsing algorithm.)
  */
  get openStart() {
    return (this.open & 1) > 0;
  }
  /**
  Whether the end of the fragment represents the end of a
  full-document parse, or the start of a change.
  */
  get openEnd() {
    return (this.open & 2) > 0;
  }
  /**
  Create a set of fragments from a freshly parsed tree, or update
  an existing set of fragments by replacing the ones that overlap
  with a tree with content from the new tree. When `partial` is
  true, the parse is treated as incomplete, and the resulting
  fragment has [`openEnd`](#common.TreeFragment.openEnd) set to
  true.
  */
  static addTree(tree, fragments = [], partial = false) {
    let result = [new _TreeFragment(0, tree.length, tree, 0, false, partial)];
    for (let f of fragments)
      if (f.to > tree.length)
        result.push(f);
    return result;
  }
  /**
  Apply a set of edits to an array of fragments, removing or
  splitting fragments as necessary to remove edited ranges, and
  adjusting offsets for fragments that moved.
  */
  static applyChanges(fragments, changes, minGap = 128) {
    if (!changes.length)
      return fragments;
    let result = [];
    let fI = 1, nextF = fragments.length ? fragments[0] : null;
    for (let cI = 0, pos = 0, off = 0; ; cI++) {
      let nextC = cI < changes.length ? changes[cI] : null;
      let nextPos = nextC ? nextC.fromA : 1e9;
      if (nextPos - pos >= minGap)
        while (nextF && nextF.from < nextPos) {
          let cut = nextF;
          if (pos >= cut.from || nextPos <= cut.to || off) {
            let fFrom = Math.max(cut.from, pos) - off, fTo = Math.min(cut.to, nextPos) - off;
            cut = fFrom >= fTo ? null : new _TreeFragment(fFrom, fTo, cut.tree, cut.offset + off, cI > 0, !!nextC);
          }
          if (cut)
            result.push(cut);
          if (nextF.to > nextPos)
            break;
          nextF = fI < fragments.length ? fragments[fI++] : null;
        }
      if (!nextC)
        break;
      pos = nextC.toA;
      off = nextC.toA - nextC.toB;
    }
    return result;
  }
};
var Parser = class {
  /**
  Start a parse, returning a [partial parse](#common.PartialParse)
  object. [`fragments`](#common.TreeFragment) can be passed in to
  make the parse incremental.
  
  By default, the entire input is parsed. You can pass `ranges`,
  which should be a sorted array of non-empty, non-overlapping
  ranges, to parse only those ranges. The tree returned in that
  case will start at `ranges[0].from`.
  */
  startParse(input, fragments, ranges) {
    if (typeof input == "string")
      input = new StringInput(input);
    ranges = !ranges ? [new Range(0, input.length)] : ranges.length ? ranges.map((r) => new Range(r.from, r.to)) : [new Range(0, 0)];
    return this.createParse(input, fragments || [], ranges);
  }
  /**
  Run a full parse, returning the resulting tree.
  */
  parse(input, fragments, ranges) {
    let parse = this.startParse(input, fragments, ranges);
    for (; ; ) {
      let done = parse.advance();
      if (done)
        return done;
    }
  }
};
var StringInput = class {
  constructor(string) {
    this.string = string;
  }
  get length() {
    return this.string.length;
  }
  chunk(from) {
    return this.string.slice(from);
  }
  get lineChunks() {
    return false;
  }
  read(from, to) {
    return this.string.slice(from, to);
  }
};
function parseMixed(nest) {
  return (parse, input, fragments, ranges) => new MixedParse(parse, nest, input, fragments, ranges);
}
var InnerParse = class {
  constructor(parser5, parse, overlay, target, from) {
    this.parser = parser5;
    this.parse = parse;
    this.overlay = overlay;
    this.target = target;
    this.from = from;
  }
};
function checkRanges(ranges) {
  if (!ranges.length || ranges.some((r) => r.from >= r.to))
    throw new RangeError("Invalid inner parse ranges given: " + JSON.stringify(ranges));
}
var ActiveOverlay = class {
  constructor(parser5, predicate, mounts, index, start, target, prev) {
    this.parser = parser5;
    this.predicate = predicate;
    this.mounts = mounts;
    this.index = index;
    this.start = start;
    this.target = target;
    this.prev = prev;
    this.depth = 0;
    this.ranges = [];
  }
};
var stoppedInner = new NodeProp({ perNode: true });
var MixedParse = class {
  constructor(base, nest, input, fragments, ranges) {
    this.nest = nest;
    this.input = input;
    this.fragments = fragments;
    this.ranges = ranges;
    this.inner = [];
    this.innerDone = 0;
    this.baseTree = null;
    this.stoppedAt = null;
    this.baseParse = base;
  }
  advance() {
    if (this.baseParse) {
      let done2 = this.baseParse.advance();
      if (!done2)
        return null;
      this.baseParse = null;
      this.baseTree = done2;
      this.startInner();
      if (this.stoppedAt != null)
        for (let inner2 of this.inner)
          inner2.parse.stopAt(this.stoppedAt);
    }
    if (this.innerDone == this.inner.length) {
      let result = this.baseTree;
      if (this.stoppedAt != null)
        result = new Tree(result.type, result.children, result.positions, result.length, result.propValues.concat([[stoppedInner, this.stoppedAt]]));
      return result;
    }
    let inner = this.inner[this.innerDone], done = inner.parse.advance();
    if (done) {
      this.innerDone++;
      let props = Object.assign(/* @__PURE__ */ Object.create(null), inner.target.props);
      props[NodeProp.mounted.id] = new MountedTree(done, inner.overlay, inner.parser);
      inner.target.props = props;
    }
    return null;
  }
  get parsedPos() {
    if (this.baseParse)
      return 0;
    let pos = this.input.length;
    for (let i = this.innerDone; i < this.inner.length; i++) {
      if (this.inner[i].from < pos)
        pos = Math.min(pos, this.inner[i].parse.parsedPos);
    }
    return pos;
  }
  stopAt(pos) {
    this.stoppedAt = pos;
    if (this.baseParse)
      this.baseParse.stopAt(pos);
    else
      for (let i = this.innerDone; i < this.inner.length; i++)
        this.inner[i].parse.stopAt(pos);
  }
  startInner() {
    let fragmentCursor = new FragmentCursor(this.fragments);
    let overlay = null;
    let covered = null;
    let cursor = new TreeCursor(new TreeNode(this.baseTree, this.ranges[0].from, 0, null), IterMode.IncludeAnonymous | IterMode.IgnoreMounts);
    scan: for (let nest, isCovered; ; ) {
      let enter = true, range;
      if (this.stoppedAt != null && cursor.from >= this.stoppedAt) {
        enter = false;
      } else if (fragmentCursor.hasNode(cursor)) {
        if (overlay) {
          let match = overlay.mounts.find((m) => m.frag.from <= cursor.from && m.frag.to >= cursor.to && m.mount.overlay);
          if (match)
            for (let r of match.mount.overlay) {
              let from = r.from + match.pos, to = r.to + match.pos;
              if (from >= cursor.from && to <= cursor.to && !overlay.ranges.some((r2) => r2.from < to && r2.to > from))
                overlay.ranges.push({ from, to });
            }
        }
        enter = false;
      } else if (covered && (isCovered = checkCover(covered.ranges, cursor.from, cursor.to))) {
        enter = isCovered != 2;
      } else if (!cursor.type.isAnonymous && (nest = this.nest(cursor, this.input)) && (cursor.from < cursor.to || !nest.overlay)) {
        if (!cursor.tree)
          materialize(cursor);
        let oldMounts = fragmentCursor.findMounts(cursor.from, nest.parser);
        if (typeof nest.overlay == "function") {
          overlay = new ActiveOverlay(nest.parser, nest.overlay, oldMounts, this.inner.length, cursor.from, cursor.tree, overlay);
        } else {
          let ranges = punchRanges(this.ranges, nest.overlay || (cursor.from < cursor.to ? [new Range(cursor.from, cursor.to)] : []));
          if (ranges.length)
            checkRanges(ranges);
          if (ranges.length || !nest.overlay)
            this.inner.push(new InnerParse(nest.parser, ranges.length ? nest.parser.startParse(this.input, enterFragments(oldMounts, ranges), ranges) : nest.parser.startParse(""), nest.overlay ? nest.overlay.map((r) => new Range(r.from - cursor.from, r.to - cursor.from)) : null, cursor.tree, ranges.length ? ranges[0].from : cursor.from));
          if (!nest.overlay)
            enter = false;
          else if (ranges.length)
            covered = { ranges, depth: 0, prev: covered };
        }
      } else if (overlay && (range = overlay.predicate(cursor))) {
        if (range === true)
          range = new Range(cursor.from, cursor.to);
        if (range.from < range.to) {
          let last = overlay.ranges.length - 1;
          if (last >= 0 && overlay.ranges[last].to == range.from)
            overlay.ranges[last] = { from: overlay.ranges[last].from, to: range.to };
          else
            overlay.ranges.push(range);
        }
      }
      if (enter && cursor.firstChild()) {
        if (overlay)
          overlay.depth++;
        if (covered)
          covered.depth++;
      } else {
        for (; ; ) {
          if (cursor.nextSibling())
            break;
          if (!cursor.parent())
            break scan;
          if (overlay && !--overlay.depth) {
            let ranges = punchRanges(this.ranges, overlay.ranges);
            if (ranges.length) {
              checkRanges(ranges);
              this.inner.splice(overlay.index, 0, new InnerParse(overlay.parser, overlay.parser.startParse(this.input, enterFragments(overlay.mounts, ranges), ranges), overlay.ranges.map((r) => new Range(r.from - overlay.start, r.to - overlay.start)), overlay.target, ranges[0].from));
            }
            overlay = overlay.prev;
          }
          if (covered && !--covered.depth)
            covered = covered.prev;
        }
      }
    }
  }
};
function checkCover(covered, from, to) {
  for (let range of covered) {
    if (range.from >= to)
      break;
    if (range.to > from)
      return range.from <= from && range.to >= to ? 2 : 1;
  }
  return 0;
}
function sliceBuf(buf, startI, endI, nodes, positions, off) {
  if (startI < endI) {
    let from = buf.buffer[startI + 1];
    nodes.push(buf.slice(startI, endI, from));
    positions.push(from - off);
  }
}
function materialize(cursor) {
  let { node } = cursor, stack = [];
  let buffer = node.context.buffer;
  do {
    stack.push(cursor.index);
    cursor.parent();
  } while (!cursor.tree);
  let base = cursor.tree, i = base.children.indexOf(buffer);
  let buf = base.children[i], b = buf.buffer, newStack = [i];
  function split(startI, endI, type, innerOffset, length, stackPos) {
    let targetI = stack[stackPos];
    let children = [], positions = [];
    sliceBuf(buf, startI, targetI, children, positions, innerOffset);
    let from = b[targetI + 1], to = b[targetI + 2];
    newStack.push(children.length);
    let child = stackPos ? split(targetI + 4, b[targetI + 3], buf.set.types[b[targetI]], from, to - from, stackPos - 1) : node.toTree();
    children.push(child);
    positions.push(from - innerOffset);
    sliceBuf(buf, b[targetI + 3], endI, children, positions, innerOffset);
    return new Tree(type, children, positions, length);
  }
  base.children[i] = split(0, b.length, NodeType.none, 0, buf.length, stack.length - 1);
  for (let index of newStack) {
    let tree = cursor.tree.children[index], pos = cursor.tree.positions[index];
    cursor.yield(new TreeNode(tree, pos + cursor.from, index, cursor._tree));
  }
}
var StructureCursor = class {
  constructor(root, offset) {
    this.offset = offset;
    this.done = false;
    this.cursor = root.cursor(IterMode.IncludeAnonymous | IterMode.IgnoreMounts);
  }
  // Move to the first node (in pre-order) that starts at or after `pos`.
  moveTo(pos) {
    let { cursor } = this, p = pos - this.offset;
    while (!this.done && cursor.from < p) {
      if (cursor.to >= pos && cursor.enter(p, 1, IterMode.IgnoreOverlays | IterMode.ExcludeBuffers)) ;
      else if (!cursor.next(false))
        this.done = true;
    }
  }
  hasNode(cursor) {
    this.moveTo(cursor.from);
    if (!this.done && this.cursor.from + this.offset == cursor.from && this.cursor.tree) {
      for (let tree = this.cursor.tree; ; ) {
        if (tree == cursor.tree)
          return true;
        if (tree.children.length && tree.positions[0] == 0 && tree.children[0] instanceof Tree)
          tree = tree.children[0];
        else
          break;
      }
    }
    return false;
  }
};
var FragmentCursor = class {
  constructor(fragments) {
    var _a;
    this.fragments = fragments;
    this.curTo = 0;
    this.fragI = 0;
    if (fragments.length) {
      let first = this.curFrag = fragments[0];
      this.curTo = (_a = first.tree.prop(stoppedInner)) !== null && _a !== void 0 ? _a : first.to;
      this.inner = new StructureCursor(first.tree, -first.offset);
    } else {
      this.curFrag = this.inner = null;
    }
  }
  hasNode(node) {
    while (this.curFrag && node.from >= this.curTo)
      this.nextFrag();
    return this.curFrag && this.curFrag.from <= node.from && this.curTo >= node.to && this.inner.hasNode(node);
  }
  nextFrag() {
    var _a;
    this.fragI++;
    if (this.fragI == this.fragments.length) {
      this.curFrag = this.inner = null;
    } else {
      let frag = this.curFrag = this.fragments[this.fragI];
      this.curTo = (_a = frag.tree.prop(stoppedInner)) !== null && _a !== void 0 ? _a : frag.to;
      this.inner = new StructureCursor(frag.tree, -frag.offset);
    }
  }
  findMounts(pos, parser5) {
    var _a;
    let result = [];
    if (this.inner) {
      this.inner.cursor.moveTo(pos, 1);
      for (let pos2 = this.inner.cursor.node; pos2; pos2 = pos2.parent) {
        let mount = (_a = pos2.tree) === null || _a === void 0 ? void 0 : _a.prop(NodeProp.mounted);
        if (mount && mount.parser == parser5) {
          for (let i = this.fragI; i < this.fragments.length; i++) {
            let frag = this.fragments[i];
            if (frag.from >= pos2.to)
              break;
            if (frag.tree == this.curFrag.tree)
              result.push({
                frag,
                pos: pos2.from - frag.offset,
                mount
              });
          }
        }
      }
    }
    return result;
  }
};
function punchRanges(outer, ranges) {
  let copy = null, current = ranges;
  for (let i = 1, j = 0; i < outer.length; i++) {
    let gapFrom = outer[i - 1].to, gapTo = outer[i].from;
    for (; j < current.length; j++) {
      let r = current[j];
      if (r.from >= gapTo)
        break;
      if (r.to <= gapFrom)
        continue;
      if (!copy)
        current = copy = ranges.slice();
      if (r.from < gapFrom) {
        copy[j] = new Range(r.from, gapFrom);
        if (r.to > gapTo)
          copy.splice(j + 1, 0, new Range(gapTo, r.to));
      } else if (r.to > gapTo) {
        copy[j--] = new Range(gapTo, r.to);
      } else {
        copy.splice(j--, 1);
      }
    }
  }
  return current;
}
function findCoverChanges(a, b, from, to) {
  let iA = 0, iB = 0, inA = false, inB = false, pos = -1e9;
  let result = [];
  for (; ; ) {
    let nextA = iA == a.length ? 1e9 : inA ? a[iA].to : a[iA].from;
    let nextB = iB == b.length ? 1e9 : inB ? b[iB].to : b[iB].from;
    if (inA != inB) {
      let start = Math.max(pos, from), end = Math.min(nextA, nextB, to);
      if (start < end)
        result.push(new Range(start, end));
    }
    pos = Math.min(nextA, nextB);
    if (pos == 1e9)
      break;
    if (nextA == pos) {
      if (!inA)
        inA = true;
      else {
        inA = false;
        iA++;
      }
    }
    if (nextB == pos) {
      if (!inB)
        inB = true;
      else {
        inB = false;
        iB++;
      }
    }
  }
  return result;
}
function enterFragments(mounts, ranges) {
  let result = [];
  for (let { pos, mount, frag } of mounts) {
    let startPos = pos + (mount.overlay ? mount.overlay[0].from : 0), endPos = startPos + mount.tree.length;
    let from = Math.max(frag.from, startPos), to = Math.min(frag.to, endPos);
    if (mount.overlay) {
      let overlay = mount.overlay.map((r) => new Range(r.from + pos, r.to + pos));
      let changes = findCoverChanges(ranges, overlay, from, to);
      for (let i = 0, pos2 = from; ; i++) {
        let last = i == changes.length, end = last ? to : changes[i].from;
        if (end > pos2)
          result.push(new TreeFragment(pos2, end, mount.tree, -startPos, frag.from >= pos2 || frag.openStart, frag.to <= end || frag.openEnd));
        if (last)
          break;
        pos2 = changes[i].to;
      }
    } else {
      result.push(new TreeFragment(from, to, mount.tree, -startPos, frag.from >= startPos || frag.openStart, frag.to <= endPos || frag.openEnd));
    }
  }
  return result;
}

// node_modules/@lezer/lr/dist/index.js
var Stack = class _Stack {
  /**
  @internal
  */
  constructor(p, stack, state, reducePos, pos, score, buffer, bufferBase, curContext, lookAhead = 0, parent) {
    this.p = p;
    this.stack = stack;
    this.state = state;
    this.reducePos = reducePos;
    this.pos = pos;
    this.score = score;
    this.buffer = buffer;
    this.bufferBase = bufferBase;
    this.curContext = curContext;
    this.lookAhead = lookAhead;
    this.parent = parent;
  }
  /**
  @internal
  */
  toString() {
    return `[${this.stack.filter((_, i) => i % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? "!" + this.score : ""}`;
  }
  // Start an empty stack
  /**
  @internal
  */
  static start(p, state, pos = 0) {
    let cx = p.parser.context;
    return new _Stack(p, [], state, pos, pos, 0, [], 0, cx ? new StackContext(cx, cx.start) : null, 0, null);
  }
  /**
  The stack's current [context](#lr.ContextTracker) value, if
  any. Its type will depend on the context tracker's type
  parameter, or it will be `null` if there is no context
  tracker.
  */
  get context() {
    return this.curContext ? this.curContext.context : null;
  }
  // Push a state onto the stack, tracking its start position as well
  // as the buffer base at that point.
  /**
  @internal
  */
  pushState(state, start) {
    this.stack.push(this.state, start, this.bufferBase + this.buffer.length);
    this.state = state;
  }
  // Apply a reduce action
  /**
  @internal
  */
  reduce(action) {
    var _a;
    let depth = action >> 19, type = action & 65535;
    let { parser: parser5 } = this.p;
    let lookaheadRecord = this.reducePos < this.pos - 25;
    if (lookaheadRecord)
      this.setLookAhead(this.pos);
    let dPrec = parser5.dynamicPrecedence(type);
    if (dPrec)
      this.score += dPrec;
    if (depth == 0) {
      this.pushState(parser5.getGoto(this.state, type, true), this.reducePos);
      if (type < parser5.minRepeatTerm)
        this.storeNode(type, this.reducePos, this.reducePos, lookaheadRecord ? 8 : 4, true);
      this.reduceContext(type, this.reducePos);
      return;
    }
    let base = this.stack.length - (depth - 1) * 3 - (action & 262144 ? 6 : 0);
    let start = base ? this.stack[base - 2] : this.p.ranges[0].from, size = this.reducePos - start;
    if (size >= 2e3 && !((_a = this.p.parser.nodeSet.types[type]) === null || _a === void 0 ? void 0 : _a.isAnonymous)) {
      if (start == this.p.lastBigReductionStart) {
        this.p.bigReductionCount++;
        this.p.lastBigReductionSize = size;
      } else if (this.p.lastBigReductionSize < size) {
        this.p.bigReductionCount = 1;
        this.p.lastBigReductionStart = start;
        this.p.lastBigReductionSize = size;
      }
    }
    let bufferBase = base ? this.stack[base - 1] : 0, count = this.bufferBase + this.buffer.length - bufferBase;
    if (type < parser5.minRepeatTerm || action & 131072) {
      let pos = parser5.stateFlag(
        this.state,
        1
        /* StateFlag.Skipped */
      ) ? this.pos : this.reducePos;
      this.storeNode(type, start, pos, count + 4, true);
    }
    if (action & 262144) {
      this.state = this.stack[base];
    } else {
      let baseStateID = this.stack[base - 3];
      this.state = parser5.getGoto(baseStateID, type, true);
    }
    while (this.stack.length > base)
      this.stack.pop();
    this.reduceContext(type, start);
  }
  // Shift a value into the buffer
  /**
  @internal
  */
  storeNode(term, start, end, size = 4, mustSink = false) {
    if (term == 0 && (!this.stack.length || this.stack[this.stack.length - 1] < this.buffer.length + this.bufferBase)) {
      let cur = this, top = this.buffer.length;
      if (top == 0 && cur.parent) {
        top = cur.bufferBase - cur.parent.bufferBase;
        cur = cur.parent;
      }
      if (top > 0 && cur.buffer[top - 4] == 0 && cur.buffer[top - 1] > -1) {
        if (start == end)
          return;
        if (cur.buffer[top - 2] >= start) {
          cur.buffer[top - 2] = end;
          return;
        }
      }
    }
    if (!mustSink || this.pos == end) {
      this.buffer.push(term, start, end, size);
    } else {
      let index = this.buffer.length;
      if (index > 0 && this.buffer[index - 4] != 0) {
        let mustMove = false;
        for (let scan = index; scan > 0 && this.buffer[scan - 2] > end; scan -= 4) {
          if (this.buffer[scan - 1] >= 0) {
            mustMove = true;
            break;
          }
        }
        if (mustMove)
          while (index > 0 && this.buffer[index - 2] > end) {
            this.buffer[index] = this.buffer[index - 4];
            this.buffer[index + 1] = this.buffer[index - 3];
            this.buffer[index + 2] = this.buffer[index - 2];
            this.buffer[index + 3] = this.buffer[index - 1];
            index -= 4;
            if (size > 4)
              size -= 4;
          }
      }
      this.buffer[index] = term;
      this.buffer[index + 1] = start;
      this.buffer[index + 2] = end;
      this.buffer[index + 3] = size;
    }
  }
  // Apply a shift action
  /**
  @internal
  */
  shift(action, type, start, end) {
    if (action & 131072) {
      this.pushState(action & 65535, this.pos);
    } else if ((action & 262144) == 0) {
      let nextState = action, { parser: parser5 } = this.p;
      if (end > this.pos || type <= parser5.maxNode) {
        this.pos = end;
        if (!parser5.stateFlag(
          nextState,
          1
          /* StateFlag.Skipped */
        ))
          this.reducePos = end;
      }
      this.pushState(nextState, start);
      this.shiftContext(type, start);
      if (type <= parser5.maxNode)
        this.buffer.push(type, start, end, 4);
    } else {
      this.pos = end;
      this.shiftContext(type, start);
      if (type <= this.p.parser.maxNode)
        this.buffer.push(type, start, end, 4);
    }
  }
  // Apply an action
  /**
  @internal
  */
  apply(action, next, nextStart, nextEnd) {
    if (action & 65536)
      this.reduce(action);
    else
      this.shift(action, next, nextStart, nextEnd);
  }
  // Add a prebuilt (reused) node into the buffer.
  /**
  @internal
  */
  useNode(value, next) {
    let index = this.p.reused.length - 1;
    if (index < 0 || this.p.reused[index] != value) {
      this.p.reused.push(value);
      index++;
    }
    let start = this.pos;
    this.reducePos = this.pos = start + value.length;
    this.pushState(next, start);
    this.buffer.push(
      index,
      start,
      this.reducePos,
      -1
      /* size == -1 means this is a reused value */
    );
    if (this.curContext)
      this.updateContext(this.curContext.tracker.reuse(this.curContext.context, value, this, this.p.stream.reset(this.pos - value.length)));
  }
  // Split the stack. Due to the buffer sharing and the fact
  // that `this.stack` tends to stay quite shallow, this isn't very
  // expensive.
  /**
  @internal
  */
  split() {
    let parent = this;
    let off = parent.buffer.length;
    while (off > 0 && parent.buffer[off - 2] > parent.reducePos)
      off -= 4;
    let buffer = parent.buffer.slice(off), base = parent.bufferBase + off;
    while (parent && base == parent.bufferBase)
      parent = parent.parent;
    return new _Stack(this.p, this.stack.slice(), this.state, this.reducePos, this.pos, this.score, buffer, base, this.curContext, this.lookAhead, parent);
  }
  // Try to recover from an error by 'deleting' (ignoring) one token.
  /**
  @internal
  */
  recoverByDelete(next, nextEnd) {
    let isNode = next <= this.p.parser.maxNode;
    if (isNode)
      this.storeNode(next, this.pos, nextEnd, 4);
    this.storeNode(0, this.pos, nextEnd, isNode ? 8 : 4);
    this.pos = this.reducePos = nextEnd;
    this.score -= 190;
  }
  /**
  Check if the given term would be able to be shifted (optionally
  after some reductions) on this stack. This can be useful for
  external tokenizers that want to make sure they only provide a
  given token when it applies.
  */
  canShift(term) {
    for (let sim = new SimulatedStack(this); ; ) {
      let action = this.p.parser.stateSlot(
        sim.state,
        4
        /* ParseState.DefaultReduce */
      ) || this.p.parser.hasAction(sim.state, term);
      if (action == 0)
        return false;
      if ((action & 65536) == 0)
        return true;
      sim.reduce(action);
    }
  }
  // Apply up to Recover.MaxNext recovery actions that conceptually
  // inserts some missing token or rule.
  /**
  @internal
  */
  recoverByInsert(next) {
    if (this.stack.length >= 300)
      return [];
    let nextStates = this.p.parser.nextStates(this.state);
    if (nextStates.length > 4 << 1 || this.stack.length >= 120) {
      let best = [];
      for (let i = 0, s; i < nextStates.length; i += 2) {
        if ((s = nextStates[i + 1]) != this.state && this.p.parser.hasAction(s, next))
          best.push(nextStates[i], s);
      }
      if (this.stack.length < 120)
        for (let i = 0; best.length < 4 << 1 && i < nextStates.length; i += 2) {
          let s = nextStates[i + 1];
          if (!best.some((v, i2) => i2 & 1 && v == s))
            best.push(nextStates[i], s);
        }
      nextStates = best;
    }
    let result = [];
    for (let i = 0; i < nextStates.length && result.length < 4; i += 2) {
      let s = nextStates[i + 1];
      if (s == this.state)
        continue;
      let stack = this.split();
      stack.pushState(s, this.pos);
      stack.storeNode(0, stack.pos, stack.pos, 4, true);
      stack.shiftContext(nextStates[i], this.pos);
      stack.reducePos = this.pos;
      stack.score -= 200;
      result.push(stack);
    }
    return result;
  }
  // Force a reduce, if possible. Return false if that can't
  // be done.
  /**
  @internal
  */
  forceReduce() {
    let { parser: parser5 } = this.p;
    let reduce = parser5.stateSlot(
      this.state,
      5
      /* ParseState.ForcedReduce */
    );
    if ((reduce & 65536) == 0)
      return false;
    if (!parser5.validAction(this.state, reduce)) {
      let depth = reduce >> 19, term = reduce & 65535;
      let target = this.stack.length - depth * 3;
      if (target < 0 || parser5.getGoto(this.stack[target], term, false) < 0) {
        let backup = this.findForcedReduction();
        if (backup == null)
          return false;
        reduce = backup;
      }
      this.storeNode(0, this.pos, this.pos, 4, true);
      this.score -= 100;
    }
    this.reducePos = this.pos;
    this.reduce(reduce);
    return true;
  }
  /**
  Try to scan through the automaton to find some kind of reduction
  that can be applied. Used when the regular ForcedReduce field
  isn't a valid action. @internal
  */
  findForcedReduction() {
    let { parser: parser5 } = this.p, seen = [];
    let explore = (state, depth) => {
      if (seen.includes(state))
        return;
      seen.push(state);
      return parser5.allActions(state, (action) => {
        if (action & (262144 | 131072)) ;
        else if (action & 65536) {
          let rDepth = (action >> 19) - depth;
          if (rDepth > 1) {
            let term = action & 65535, target = this.stack.length - rDepth * 3;
            if (target >= 0 && parser5.getGoto(this.stack[target], term, false) >= 0)
              return rDepth << 19 | 65536 | term;
          }
        } else {
          let found = explore(action, depth + 1);
          if (found != null)
            return found;
        }
      });
    };
    return explore(this.state, 0);
  }
  /**
  @internal
  */
  forceAll() {
    while (!this.p.parser.stateFlag(
      this.state,
      2
      /* StateFlag.Accepting */
    )) {
      if (!this.forceReduce()) {
        this.storeNode(0, this.pos, this.pos, 4, true);
        break;
      }
    }
    return this;
  }
  /**
  Check whether this state has no further actions (assumed to be a direct descendant of the
  top state, since any other states must be able to continue
  somehow). @internal
  */
  get deadEnd() {
    if (this.stack.length != 3)
      return false;
    let { parser: parser5 } = this.p;
    return parser5.data[parser5.stateSlot(
      this.state,
      1
      /* ParseState.Actions */
    )] == 65535 && !parser5.stateSlot(
      this.state,
      4
      /* ParseState.DefaultReduce */
    );
  }
  /**
  Restart the stack (put it back in its start state). Only safe
  when this.stack.length == 3 (state is directly below the top
  state). @internal
  */
  restart() {
    this.storeNode(0, this.pos, this.pos, 4, true);
    this.state = this.stack[0];
    this.stack.length = 0;
  }
  /**
  @internal
  */
  sameState(other) {
    if (this.state != other.state || this.stack.length != other.stack.length)
      return false;
    for (let i = 0; i < this.stack.length; i += 3)
      if (this.stack[i] != other.stack[i])
        return false;
    return true;
  }
  /**
  Get the parser used by this stack.
  */
  get parser() {
    return this.p.parser;
  }
  /**
  Test whether a given dialect (by numeric ID, as exported from
  the terms file) is enabled.
  */
  dialectEnabled(dialectID) {
    return this.p.parser.dialect.flags[dialectID];
  }
  shiftContext(term, start) {
    if (this.curContext)
      this.updateContext(this.curContext.tracker.shift(this.curContext.context, term, this, this.p.stream.reset(start)));
  }
  reduceContext(term, start) {
    if (this.curContext)
      this.updateContext(this.curContext.tracker.reduce(this.curContext.context, term, this, this.p.stream.reset(start)));
  }
  /**
  @internal
  */
  emitContext() {
    let last = this.buffer.length - 1;
    if (last < 0 || this.buffer[last] != -3)
      this.buffer.push(this.curContext.hash, this.pos, this.pos, -3);
  }
  /**
  @internal
  */
  emitLookAhead() {
    let last = this.buffer.length - 1;
    if (last < 0 || this.buffer[last] != -4)
      this.buffer.push(this.lookAhead, this.pos, this.pos, -4);
  }
  updateContext(context) {
    if (context != this.curContext.context) {
      let newCx = new StackContext(this.curContext.tracker, context);
      if (newCx.hash != this.curContext.hash)
        this.emitContext();
      this.curContext = newCx;
    }
  }
  /**
  @internal
  */
  setLookAhead(lookAhead) {
    if (lookAhead > this.lookAhead) {
      this.emitLookAhead();
      this.lookAhead = lookAhead;
    }
  }
  /**
  @internal
  */
  close() {
    if (this.curContext && this.curContext.tracker.strict)
      this.emitContext();
    if (this.lookAhead > 0)
      this.emitLookAhead();
  }
};
var StackContext = class {
  constructor(tracker, context) {
    this.tracker = tracker;
    this.context = context;
    this.hash = tracker.strict ? tracker.hash(context) : 0;
  }
};
var SimulatedStack = class {
  constructor(start) {
    this.start = start;
    this.state = start.state;
    this.stack = start.stack;
    this.base = this.stack.length;
  }
  reduce(action) {
    let term = action & 65535, depth = action >> 19;
    if (depth == 0) {
      if (this.stack == this.start.stack)
        this.stack = this.stack.slice();
      this.stack.push(this.state, 0, 0);
      this.base += 3;
    } else {
      this.base -= (depth - 1) * 3;
    }
    let goto = this.start.p.parser.getGoto(this.stack[this.base - 3], term, true);
    this.state = goto;
  }
};
var StackBufferCursor = class _StackBufferCursor {
  constructor(stack, pos, index) {
    this.stack = stack;
    this.pos = pos;
    this.index = index;
    this.buffer = stack.buffer;
    if (this.index == 0)
      this.maybeNext();
  }
  static create(stack, pos = stack.bufferBase + stack.buffer.length) {
    return new _StackBufferCursor(stack, pos, pos - stack.bufferBase);
  }
  maybeNext() {
    let next = this.stack.parent;
    if (next != null) {
      this.index = this.stack.bufferBase - next.bufferBase;
      this.stack = next;
      this.buffer = next.buffer;
    }
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  next() {
    this.index -= 4;
    this.pos -= 4;
    if (this.index == 0)
      this.maybeNext();
  }
  fork() {
    return new _StackBufferCursor(this.stack, this.pos, this.index);
  }
};
function decodeArray(input, Type = Uint16Array) {
  if (typeof input != "string")
    return input;
  let array = null;
  for (let pos = 0, out = 0; pos < input.length; ) {
    let value = 0;
    for (; ; ) {
      let next = input.charCodeAt(pos++), stop = false;
      if (next == 126) {
        value = 65535;
        break;
      }
      if (next >= 92)
        next--;
      if (next >= 34)
        next--;
      let digit = next - 32;
      if (digit >= 46) {
        digit -= 46;
        stop = true;
      }
      value += digit;
      if (stop)
        break;
      value *= 46;
    }
    if (array)
      array[out++] = value;
    else
      array = new Type(value);
  }
  return array;
}
var CachedToken = class {
  constructor() {
    this.start = -1;
    this.value = -1;
    this.end = -1;
    this.extended = -1;
    this.lookAhead = 0;
    this.mask = 0;
    this.context = 0;
  }
};
var nullToken = new CachedToken();
var InputStream = class {
  /**
  @internal
  */
  constructor(input, ranges) {
    this.input = input;
    this.ranges = ranges;
    this.chunk = "";
    this.chunkOff = 0;
    this.chunk2 = "";
    this.chunk2Pos = 0;
    this.next = -1;
    this.token = nullToken;
    this.rangeIndex = 0;
    this.pos = this.chunkPos = ranges[0].from;
    this.range = ranges[0];
    this.end = ranges[ranges.length - 1].to;
    this.readNext();
  }
  /**
  @internal
  */
  resolveOffset(offset, assoc) {
    let range = this.range, index = this.rangeIndex;
    let pos = this.pos + offset;
    while (pos < range.from) {
      if (!index)
        return null;
      let next = this.ranges[--index];
      pos -= range.from - next.to;
      range = next;
    }
    while (assoc < 0 ? pos > range.to : pos >= range.to) {
      if (index == this.ranges.length - 1)
        return null;
      let next = this.ranges[++index];
      pos += next.from - range.to;
      range = next;
    }
    return pos;
  }
  /**
  @internal
  */
  clipPos(pos) {
    if (pos >= this.range.from && pos < this.range.to)
      return pos;
    for (let range of this.ranges)
      if (range.to > pos)
        return Math.max(pos, range.from);
    return this.end;
  }
  /**
  Look at a code unit near the stream position. `.peek(0)` equals
  `.next`, `.peek(-1)` gives you the previous character, and so
  on.
  
  Note that looking around during tokenizing creates dependencies
  on potentially far-away content, which may reduce the
  effectiveness incremental parsing—when looking forward—or even
  cause invalid reparses when looking backward more than 25 code
  units, since the library does not track lookbehind.
  */
  peek(offset) {
    let idx = this.chunkOff + offset, pos, result;
    if (idx >= 0 && idx < this.chunk.length) {
      pos = this.pos + offset;
      result = this.chunk.charCodeAt(idx);
    } else {
      let resolved = this.resolveOffset(offset, 1);
      if (resolved == null)
        return -1;
      pos = resolved;
      if (pos >= this.chunk2Pos && pos < this.chunk2Pos + this.chunk2.length) {
        result = this.chunk2.charCodeAt(pos - this.chunk2Pos);
      } else {
        let i = this.rangeIndex, range = this.range;
        while (range.to <= pos)
          range = this.ranges[++i];
        this.chunk2 = this.input.chunk(this.chunk2Pos = pos);
        if (pos + this.chunk2.length > range.to)
          this.chunk2 = this.chunk2.slice(0, range.to - pos);
        result = this.chunk2.charCodeAt(0);
      }
    }
    if (pos >= this.token.lookAhead)
      this.token.lookAhead = pos + 1;
    return result;
  }
  /**
  Accept a token. By default, the end of the token is set to the
  current stream position, but you can pass an offset (relative to
  the stream position) to change that.
  */
  acceptToken(token, endOffset = 0) {
    let end = endOffset ? this.resolveOffset(endOffset, -1) : this.pos;
    if (end == null || end < this.token.start)
      throw new RangeError("Token end out of bounds");
    this.token.value = token;
    this.token.end = end;
  }
  /**
  Accept a token ending at a specific given position.
  */
  acceptTokenTo(token, endPos) {
    this.token.value = token;
    this.token.end = endPos;
  }
  getChunk() {
    if (this.pos >= this.chunk2Pos && this.pos < this.chunk2Pos + this.chunk2.length) {
      let { chunk, chunkPos } = this;
      this.chunk = this.chunk2;
      this.chunkPos = this.chunk2Pos;
      this.chunk2 = chunk;
      this.chunk2Pos = chunkPos;
      this.chunkOff = this.pos - this.chunkPos;
    } else {
      this.chunk2 = this.chunk;
      this.chunk2Pos = this.chunkPos;
      let nextChunk = this.input.chunk(this.pos);
      let end = this.pos + nextChunk.length;
      this.chunk = end > this.range.to ? nextChunk.slice(0, this.range.to - this.pos) : nextChunk;
      this.chunkPos = this.pos;
      this.chunkOff = 0;
    }
  }
  readNext() {
    if (this.chunkOff >= this.chunk.length) {
      this.getChunk();
      if (this.chunkOff == this.chunk.length)
        return this.next = -1;
    }
    return this.next = this.chunk.charCodeAt(this.chunkOff);
  }
  /**
  Move the stream forward N (defaults to 1) code units. Returns
  the new value of [`next`](#lr.InputStream.next).
  */
  advance(n = 1) {
    this.chunkOff += n;
    while (this.pos + n >= this.range.to) {
      if (this.rangeIndex == this.ranges.length - 1)
        return this.setDone();
      n -= this.range.to - this.pos;
      this.range = this.ranges[++this.rangeIndex];
      this.pos = this.range.from;
    }
    this.pos += n;
    if (this.pos >= this.token.lookAhead)
      this.token.lookAhead = this.pos + 1;
    return this.readNext();
  }
  setDone() {
    this.pos = this.chunkPos = this.end;
    this.range = this.ranges[this.rangeIndex = this.ranges.length - 1];
    this.chunk = "";
    return this.next = -1;
  }
  /**
  @internal
  */
  reset(pos, token) {
    if (token) {
      this.token = token;
      token.start = pos;
      token.lookAhead = pos + 1;
      token.value = token.extended = -1;
    } else {
      this.token = nullToken;
    }
    if (this.pos != pos) {
      this.pos = pos;
      if (pos == this.end) {
        this.setDone();
        return this;
      }
      while (pos < this.range.from)
        this.range = this.ranges[--this.rangeIndex];
      while (pos >= this.range.to)
        this.range = this.ranges[++this.rangeIndex];
      if (pos >= this.chunkPos && pos < this.chunkPos + this.chunk.length) {
        this.chunkOff = pos - this.chunkPos;
      } else {
        this.chunk = "";
        this.chunkOff = 0;
      }
      this.readNext();
    }
    return this;
  }
  /**
  @internal
  */
  read(from, to) {
    if (from >= this.chunkPos && to <= this.chunkPos + this.chunk.length)
      return this.chunk.slice(from - this.chunkPos, to - this.chunkPos);
    if (from >= this.chunk2Pos && to <= this.chunk2Pos + this.chunk2.length)
      return this.chunk2.slice(from - this.chunk2Pos, to - this.chunk2Pos);
    if (from >= this.range.from && to <= this.range.to)
      return this.input.read(from, to);
    let result = "";
    for (let r of this.ranges) {
      if (r.from >= to)
        break;
      if (r.to > from)
        result += this.input.read(Math.max(r.from, from), Math.min(r.to, to));
    }
    return result;
  }
};
var TokenGroup = class {
  constructor(data2, id2) {
    this.data = data2;
    this.id = id2;
  }
  token(input, stack) {
    let { parser: parser5 } = stack.p;
    readToken(this.data, input, stack, this.id, parser5.data, parser5.tokenPrecTable);
  }
};
TokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;
var LocalTokenGroup = class {
  constructor(data2, precTable, elseToken) {
    this.precTable = precTable;
    this.elseToken = elseToken;
    this.data = typeof data2 == "string" ? decodeArray(data2) : data2;
  }
  token(input, stack) {
    let start = input.pos, skipped = 0;
    for (; ; ) {
      let atEof = input.next < 0, nextPos = input.resolveOffset(1, 1);
      readToken(this.data, input, stack, 0, this.data, this.precTable);
      if (input.token.value > -1)
        break;
      if (this.elseToken == null)
        return;
      if (!atEof)
        skipped++;
      if (nextPos == null)
        break;
      input.reset(nextPos, input.token);
    }
    if (skipped) {
      input.reset(start, input.token);
      input.acceptToken(this.elseToken, skipped);
    }
  }
};
LocalTokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;
var ExternalTokenizer = class {
  /**
  Create a tokenizer. The first argument is the function that,
  given an input stream, scans for the types of tokens it
  recognizes at the stream's position, and calls
  [`acceptToken`](#lr.InputStream.acceptToken) when it finds
  one.
  */
  constructor(token, options = {}) {
    this.token = token;
    this.contextual = !!options.contextual;
    this.fallback = !!options.fallback;
    this.extend = !!options.extend;
  }
};
function readToken(data2, input, stack, group, precTable, precOffset) {
  let state = 0, groupMask = 1 << group, { dialect } = stack.p.parser;
  scan: for (; ; ) {
    if ((groupMask & data2[state]) == 0)
      break;
    let accEnd = data2[state + 1];
    for (let i = state + 3; i < accEnd; i += 2)
      if ((data2[i + 1] & groupMask) > 0) {
        let term = data2[i];
        if (dialect.allows(term) && (input.token.value == -1 || input.token.value == term || overrides(term, input.token.value, precTable, precOffset))) {
          input.acceptToken(term);
          break;
        }
      }
    let next = input.next, low = 0, high = data2[state + 2];
    if (input.next < 0 && high > low && data2[accEnd + high * 3 - 3] == 65535) {
      state = data2[accEnd + high * 3 - 1];
      continue scan;
    }
    for (; low < high; ) {
      let mid = low + high >> 1;
      let index = accEnd + mid + (mid << 1);
      let from = data2[index], to = data2[index + 1] || 65536;
      if (next < from)
        high = mid;
      else if (next >= to)
        low = mid + 1;
      else {
        state = data2[index + 2];
        input.advance();
        continue scan;
      }
    }
    break;
  }
}
function findOffset(data2, start, term) {
  for (let i = start, next; (next = data2[i]) != 65535; i++)
    if (next == term)
      return i - start;
  return -1;
}
function overrides(token, prev, tableData, tableOffset) {
  let iPrev = findOffset(tableData, tableOffset, prev);
  return iPrev < 0 || findOffset(tableData, tableOffset, token) < iPrev;
}
var verbose = typeof process != "undefined" && process.env && /\bparse\b/.test(process.env.LOG);
var stackIDs = null;
function cutAt(tree, pos, side) {
  let cursor = tree.cursor(IterMode.IncludeAnonymous);
  cursor.moveTo(pos);
  for (; ; ) {
    if (!(side < 0 ? cursor.childBefore(pos) : cursor.childAfter(pos)))
      for (; ; ) {
        if ((side < 0 ? cursor.to < pos : cursor.from > pos) && !cursor.type.isError)
          return side < 0 ? Math.max(0, Math.min(
            cursor.to - 1,
            pos - 25
            /* Lookahead.Margin */
          )) : Math.min(tree.length, Math.max(
            cursor.from + 1,
            pos + 25
            /* Lookahead.Margin */
          ));
        if (side < 0 ? cursor.prevSibling() : cursor.nextSibling())
          break;
        if (!cursor.parent())
          return side < 0 ? 0 : tree.length;
      }
  }
}
var FragmentCursor2 = class {
  constructor(fragments, nodeSet) {
    this.fragments = fragments;
    this.nodeSet = nodeSet;
    this.i = 0;
    this.fragment = null;
    this.safeFrom = -1;
    this.safeTo = -1;
    this.trees = [];
    this.start = [];
    this.index = [];
    this.nextFragment();
  }
  nextFragment() {
    let fr = this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++];
    if (fr) {
      this.safeFrom = fr.openStart ? cutAt(fr.tree, fr.from + fr.offset, 1) - fr.offset : fr.from;
      this.safeTo = fr.openEnd ? cutAt(fr.tree, fr.to + fr.offset, -1) - fr.offset : fr.to;
      while (this.trees.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
      }
      this.trees.push(fr.tree);
      this.start.push(-fr.offset);
      this.index.push(0);
      this.nextStart = this.safeFrom;
    } else {
      this.nextStart = 1e9;
    }
  }
  // `pos` must be >= any previously given `pos` for this cursor
  nodeAt(pos) {
    if (pos < this.nextStart)
      return null;
    while (this.fragment && this.safeTo <= pos)
      this.nextFragment();
    if (!this.fragment)
      return null;
    for (; ; ) {
      let last = this.trees.length - 1;
      if (last < 0) {
        this.nextFragment();
        return null;
      }
      let top = this.trees[last], index = this.index[last];
      if (index == top.children.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
        continue;
      }
      let next = top.children[index];
      let start = this.start[last] + top.positions[index];
      if (start > pos) {
        this.nextStart = start;
        return null;
      }
      if (next instanceof Tree) {
        if (start == pos) {
          if (start < this.safeFrom)
            return null;
          let end = start + next.length;
          if (end <= this.safeTo) {
            let lookAhead = next.prop(NodeProp.lookAhead);
            if (!lookAhead || end + lookAhead < this.fragment.to)
              return next;
          }
        }
        this.index[last]++;
        if (start + next.length >= Math.max(this.safeFrom, pos)) {
          this.trees.push(next);
          this.start.push(start);
          this.index.push(0);
        }
      } else {
        this.index[last]++;
        this.nextStart = start + next.length;
      }
    }
  }
};
var TokenCache = class {
  constructor(parser5, stream) {
    this.stream = stream;
    this.tokens = [];
    this.mainToken = null;
    this.actions = [];
    this.tokens = parser5.tokenizers.map((_) => new CachedToken());
  }
  getActions(stack) {
    let actionIndex = 0;
    let main = null;
    let { parser: parser5 } = stack.p, { tokenizers } = parser5;
    let mask = parser5.stateSlot(
      stack.state,
      3
      /* ParseState.TokenizerMask */
    );
    let context = stack.curContext ? stack.curContext.hash : 0;
    let lookAhead = 0;
    for (let i = 0; i < tokenizers.length; i++) {
      if ((1 << i & mask) == 0)
        continue;
      let tokenizer = tokenizers[i], token = this.tokens[i];
      if (main && !tokenizer.fallback)
        continue;
      if (tokenizer.contextual || token.start != stack.pos || token.mask != mask || token.context != context) {
        this.updateCachedToken(token, tokenizer, stack);
        token.mask = mask;
        token.context = context;
      }
      if (token.lookAhead > token.end + 25)
        lookAhead = Math.max(token.lookAhead, lookAhead);
      if (token.value != 0) {
        let startIndex = actionIndex;
        if (token.extended > -1)
          actionIndex = this.addActions(stack, token.extended, token.end, actionIndex);
        actionIndex = this.addActions(stack, token.value, token.end, actionIndex);
        if (!tokenizer.extend) {
          main = token;
          if (actionIndex > startIndex)
            break;
        }
      }
    }
    while (this.actions.length > actionIndex)
      this.actions.pop();
    if (lookAhead)
      stack.setLookAhead(lookAhead);
    if (!main && stack.pos == this.stream.end) {
      main = new CachedToken();
      main.value = stack.p.parser.eofTerm;
      main.start = main.end = stack.pos;
      actionIndex = this.addActions(stack, main.value, main.end, actionIndex);
    }
    this.mainToken = main;
    return this.actions;
  }
  getMainToken(stack) {
    if (this.mainToken)
      return this.mainToken;
    let main = new CachedToken(), { pos, p } = stack;
    main.start = pos;
    main.end = Math.min(pos + 1, p.stream.end);
    main.value = pos == p.stream.end ? p.parser.eofTerm : 0;
    return main;
  }
  updateCachedToken(token, tokenizer, stack) {
    let start = this.stream.clipPos(stack.pos);
    tokenizer.token(this.stream.reset(start, token), stack);
    if (token.value > -1) {
      let { parser: parser5 } = stack.p;
      for (let i = 0; i < parser5.specialized.length; i++)
        if (parser5.specialized[i] == token.value) {
          let result = parser5.specializers[i](this.stream.read(token.start, token.end), stack);
          if (result >= 0 && stack.p.parser.dialect.allows(result >> 1)) {
            if ((result & 1) == 0)
              token.value = result >> 1;
            else
              token.extended = result >> 1;
            break;
          }
        }
    } else {
      token.value = 0;
      token.end = this.stream.clipPos(start + 1);
    }
  }
  putAction(action, token, end, index) {
    for (let i = 0; i < index; i += 3)
      if (this.actions[i] == action)
        return index;
    this.actions[index++] = action;
    this.actions[index++] = token;
    this.actions[index++] = end;
    return index;
  }
  addActions(stack, token, end, index) {
    let { state } = stack, { parser: parser5 } = stack.p, { data: data2 } = parser5;
    for (let set = 0; set < 2; set++) {
      for (let i = parser5.stateSlot(
        state,
        set ? 2 : 1
        /* ParseState.Actions */
      ); ; i += 3) {
        if (data2[i] == 65535) {
          if (data2[i + 1] == 1) {
            i = pair(data2, i + 2);
          } else {
            if (index == 0 && data2[i + 1] == 2)
              index = this.putAction(pair(data2, i + 2), token, end, index);
            break;
          }
        }
        if (data2[i] == token)
          index = this.putAction(pair(data2, i + 1), token, end, index);
      }
    }
    return index;
  }
};
var Parse = class {
  constructor(parser5, input, fragments, ranges) {
    this.parser = parser5;
    this.input = input;
    this.ranges = ranges;
    this.recovering = 0;
    this.nextStackID = 9812;
    this.minStackPos = 0;
    this.reused = [];
    this.stoppedAt = null;
    this.lastBigReductionStart = -1;
    this.lastBigReductionSize = 0;
    this.bigReductionCount = 0;
    this.stream = new InputStream(input, ranges);
    this.tokens = new TokenCache(parser5, this.stream);
    this.topTerm = parser5.top[1];
    let { from } = ranges[0];
    this.stacks = [Stack.start(this, parser5.top[0], from)];
    this.fragments = fragments.length && this.stream.end - from > parser5.bufferLength * 4 ? new FragmentCursor2(fragments, parser5.nodeSet) : null;
  }
  get parsedPos() {
    return this.minStackPos;
  }
  // Move the parser forward. This will process all parse stacks at
  // `this.pos` and try to advance them to a further position. If no
  // stack for such a position is found, it'll start error-recovery.
  //
  // When the parse is finished, this will return a syntax tree. When
  // not, it returns `null`.
  advance() {
    let stacks = this.stacks, pos = this.minStackPos;
    let newStacks = this.stacks = [];
    let stopped, stoppedTokens;
    if (this.bigReductionCount > 300 && stacks.length == 1) {
      let [s] = stacks;
      while (s.forceReduce() && s.stack.length && s.stack[s.stack.length - 2] >= this.lastBigReductionStart) {
      }
      this.bigReductionCount = this.lastBigReductionSize = 0;
    }
    for (let i = 0; i < stacks.length; i++) {
      let stack = stacks[i];
      for (; ; ) {
        this.tokens.mainToken = null;
        if (stack.pos > pos) {
          newStacks.push(stack);
        } else if (this.advanceStack(stack, newStacks, stacks)) {
          continue;
        } else {
          if (!stopped) {
            stopped = [];
            stoppedTokens = [];
          }
          stopped.push(stack);
          let tok = this.tokens.getMainToken(stack);
          stoppedTokens.push(tok.value, tok.end);
        }
        break;
      }
    }
    if (!newStacks.length) {
      let finished = stopped && findFinished(stopped);
      if (finished) {
        if (verbose)
          console.log("Finish with " + this.stackID(finished));
        return this.stackToTree(finished);
      }
      if (this.parser.strict) {
        if (verbose && stopped)
          console.log("Stuck with token " + (this.tokens.mainToken ? this.parser.getName(this.tokens.mainToken.value) : "none"));
        throw new SyntaxError("No parse at " + pos);
      }
      if (!this.recovering)
        this.recovering = 5;
    }
    if (this.recovering && stopped) {
      let finished = this.stoppedAt != null && stopped[0].pos > this.stoppedAt ? stopped[0] : this.runRecovery(stopped, stoppedTokens, newStacks);
      if (finished) {
        if (verbose)
          console.log("Force-finish " + this.stackID(finished));
        return this.stackToTree(finished.forceAll());
      }
    }
    if (this.recovering) {
      let maxRemaining = this.recovering == 1 ? 1 : this.recovering * 3;
      if (newStacks.length > maxRemaining) {
        newStacks.sort((a, b) => b.score - a.score);
        while (newStacks.length > maxRemaining)
          newStacks.pop();
      }
      if (newStacks.some((s) => s.reducePos > pos))
        this.recovering--;
    } else if (newStacks.length > 1) {
      outer: for (let i = 0; i < newStacks.length - 1; i++) {
        let stack = newStacks[i];
        for (let j = i + 1; j < newStacks.length; j++) {
          let other = newStacks[j];
          if (stack.sameState(other) || stack.buffer.length > 500 && other.buffer.length > 500) {
            if ((stack.score - other.score || stack.buffer.length - other.buffer.length) > 0) {
              newStacks.splice(j--, 1);
            } else {
              newStacks.splice(i--, 1);
              continue outer;
            }
          }
        }
      }
      if (newStacks.length > 12)
        newStacks.splice(
          12,
          newStacks.length - 12
          /* Rec.MaxStackCount */
        );
    }
    this.minStackPos = newStacks[0].pos;
    for (let i = 1; i < newStacks.length; i++)
      if (newStacks[i].pos < this.minStackPos)
        this.minStackPos = newStacks[i].pos;
    return null;
  }
  stopAt(pos) {
    if (this.stoppedAt != null && this.stoppedAt < pos)
      throw new RangeError("Can't move stoppedAt forward");
    this.stoppedAt = pos;
  }
  // Returns an updated version of the given stack, or null if the
  // stack can't advance normally. When `split` and `stacks` are
  // given, stacks split off by ambiguous operations will be pushed to
  // `split`, or added to `stacks` if they move `pos` forward.
  advanceStack(stack, stacks, split) {
    let start = stack.pos, { parser: parser5 } = this;
    let base = verbose ? this.stackID(stack) + " -> " : "";
    if (this.stoppedAt != null && start > this.stoppedAt)
      return stack.forceReduce() ? stack : null;
    if (this.fragments) {
      let strictCx = stack.curContext && stack.curContext.tracker.strict, cxHash = strictCx ? stack.curContext.hash : 0;
      for (let cached = this.fragments.nodeAt(start); cached; ) {
        let match = this.parser.nodeSet.types[cached.type.id] == cached.type ? parser5.getGoto(stack.state, cached.type.id) : -1;
        if (match > -1 && cached.length && (!strictCx || (cached.prop(NodeProp.contextHash) || 0) == cxHash)) {
          stack.useNode(cached, match);
          if (verbose)
            console.log(base + this.stackID(stack) + ` (via reuse of ${parser5.getName(cached.type.id)})`);
          return true;
        }
        if (!(cached instanceof Tree) || cached.children.length == 0 || cached.positions[0] > 0)
          break;
        let inner = cached.children[0];
        if (inner instanceof Tree && cached.positions[0] == 0)
          cached = inner;
        else
          break;
      }
    }
    let defaultReduce = parser5.stateSlot(
      stack.state,
      4
      /* ParseState.DefaultReduce */
    );
    if (defaultReduce > 0) {
      stack.reduce(defaultReduce);
      if (verbose)
        console.log(base + this.stackID(stack) + ` (via always-reduce ${parser5.getName(
          defaultReduce & 65535
          /* Action.ValueMask */
        )})`);
      return true;
    }
    if (stack.stack.length >= 8400) {
      while (stack.stack.length > 6e3 && stack.forceReduce()) {
      }
    }
    let actions = this.tokens.getActions(stack);
    for (let i = 0; i < actions.length; ) {
      let action = actions[i++], term = actions[i++], end = actions[i++];
      let last = i == actions.length || !split;
      let localStack = last ? stack : stack.split();
      let main = this.tokens.mainToken;
      localStack.apply(action, term, main ? main.start : localStack.pos, end);
      if (verbose)
        console.log(base + this.stackID(localStack) + ` (via ${(action & 65536) == 0 ? "shift" : `reduce of ${parser5.getName(
          action & 65535
          /* Action.ValueMask */
        )}`} for ${parser5.getName(term)} @ ${start}${localStack == stack ? "" : ", split"})`);
      if (last)
        return true;
      else if (localStack.pos > start)
        stacks.push(localStack);
      else
        split.push(localStack);
    }
    return false;
  }
  // Advance a given stack forward as far as it will go. Returns the
  // (possibly updated) stack if it got stuck, or null if it moved
  // forward and was given to `pushStackDedup`.
  advanceFully(stack, newStacks) {
    let pos = stack.pos;
    for (; ; ) {
      if (!this.advanceStack(stack, null, null))
        return false;
      if (stack.pos > pos) {
        pushStackDedup(stack, newStacks);
        return true;
      }
    }
  }
  runRecovery(stacks, tokens, newStacks) {
    let finished = null, restarted = false;
    for (let i = 0; i < stacks.length; i++) {
      let stack = stacks[i], token = tokens[i << 1], tokenEnd = tokens[(i << 1) + 1];
      let base = verbose ? this.stackID(stack) + " -> " : "";
      if (stack.deadEnd) {
        if (restarted)
          continue;
        restarted = true;
        stack.restart();
        if (verbose)
          console.log(base + this.stackID(stack) + " (restarted)");
        let done = this.advanceFully(stack, newStacks);
        if (done)
          continue;
      }
      let force = stack.split(), forceBase = base;
      for (let j = 0; force.forceReduce() && j < 10; j++) {
        if (verbose)
          console.log(forceBase + this.stackID(force) + " (via force-reduce)");
        let done = this.advanceFully(force, newStacks);
        if (done)
          break;
        if (verbose)
          forceBase = this.stackID(force) + " -> ";
      }
      for (let insert of stack.recoverByInsert(token)) {
        if (verbose)
          console.log(base + this.stackID(insert) + " (via recover-insert)");
        this.advanceFully(insert, newStacks);
      }
      if (this.stream.end > stack.pos) {
        if (tokenEnd == stack.pos) {
          tokenEnd++;
          token = 0;
        }
        stack.recoverByDelete(token, tokenEnd);
        if (verbose)
          console.log(base + this.stackID(stack) + ` (via recover-delete ${this.parser.getName(token)})`);
        pushStackDedup(stack, newStacks);
      } else if (!finished || finished.score < stack.score) {
        finished = stack;
      }
    }
    return finished;
  }
  // Convert the stack's buffer to a syntax tree.
  stackToTree(stack) {
    stack.close();
    return Tree.build({
      buffer: StackBufferCursor.create(stack),
      nodeSet: this.parser.nodeSet,
      topID: this.topTerm,
      maxBufferLength: this.parser.bufferLength,
      reused: this.reused,
      start: this.ranges[0].from,
      length: stack.pos - this.ranges[0].from,
      minRepeatType: this.parser.minRepeatTerm
    });
  }
  stackID(stack) {
    let id2 = (stackIDs || (stackIDs = /* @__PURE__ */ new WeakMap())).get(stack);
    if (!id2)
      stackIDs.set(stack, id2 = String.fromCodePoint(this.nextStackID++));
    return id2 + stack;
  }
};
function pushStackDedup(stack, newStacks) {
  for (let i = 0; i < newStacks.length; i++) {
    let other = newStacks[i];
    if (other.pos == stack.pos && other.sameState(stack)) {
      if (newStacks[i].score < stack.score)
        newStacks[i] = stack;
      return;
    }
  }
  newStacks.push(stack);
}
var Dialect = class {
  constructor(source, flags, disabled) {
    this.source = source;
    this.flags = flags;
    this.disabled = disabled;
  }
  allows(term) {
    return !this.disabled || this.disabled[term] == 0;
  }
};
var id = (x) => x;
var ContextTracker = class {
  /**
  Define a context tracker.
  */
  constructor(spec) {
    this.start = spec.start;
    this.shift = spec.shift || id;
    this.reduce = spec.reduce || id;
    this.reuse = spec.reuse || id;
    this.hash = spec.hash || (() => 0);
    this.strict = spec.strict !== false;
  }
};
var LRParser = class _LRParser extends Parser {
  /**
  @internal
  */
  constructor(spec) {
    super();
    this.wrappers = [];
    if (spec.version != 14)
      throw new RangeError(`Parser version (${spec.version}) doesn't match runtime version (${14})`);
    let nodeNames = spec.nodeNames.split(" ");
    this.minRepeatTerm = nodeNames.length;
    for (let i = 0; i < spec.repeatNodeCount; i++)
      nodeNames.push("");
    let topTerms = Object.keys(spec.topRules).map((r) => spec.topRules[r][1]);
    let nodeProps = [];
    for (let i = 0; i < nodeNames.length; i++)
      nodeProps.push([]);
    function setProp(nodeID, prop, value) {
      nodeProps[nodeID].push([prop, prop.deserialize(String(value))]);
    }
    if (spec.nodeProps)
      for (let propSpec of spec.nodeProps) {
        let prop = propSpec[0];
        if (typeof prop == "string")
          prop = NodeProp[prop];
        for (let i = 1; i < propSpec.length; ) {
          let next = propSpec[i++];
          if (next >= 0) {
            setProp(next, prop, propSpec[i++]);
          } else {
            let value = propSpec[i + -next];
            for (let j = -next; j > 0; j--)
              setProp(propSpec[i++], prop, value);
            i++;
          }
        }
      }
    this.nodeSet = new NodeSet(nodeNames.map((name, i) => NodeType.define({
      name: i >= this.minRepeatTerm ? void 0 : name,
      id: i,
      props: nodeProps[i],
      top: topTerms.indexOf(i) > -1,
      error: i == 0,
      skipped: spec.skippedNodes && spec.skippedNodes.indexOf(i) > -1
    })));
    if (spec.propSources)
      this.nodeSet = this.nodeSet.extend(...spec.propSources);
    this.strict = false;
    this.bufferLength = DefaultBufferLength;
    let tokenArray = decodeArray(spec.tokenData);
    this.context = spec.context;
    this.specializerSpecs = spec.specialized || [];
    this.specialized = new Uint16Array(this.specializerSpecs.length);
    for (let i = 0; i < this.specializerSpecs.length; i++)
      this.specialized[i] = this.specializerSpecs[i].term;
    this.specializers = this.specializerSpecs.map(getSpecializer);
    this.states = decodeArray(spec.states, Uint32Array);
    this.data = decodeArray(spec.stateData);
    this.goto = decodeArray(spec.goto);
    this.maxTerm = spec.maxTerm;
    this.tokenizers = spec.tokenizers.map((value) => typeof value == "number" ? new TokenGroup(tokenArray, value) : value);
    this.topRules = spec.topRules;
    this.dialects = spec.dialects || {};
    this.dynamicPrecedences = spec.dynamicPrecedences || null;
    this.tokenPrecTable = spec.tokenPrec;
    this.termNames = spec.termNames || null;
    this.maxNode = this.nodeSet.types.length - 1;
    this.dialect = this.parseDialect();
    this.top = this.topRules[Object.keys(this.topRules)[0]];
  }
  createParse(input, fragments, ranges) {
    let parse = new Parse(this, input, fragments, ranges);
    for (let w of this.wrappers)
      parse = w(parse, input, fragments, ranges);
    return parse;
  }
  /**
  Get a goto table entry @internal
  */
  getGoto(state, term, loose = false) {
    let table = this.goto;
    if (term >= table[0])
      return -1;
    for (let pos = table[term + 1]; ; ) {
      let groupTag = table[pos++], last = groupTag & 1;
      let target = table[pos++];
      if (last && loose)
        return target;
      for (let end = pos + (groupTag >> 1); pos < end; pos++)
        if (table[pos] == state)
          return target;
      if (last)
        return -1;
    }
  }
  /**
  Check if this state has an action for a given terminal @internal
  */
  hasAction(state, terminal) {
    let data2 = this.data;
    for (let set = 0; set < 2; set++) {
      for (let i = this.stateSlot(
        state,
        set ? 2 : 1
        /* ParseState.Actions */
      ), next; ; i += 3) {
        if ((next = data2[i]) == 65535) {
          if (data2[i + 1] == 1)
            next = data2[i = pair(data2, i + 2)];
          else if (data2[i + 1] == 2)
            return pair(data2, i + 2);
          else
            break;
        }
        if (next == terminal || next == 0)
          return pair(data2, i + 1);
      }
    }
    return 0;
  }
  /**
  @internal
  */
  stateSlot(state, slot) {
    return this.states[state * 6 + slot];
  }
  /**
  @internal
  */
  stateFlag(state, flag) {
    return (this.stateSlot(
      state,
      0
      /* ParseState.Flags */
    ) & flag) > 0;
  }
  /**
  @internal
  */
  validAction(state, action) {
    return !!this.allActions(state, (a) => a == action ? true : null);
  }
  /**
  @internal
  */
  allActions(state, action) {
    let deflt = this.stateSlot(
      state,
      4
      /* ParseState.DefaultReduce */
    );
    let result = deflt ? action(deflt) : void 0;
    for (let i = this.stateSlot(
      state,
      1
      /* ParseState.Actions */
    ); result == null; i += 3) {
      if (this.data[i] == 65535) {
        if (this.data[i + 1] == 1)
          i = pair(this.data, i + 2);
        else
          break;
      }
      result = action(pair(this.data, i + 1));
    }
    return result;
  }
  /**
  Get the states that can follow this one through shift actions or
  goto jumps. @internal
  */
  nextStates(state) {
    let result = [];
    for (let i = this.stateSlot(
      state,
      1
      /* ParseState.Actions */
    ); ; i += 3) {
      if (this.data[i] == 65535) {
        if (this.data[i + 1] == 1)
          i = pair(this.data, i + 2);
        else
          break;
      }
      if ((this.data[i + 2] & 65536 >> 16) == 0) {
        let value = this.data[i + 1];
        if (!result.some((v, i2) => i2 & 1 && v == value))
          result.push(this.data[i], value);
      }
    }
    return result;
  }
  /**
  Configure the parser. Returns a new parser instance that has the
  given settings modified. Settings not provided in `config` are
  kept from the original parser.
  */
  configure(config) {
    let copy = Object.assign(Object.create(_LRParser.prototype), this);
    if (config.props)
      copy.nodeSet = this.nodeSet.extend(...config.props);
    if (config.top) {
      let info = this.topRules[config.top];
      if (!info)
        throw new RangeError(`Invalid top rule name ${config.top}`);
      copy.top = info;
    }
    if (config.tokenizers)
      copy.tokenizers = this.tokenizers.map((t) => {
        let found = config.tokenizers.find((r) => r.from == t);
        return found ? found.to : t;
      });
    if (config.specializers) {
      copy.specializers = this.specializers.slice();
      copy.specializerSpecs = this.specializerSpecs.map((s, i) => {
        let found = config.specializers.find((r) => r.from == s.external);
        if (!found)
          return s;
        let spec = Object.assign(Object.assign({}, s), { external: found.to });
        copy.specializers[i] = getSpecializer(spec);
        return spec;
      });
    }
    if (config.contextTracker)
      copy.context = config.contextTracker;
    if (config.dialect)
      copy.dialect = this.parseDialect(config.dialect);
    if (config.strict != null)
      copy.strict = config.strict;
    if (config.wrap)
      copy.wrappers = copy.wrappers.concat(config.wrap);
    if (config.bufferLength != null)
      copy.bufferLength = config.bufferLength;
    return copy;
  }
  /**
  Tells you whether any [parse wrappers](#lr.ParserConfig.wrap)
  are registered for this parser.
  */
  hasWrappers() {
    return this.wrappers.length > 0;
  }
  /**
  Returns the name associated with a given term. This will only
  work for all terms when the parser was generated with the
  `--names` option. By default, only the names of tagged terms are
  stored.
  */
  getName(term) {
    return this.termNames ? this.termNames[term] : String(term <= this.maxNode && this.nodeSet.types[term].name || term);
  }
  /**
  The eof term id is always allocated directly after the node
  types. @internal
  */
  get eofTerm() {
    return this.maxNode + 1;
  }
  /**
  The type of top node produced by the parser.
  */
  get topNode() {
    return this.nodeSet.types[this.top[1]];
  }
  /**
  @internal
  */
  dynamicPrecedence(term) {
    let prec = this.dynamicPrecedences;
    return prec == null ? 0 : prec[term] || 0;
  }
  /**
  @internal
  */
  parseDialect(dialect) {
    let values2 = Object.keys(this.dialects), flags = values2.map(() => false);
    if (dialect)
      for (let part of dialect.split(" ")) {
        let id2 = values2.indexOf(part);
        if (id2 >= 0)
          flags[id2] = true;
      }
    let disabled = null;
    for (let i = 0; i < values2.length; i++)
      if (!flags[i]) {
        for (let j = this.dialects[values2[i]], id2; (id2 = this.data[j++]) != 65535; )
          (disabled || (disabled = new Uint8Array(this.maxTerm + 1)))[id2] = 1;
      }
    return new Dialect(dialect, flags, disabled);
  }
  /**
  Used by the output of the parser generator. Not available to
  user code. @hide
  */
  static deserialize(spec) {
    return new _LRParser(spec);
  }
};
function pair(data2, off) {
  return data2[off] | data2[off + 1] << 16;
}
function findFinished(stacks) {
  let best = null;
  for (let stack of stacks) {
    let stopped = stack.p.stoppedAt;
    if ((stack.pos == stack.p.stream.end || stopped != null && stack.pos > stopped) && stack.p.parser.stateFlag(
      stack.state,
      2
      /* StateFlag.Accepting */
    ) && (!best || best.score < stack.score))
      best = stack;
  }
  return best;
}
function getSpecializer(spec) {
  if (spec.external) {
    let mask = spec.extend ? 1 : 0;
    return (value, stack) => spec.external(value, stack) << 1 | mask;
  }
  return spec.get;
}
var scriptText = 54;
var StartCloseScriptTag = 1;
var styleText = 55;
var StartCloseStyleTag = 2;
var textareaText = 56;
var StartCloseTextareaTag = 3;
var EndTag = 4;
var SelfClosingEndTag = 5;
var StartTag = 6;
var StartScriptTag = 7;
var StartStyleTag = 8;
var StartTextareaTag = 9;
var StartSelfClosingTag = 10;
var StartCloseTag = 11;
var NoMatchStartCloseTag = 12;
var MismatchedStartCloseTag = 13;
var missingCloseTag = 57;
var IncompleteCloseTag = 14;
var commentContent$1 = 58;
var Element = 20;
var TagName = 22;
var Attribute = 23;
var AttributeName = 24;
var AttributeValue = 26;
var UnquotedAttributeValue = 27;
var ScriptText = 28;
var StyleText = 31;
var TextareaText = 34;
var OpenTag = 36;
var CloseTag = 37;
var Dialect_noMatch = 0;
var Dialect_selfClosing = 1;
var selfClosers = {
  area: true,
  base: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
  menuitem: true
};
var implicitlyClosed = {
  dd: true,
  li: true,
  optgroup: true,
  option: true,
  p: true,
  rp: true,
  rt: true,
  tbody: true,
  td: true,
  tfoot: true,
  th: true,
  tr: true
};
var closeOnOpen = {
  dd: { dd: true, dt: true },
  dt: { dd: true, dt: true },
  li: { li: true },
  option: { option: true, optgroup: true },
  optgroup: { optgroup: true },
  p: {
    address: true,
    article: true,
    aside: true,
    blockquote: true,
    dir: true,
    div: true,
    dl: true,
    fieldset: true,
    footer: true,
    form: true,
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
    header: true,
    hgroup: true,
    hr: true,
    menu: true,
    nav: true,
    ol: true,
    p: true,
    pre: true,
    section: true,
    table: true,
    ul: true
  },
  rp: { rp: true, rt: true },
  rt: { rp: true, rt: true },
  tbody: { tbody: true, tfoot: true },
  td: { td: true, th: true },
  tfoot: { tbody: true },
  th: { td: true, th: true },
  thead: { tbody: true, tfoot: true },
  tr: { tr: true }
};
function nameChar(ch) {
  return ch == 45 || ch == 46 || ch == 58 || ch >= 65 && ch <= 90 || ch == 95 || ch >= 97 && ch <= 122 || ch >= 161;
}
function isSpace(ch) {
  return ch == 9 || ch == 10 || ch == 13 || ch == 32;
}
var cachedName = null;
var cachedInput = null;
var cachedPos = 0;
function tagNameAfter(input, offset) {
  let pos = input.pos + offset;
  if (cachedPos == pos && cachedInput == input) return cachedName;
  let next = input.peek(offset);
  while (isSpace(next)) next = input.peek(++offset);
  let name = "";
  for (; ; ) {
    if (!nameChar(next)) break;
    name += String.fromCharCode(next);
    next = input.peek(++offset);
  }
  cachedInput = input;
  cachedPos = pos;
  return cachedName = name ? name.toLowerCase() : next == question || next == bang ? void 0 : null;
}
var lessThan = 60;
var greaterThan = 62;
var slash = 47;
var question = 63;
var bang = 33;
var dash = 45;
function ElementContext(name, parent) {
  this.name = name;
  this.parent = parent;
}
var startTagTerms = [StartTag, StartSelfClosingTag, StartScriptTag, StartStyleTag, StartTextareaTag];
var elementContext = new ContextTracker({
  start: null,
  shift(context, term, stack, input) {
    return startTagTerms.indexOf(term) > -1 ? new ElementContext(tagNameAfter(input, 1) || "", context) : context;
  },
  reduce(context, term) {
    return term == Element && context ? context.parent : context;
  },
  reuse(context, node, stack, input) {
    let type = node.type.id;
    return type == StartTag || type == OpenTag ? new ElementContext(tagNameAfter(input, 1) || "", context) : context;
  },
  strict: false
});
var tagStart = new ExternalTokenizer((input, stack) => {
  if (input.next != lessThan) {
    if (input.next < 0 && stack.context) input.acceptToken(missingCloseTag);
    return;
  }
  input.advance();
  let close = input.next == slash;
  if (close) input.advance();
  let name = tagNameAfter(input, 0);
  if (name === void 0) return;
  if (!name) return input.acceptToken(close ? IncompleteCloseTag : StartTag);
  let parent = stack.context ? stack.context.name : null;
  if (close) {
    if (name == parent) return input.acceptToken(StartCloseTag);
    if (parent && implicitlyClosed[parent]) return input.acceptToken(missingCloseTag, -2);
    if (stack.dialectEnabled(Dialect_noMatch)) return input.acceptToken(NoMatchStartCloseTag);
    for (let cx = stack.context; cx; cx = cx.parent) if (cx.name == name) return;
    input.acceptToken(MismatchedStartCloseTag);
  } else {
    if (name == "script") return input.acceptToken(StartScriptTag);
    if (name == "style") return input.acceptToken(StartStyleTag);
    if (name == "textarea") return input.acceptToken(StartTextareaTag);
    if (selfClosers.hasOwnProperty(name)) return input.acceptToken(StartSelfClosingTag);
    if (parent && closeOnOpen[parent] && closeOnOpen[parent][name]) input.acceptToken(missingCloseTag, -1);
    else input.acceptToken(StartTag);
  }
}, { contextual: true });
var commentContent = new ExternalTokenizer((input) => {
  for (let dashes = 0, i = 0; ; i++) {
    if (input.next < 0) {
      if (i) input.acceptToken(commentContent$1);
      break;
    }
    if (input.next == dash) {
      dashes++;
    } else if (input.next == greaterThan && dashes >= 2) {
      if (i >= 3) input.acceptToken(commentContent$1, -2);
      break;
    } else {
      dashes = 0;
    }
    input.advance();
  }
});
function inForeignElement(context) {
  for (; context; context = context.parent)
    if (context.name == "svg" || context.name == "math") return true;
  return false;
}
var endTag = new ExternalTokenizer((input, stack) => {
  if (input.next == slash && input.peek(1) == greaterThan) {
    let selfClosing = stack.dialectEnabled(Dialect_selfClosing) || inForeignElement(stack.context);
    input.acceptToken(selfClosing ? SelfClosingEndTag : EndTag, 2);
  } else if (input.next == greaterThan) {
    input.acceptToken(EndTag, 1);
  }
});
function contentTokenizer(tag, textToken, endToken) {
  let lastState = 2 + tag.length;
  return new ExternalTokenizer((input) => {
    for (let state = 0, matchedLen = 0, i = 0; ; i++) {
      if (input.next < 0) {
        if (i) input.acceptToken(textToken);
        break;
      }
      if (state == 0 && input.next == lessThan || state == 1 && input.next == slash || state >= 2 && state < lastState && input.next == tag.charCodeAt(state - 2)) {
        state++;
        matchedLen++;
      } else if ((state == 2 || state == lastState) && isSpace(input.next)) {
        matchedLen++;
      } else if (state == lastState && input.next == greaterThan) {
        if (i > matchedLen)
          input.acceptToken(textToken, -matchedLen);
        else
          input.acceptToken(endToken, -(matchedLen - 2));
        break;
      } else if ((input.next == 10 || input.next == 13) && i) {
        input.acceptToken(textToken, 1);
        break;
      } else {
        state = matchedLen = 0;
      }
      input.advance();
    }
  });
}
var scriptTokens = contentTokenizer("script", scriptText, StartCloseScriptTag);
var styleTokens = contentTokenizer("style", styleText, StartCloseStyleTag);
var textareaTokens = contentTokenizer("textarea", textareaText, StartCloseTextareaTag);
var htmlHighlighting = styleTags({
  "Text RawText": tags.content,
  "StartTag StartCloseTag SelfClosingEndTag EndTag": tags.angleBracket,
  TagName: tags.tagName,
  "MismatchedCloseTag/TagName": [tags.tagName, tags.invalid],
  AttributeName: tags.attributeName,
  "AttributeValue UnquotedAttributeValue": tags.attributeValue,
  Is: tags.definitionOperator,
  "EntityReference CharacterReference": tags.character,
  Comment: tags.blockComment,
  ProcessingInst: tags.processingInstruction,
  DoctypeDecl: tags.documentMeta
});
var parser = LRParser.deserialize({
  version: 14,
  states: ",xOVO!rOOO!WQ#tO'#CqO!]Q#tO'#CzO!bQ#tO'#C}O!gQ#tO'#DQO!lQ#tO'#DSO!qOaO'#CpO!|ObO'#CpO#XOdO'#CpO$eO!rO'#CpOOO`'#Cp'#CpO$lO$fO'#DTO$tQ#tO'#DVO$yQ#tO'#DWOOO`'#Dk'#DkOOO`'#DY'#DYQVO!rOOO%OQ&rO,59]O%ZQ&rO,59fO%fQ&rO,59iO%qQ&rO,59lO%|Q&rO,59nOOOa'#D^'#D^O&XOaO'#CxO&dOaO,59[OOOb'#D_'#D_O&lObO'#C{O&wObO,59[OOOd'#D`'#D`O'POdO'#DOO'[OdO,59[OOO`'#Da'#DaO'dO!rO,59[O'kQ#tO'#DROOO`,59[,59[OOOp'#Db'#DbO'pO$fO,59oOOO`,59o,59oO'xQ#|O,59qO'}Q#|O,59rOOO`-E7W-E7WO(SQ&rO'#CsOOQW'#DZ'#DZO(bQ&rO1G.wOOOa1G.w1G.wOOO`1G/Y1G/YO(mQ&rO1G/QOOOb1G/Q1G/QO(xQ&rO1G/TOOOd1G/T1G/TO)TQ&rO1G/WOOO`1G/W1G/WO)`Q&rO1G/YOOOa-E7[-E7[O)kQ#tO'#CyOOO`1G.v1G.vOOOb-E7]-E7]O)pQ#tO'#C|OOOd-E7^-E7^O)uQ#tO'#DPOOO`-E7_-E7_O)zQ#|O,59mOOOp-E7`-E7`OOO`1G/Z1G/ZOOO`1G/]1G/]OOO`1G/^1G/^O*PQ,UO,59_OOQW-E7X-E7XOOOa7+$c7+$cOOO`7+$t7+$tOOOb7+$l7+$lOOOd7+$o7+$oOOO`7+$r7+$rO*[Q#|O,59eO*aQ#|O,59hO*fQ#|O,59kOOO`1G/X1G/XO*kO7[O'#CvO*|OMhO'#CvOOQW1G.y1G.yOOO`1G/P1G/POOO`1G/S1G/SOOO`1G/V1G/VOOOO'#D['#D[O+_O7[O,59bOOQW,59b,59bOOOO'#D]'#D]O+pOMhO,59bOOOO-E7Y-E7YOOQW1G.|1G.|OOOO-E7Z-E7Z",
  stateData: ",]~O!^OS~OUSOVPOWQOXROYTO[]O][O^^O`^Oa^Ob^Oc^Ox^O{_O!dZO~OfaO~OfbO~OfcO~OfdO~OfeO~O!WfOPlP!ZlP~O!XiOQoP!ZoP~O!YlORrP!ZrP~OUSOVPOWQOXROYTOZqO[]O][O^^O`^Oa^Ob^Oc^Ox^O!dZO~O!ZrO~P#dO![sO!euO~OfvO~OfwO~OS|OT}OhyO~OS!POT}OhyO~OS!ROT}OhyO~OS!TOT}OhyO~OS}OT}OhyO~O!WfOPlX!ZlX~OP!WO!Z!XO~O!XiOQoX!ZoX~OQ!ZO!Z!XO~O!YlORrX!ZrX~OR!]O!Z!XO~O!Z!XO~P#dOf!_O~O![sO!e!aO~OS!bO~OS!cO~Oi!dOSgXTgXhgX~OS!fOT!gOhyO~OS!hOT!gOhyO~OS!iOT!gOhyO~OS!jOT!gOhyO~OS!gOT!gOhyO~Of!kO~Of!lO~Of!mO~OS!nO~Ok!qO!`!oO!b!pO~OS!rO~OS!sO~OS!tO~Oa!uOb!uOc!uO!`!wO!a!uO~Oa!xOb!xOc!xO!b!wO!c!xO~Oa!uOb!uOc!uO!`!{O!a!uO~Oa!xOb!xOc!xO!b!{O!c!xO~OT~bac!dx{!d~",
  goto: "%p!`PPPPPPPPPPPPPPPPPPPP!a!gP!mPP!yP!|#P#S#Y#]#`#f#i#l#r#x!aP!a!aP$O$U$l$r$x%O%U%[%bPPPPPPPP%hX^OX`pXUOX`pezabcde{!O!Q!S!UR!q!dRhUR!XhXVOX`pRkVR!XkXWOX`pRnWR!XnXXOX`pQrXR!XpXYOX`pQ`ORx`Q{aQ!ObQ!QcQ!SdQ!UeZ!e{!O!Q!S!UQ!v!oR!z!vQ!y!pR!|!yQgUR!VgQjVR!YjQmWR![mQpXR!^pQtZR!`tS_O`ToXp",
  nodeNames: "\u26A0 StartCloseTag StartCloseTag StartCloseTag EndTag SelfClosingEndTag StartTag StartTag StartTag StartTag StartTag StartCloseTag StartCloseTag StartCloseTag IncompleteCloseTag Document Text EntityReference CharacterReference InvalidEntity Element OpenTag TagName Attribute AttributeName Is AttributeValue UnquotedAttributeValue ScriptText CloseTag OpenTag StyleText CloseTag OpenTag TextareaText CloseTag OpenTag CloseTag SelfClosingTag Comment ProcessingInst MismatchedCloseTag CloseTag DoctypeDecl",
  maxTerm: 67,
  context: elementContext,
  nodeProps: [
    ["closedBy", -10, 1, 2, 3, 7, 8, 9, 10, 11, 12, 13, "EndTag", 6, "EndTag SelfClosingEndTag", -4, 21, 30, 33, 36, "CloseTag"],
    ["openedBy", 4, "StartTag StartCloseTag", 5, "StartTag", -4, 29, 32, 35, 37, "OpenTag"],
    ["group", -9, 14, 17, 18, 19, 20, 39, 40, 41, 42, "Entity", 16, "Entity TextContent", -3, 28, 31, 34, "TextContent Entity"],
    ["isolate", -11, 21, 29, 30, 32, 33, 35, 36, 37, 38, 41, 42, "ltr", -3, 26, 27, 39, ""]
  ],
  propSources: [htmlHighlighting],
  skippedNodes: [0],
  repeatNodeCount: 9,
  tokenData: "!<p!aR!YOX$qXY,QYZ,QZ[$q[]&X]^,Q^p$qpq,Qqr-_rs3_sv-_vw3}wxHYx}-_}!OH{!O!P-_!P!Q$q!Q![-_![!]Mz!]!^-_!^!_!$S!_!`!;x!`!a&X!a!c-_!c!}Mz!}#R-_#R#SMz#S#T1k#T#oMz#o#s-_#s$f$q$f%W-_%W%oMz%o%p-_%p&aMz&a&b-_&b1pMz1p4U-_4U4dMz4d4e-_4e$ISMz$IS$I`-_$I`$IbMz$Ib$Kh-_$Kh%#tMz%#t&/x-_&/x&EtMz&Et&FV-_&FV;'SMz;'S;:j!#|;:j;=`3X<%l?&r-_?&r?AhMz?Ah?BY$q?BY?MnMz?MnO$q!Z$|c`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr$qrs&}sv$qvw+Pwx(tx!^$q!^!_*V!_!a&X!a#S$q#S#T&X#T;'S$q;'S;=`+z<%lO$q!R&bX`P!a`!cpOr&Xrs&}sv&Xwx(tx!^&X!^!_*V!_;'S&X;'S;=`*y<%lO&Xq'UV`P!cpOv&}wx'kx!^&}!^!_(V!_;'S&};'S;=`(n<%lO&}P'pT`POv'kw!^'k!_;'S'k;'S;=`(P<%lO'kP(SP;=`<%l'kp([S!cpOv(Vx;'S(V;'S;=`(h<%lO(Vp(kP;=`<%l(Vq(qP;=`<%l&}a({W`P!a`Or(trs'ksv(tw!^(t!^!_)e!_;'S(t;'S;=`*P<%lO(t`)jT!a`Or)esv)ew;'S)e;'S;=`)y<%lO)e`)|P;=`<%l)ea*SP;=`<%l(t!Q*^V!a`!cpOr*Vrs(Vsv*Vwx)ex;'S*V;'S;=`*s<%lO*V!Q*vP;=`<%l*V!R*|P;=`<%l&XW+UYkWOX+PZ[+P^p+Pqr+Psw+Px!^+P!a#S+P#T;'S+P;'S;=`+t<%lO+PW+wP;=`<%l+P!Z+}P;=`<%l$q!a,]``P!a`!cp!^^OX&XXY,QYZ,QZ]&X]^,Q^p&Xpq,Qqr&Xrs&}sv&Xwx(tx!^&X!^!_*V!_;'S&X;'S;=`*y<%lO&X!_-ljhS`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr-_rs&}sv-_vw/^wx(tx!P-_!P!Q$q!Q!^-_!^!_*V!_!a&X!a#S-_#S#T1k#T#s-_#s$f$q$f;'S-_;'S;=`3X<%l?Ah-_?Ah?BY$q?BY?Mn-_?MnO$q[/ebhSkWOX+PZ[+P^p+Pqr/^sw/^x!P/^!P!Q+P!Q!^/^!a#S/^#S#T0m#T#s/^#s$f+P$f;'S/^;'S;=`1e<%l?Ah/^?Ah?BY+P?BY?Mn/^?MnO+PS0rXhSqr0msw0mx!P0m!Q!^0m!a#s0m$f;'S0m;'S;=`1_<%l?Ah0m?BY?Mn0mS1bP;=`<%l0m[1hP;=`<%l/^!V1vchS`P!a`!cpOq&Xqr1krs&}sv1kvw0mwx(tx!P1k!P!Q&X!Q!^1k!^!_*V!_!a&X!a#s1k#s$f&X$f;'S1k;'S;=`3R<%l?Ah1k?Ah?BY&X?BY?Mn1k?MnO&X!V3UP;=`<%l1k!_3[P;=`<%l-_!Z3hV!`h`P!cpOv&}wx'kx!^&}!^!_(V!_;'S&};'S;=`(n<%lO&}!_4WihSkWc!ROX5uXZ7SZ[5u[^7S^p5uqr8trs7Sst>]tw8twx7Sx!P8t!P!Q5u!Q!]8t!]!^/^!^!a7S!a#S8t#S#T;{#T#s8t#s$f5u$f;'S8t;'S;=`>V<%l?Ah8t?Ah?BY5u?BY?Mn8t?MnO5u!Z5zbkWOX5uXZ7SZ[5u[^7S^p5uqr5urs7Sst+Ptw5uwx7Sx!]5u!]!^7w!^!a7S!a#S5u#S#T7S#T;'S5u;'S;=`8n<%lO5u!R7VVOp7Sqs7St!]7S!]!^7l!^;'S7S;'S;=`7q<%lO7S!R7qOa!R!R7tP;=`<%l7S!Z8OYkWa!ROX+PZ[+P^p+Pqr+Psw+Px!^+P!a#S+P#T;'S+P;'S;=`+t<%lO+P!Z8qP;=`<%l5u!_8{ihSkWOX5uXZ7SZ[5u[^7S^p5uqr8trs7Sst/^tw8twx7Sx!P8t!P!Q5u!Q!]8t!]!^:j!^!a7S!a#S8t#S#T;{#T#s8t#s$f5u$f;'S8t;'S;=`>V<%l?Ah8t?Ah?BY5u?BY?Mn8t?MnO5u!_:sbhSkWa!ROX+PZ[+P^p+Pqr/^sw/^x!P/^!P!Q+P!Q!^/^!a#S/^#S#T0m#T#s/^#s$f+P$f;'S/^;'S;=`1e<%l?Ah/^?Ah?BY+P?BY?Mn/^?MnO+P!V<QchSOp7Sqr;{rs7Sst0mtw;{wx7Sx!P;{!P!Q7S!Q!];{!]!^=]!^!a7S!a#s;{#s$f7S$f;'S;{;'S;=`>P<%l?Ah;{?Ah?BY7S?BY?Mn;{?MnO7S!V=dXhSa!Rqr0msw0mx!P0m!Q!^0m!a#s0m$f;'S0m;'S;=`1_<%l?Ah0m?BY?Mn0m!V>SP;=`<%l;{!_>YP;=`<%l8t!_>dhhSkWOX@OXZAYZ[@O[^AY^p@OqrBwrsAYswBwwxAYx!PBw!P!Q@O!Q!]Bw!]!^/^!^!aAY!a#SBw#S#TE{#T#sBw#s$f@O$f;'SBw;'S;=`HS<%l?AhBw?Ah?BY@O?BY?MnBw?MnO@O!Z@TakWOX@OXZAYZ[@O[^AY^p@Oqr@OrsAYsw@OwxAYx!]@O!]!^Az!^!aAY!a#S@O#S#TAY#T;'S@O;'S;=`Bq<%lO@O!RA]UOpAYq!]AY!]!^Ao!^;'SAY;'S;=`At<%lOAY!RAtOb!R!RAwP;=`<%lAY!ZBRYkWb!ROX+PZ[+P^p+Pqr+Psw+Px!^+P!a#S+P#T;'S+P;'S;=`+t<%lO+P!ZBtP;=`<%l@O!_COhhSkWOX@OXZAYZ[@O[^AY^p@OqrBwrsAYswBwwxAYx!PBw!P!Q@O!Q!]Bw!]!^Dj!^!aAY!a#SBw#S#TE{#T#sBw#s$f@O$f;'SBw;'S;=`HS<%l?AhBw?Ah?BY@O?BY?MnBw?MnO@O!_DsbhSkWb!ROX+PZ[+P^p+Pqr/^sw/^x!P/^!P!Q+P!Q!^/^!a#S/^#S#T0m#T#s/^#s$f+P$f;'S/^;'S;=`1e<%l?Ah/^?Ah?BY+P?BY?Mn/^?MnO+P!VFQbhSOpAYqrE{rsAYswE{wxAYx!PE{!P!QAY!Q!]E{!]!^GY!^!aAY!a#sE{#s$fAY$f;'SE{;'S;=`G|<%l?AhE{?Ah?BYAY?BY?MnE{?MnOAY!VGaXhSb!Rqr0msw0mx!P0m!Q!^0m!a#s0m$f;'S0m;'S;=`1_<%l?Ah0m?BY?Mn0m!VHPP;=`<%lE{!_HVP;=`<%lBw!ZHcW!bx`P!a`Or(trs'ksv(tw!^(t!^!_)e!_;'S(t;'S;=`*P<%lO(t!aIYlhS`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr-_rs&}sv-_vw/^wx(tx}-_}!OKQ!O!P-_!P!Q$q!Q!^-_!^!_*V!_!a&X!a#S-_#S#T1k#T#s-_#s$f$q$f;'S-_;'S;=`3X<%l?Ah-_?Ah?BY$q?BY?Mn-_?MnO$q!aK_khS`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr-_rs&}sv-_vw/^wx(tx!P-_!P!Q$q!Q!^-_!^!_*V!_!`&X!`!aMS!a#S-_#S#T1k#T#s-_#s$f$q$f;'S-_;'S;=`3X<%l?Ah-_?Ah?BY$q?BY?Mn-_?MnO$q!TM_X`P!a`!cp!eQOr&Xrs&}sv&Xwx(tx!^&X!^!_*V!_;'S&X;'S;=`*y<%lO&X!aNZ!ZhSfQ`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr-_rs&}sv-_vw/^wx(tx}-_}!OMz!O!PMz!P!Q$q!Q![Mz![!]Mz!]!^-_!^!_*V!_!a&X!a!c-_!c!}Mz!}#R-_#R#SMz#S#T1k#T#oMz#o#s-_#s$f$q$f$}-_$}%OMz%O%W-_%W%oMz%o%p-_%p&aMz&a&b-_&b1pMz1p4UMz4U4dMz4d4e-_4e$ISMz$IS$I`-_$I`$IbMz$Ib$Je-_$Je$JgMz$Jg$Kh-_$Kh%#tMz%#t&/x-_&/x&EtMz&Et&FV-_&FV;'SMz;'S;:j!#|;:j;=`3X<%l?&r-_?&r?AhMz?Ah?BY$q?BY?MnMz?MnO$q!a!$PP;=`<%lMz!R!$ZY!a`!cpOq*Vqr!$yrs(Vsv*Vwx)ex!a*V!a!b!4t!b;'S*V;'S;=`*s<%lO*V!R!%Q]!a`!cpOr*Vrs(Vsv*Vwx)ex}*V}!O!%y!O!f*V!f!g!']!g#W*V#W#X!0`#X;'S*V;'S;=`*s<%lO*V!R!&QX!a`!cpOr*Vrs(Vsv*Vwx)ex}*V}!O!&m!O;'S*V;'S;=`*s<%lO*V!R!&vV!a`!cp!dPOr*Vrs(Vsv*Vwx)ex;'S*V;'S;=`*s<%lO*V!R!'dX!a`!cpOr*Vrs(Vsv*Vwx)ex!q*V!q!r!(P!r;'S*V;'S;=`*s<%lO*V!R!(WX!a`!cpOr*Vrs(Vsv*Vwx)ex!e*V!e!f!(s!f;'S*V;'S;=`*s<%lO*V!R!(zX!a`!cpOr*Vrs(Vsv*Vwx)ex!v*V!v!w!)g!w;'S*V;'S;=`*s<%lO*V!R!)nX!a`!cpOr*Vrs(Vsv*Vwx)ex!{*V!{!|!*Z!|;'S*V;'S;=`*s<%lO*V!R!*bX!a`!cpOr*Vrs(Vsv*Vwx)ex!r*V!r!s!*}!s;'S*V;'S;=`*s<%lO*V!R!+UX!a`!cpOr*Vrs(Vsv*Vwx)ex!g*V!g!h!+q!h;'S*V;'S;=`*s<%lO*V!R!+xY!a`!cpOr!+qrs!,hsv!+qvw!-Swx!.[x!`!+q!`!a!/j!a;'S!+q;'S;=`!0Y<%lO!+qq!,mV!cpOv!,hvx!-Sx!`!,h!`!a!-q!a;'S!,h;'S;=`!.U<%lO!,hP!-VTO!`!-S!`!a!-f!a;'S!-S;'S;=`!-k<%lO!-SP!-kO{PP!-nP;=`<%l!-Sq!-xS!cp{POv(Vx;'S(V;'S;=`(h<%lO(Vq!.XP;=`<%l!,ha!.aX!a`Or!.[rs!-Ssv!.[vw!-Sw!`!.[!`!a!.|!a;'S!.[;'S;=`!/d<%lO!.[a!/TT!a`{POr)esv)ew;'S)e;'S;=`)y<%lO)ea!/gP;=`<%l!.[!R!/sV!a`!cp{POr*Vrs(Vsv*Vwx)ex;'S*V;'S;=`*s<%lO*V!R!0]P;=`<%l!+q!R!0gX!a`!cpOr*Vrs(Vsv*Vwx)ex#c*V#c#d!1S#d;'S*V;'S;=`*s<%lO*V!R!1ZX!a`!cpOr*Vrs(Vsv*Vwx)ex#V*V#V#W!1v#W;'S*V;'S;=`*s<%lO*V!R!1}X!a`!cpOr*Vrs(Vsv*Vwx)ex#h*V#h#i!2j#i;'S*V;'S;=`*s<%lO*V!R!2qX!a`!cpOr*Vrs(Vsv*Vwx)ex#m*V#m#n!3^#n;'S*V;'S;=`*s<%lO*V!R!3eX!a`!cpOr*Vrs(Vsv*Vwx)ex#d*V#d#e!4Q#e;'S*V;'S;=`*s<%lO*V!R!4XX!a`!cpOr*Vrs(Vsv*Vwx)ex#X*V#X#Y!+q#Y;'S*V;'S;=`*s<%lO*V!R!4{Y!a`!cpOr!4trs!5ksv!4tvw!6Vwx!8]x!a!4t!a!b!:]!b;'S!4t;'S;=`!;r<%lO!4tq!5pV!cpOv!5kvx!6Vx!a!5k!a!b!7W!b;'S!5k;'S;=`!8V<%lO!5kP!6YTO!a!6V!a!b!6i!b;'S!6V;'S;=`!7Q<%lO!6VP!6lTO!`!6V!`!a!6{!a;'S!6V;'S;=`!7Q<%lO!6VP!7QOxPP!7TP;=`<%l!6Vq!7]V!cpOv!5kvx!6Vx!`!5k!`!a!7r!a;'S!5k;'S;=`!8V<%lO!5kq!7yS!cpxPOv(Vx;'S(V;'S;=`(h<%lO(Vq!8YP;=`<%l!5ka!8bX!a`Or!8]rs!6Vsv!8]vw!6Vw!a!8]!a!b!8}!b;'S!8];'S;=`!:V<%lO!8]a!9SX!a`Or!8]rs!6Vsv!8]vw!6Vw!`!8]!`!a!9o!a;'S!8];'S;=`!:V<%lO!8]a!9vT!a`xPOr)esv)ew;'S)e;'S;=`)y<%lO)ea!:YP;=`<%l!8]!R!:dY!a`!cpOr!4trs!5ksv!4tvw!6Vwx!8]x!`!4t!`!a!;S!a;'S!4t;'S;=`!;r<%lO!4t!R!;]V!a`!cpxPOr*Vrs(Vsv*Vwx)ex;'S*V;'S;=`*s<%lO*V!R!;uP;=`<%l!4t!V!<TXiS`P!a`!cpOr&Xrs&}sv&Xwx(tx!^&X!^!_*V!_;'S&X;'S;=`*y<%lO&X",
  tokenizers: [scriptTokens, styleTokens, textareaTokens, endTag, tagStart, commentContent, 0, 1, 2, 3, 4, 5],
  topRules: { "Document": [0, 15] },
  dialects: { noMatch: 0, selfClosing: 509 },
  tokenPrec: 511
});
function getAttrs(openTag, input) {
  let attrs = /* @__PURE__ */ Object.create(null);
  for (let att of openTag.getChildren(Attribute)) {
    let name = att.getChild(AttributeName), value = att.getChild(AttributeValue) || att.getChild(UnquotedAttributeValue);
    if (name) attrs[input.read(name.from, name.to)] = !value ? "" : value.type.id == AttributeValue ? input.read(value.from + 1, value.to - 1) : input.read(value.from, value.to);
  }
  return attrs;
}
function findTagName(openTag, input) {
  let tagNameNode = openTag.getChild(TagName);
  return tagNameNode ? input.read(tagNameNode.from, tagNameNode.to) : " ";
}
function maybeNest(node, input, tags7) {
  let attrs;
  for (let tag of tags7) {
    if (!tag.attrs || tag.attrs(attrs || (attrs = getAttrs(node.node.parent.firstChild, input))))
      return { parser: tag.parser };
  }
  return null;
}
function configureNesting(tags7 = [], attributes = []) {
  let script = [], style = [], textarea = [], other = [];
  for (let tag of tags7) {
    let array = tag.tag == "script" ? script : tag.tag == "style" ? style : tag.tag == "textarea" ? textarea : other;
    array.push(tag);
  }
  let attrs = attributes.length ? /* @__PURE__ */ Object.create(null) : null;
  for (let attr of attributes) (attrs[attr.name] || (attrs[attr.name] = [])).push(attr);
  return parseMixed((node, input) => {
    let id2 = node.type.id;
    if (id2 == ScriptText) return maybeNest(node, input, script);
    if (id2 == StyleText) return maybeNest(node, input, style);
    if (id2 == TextareaText) return maybeNest(node, input, textarea);
    if (id2 == Element && other.length) {
      let n = node.node, open = n.firstChild, tagName = open && findTagName(open, input), attrs2;
      if (tagName) for (let tag of other) {
        if (tag.tag == tagName && (!tag.attrs || tag.attrs(attrs2 || (attrs2 = getAttrs(open, input))))) {
          let close = n.lastChild;
          let to = close.type.id == CloseTag ? close.from : n.to;
          if (to > open.to)
            return { parser: tag.parser, overlay: [{ from: open.to, to }] };
        }
      }
    }
    if (attrs && id2 == Attribute) {
      let n = node.node, nameNode;
      if (nameNode = n.firstChild) {
        let matches = attrs[input.read(nameNode.from, nameNode.to)];
        if (matches) for (let attr of matches) {
          if (attr.tagName && attr.tagName != findTagName(n.parent, input)) continue;
          let value = n.lastChild;
          if (value.type.id == AttributeValue) {
            let from = value.from + 1;
            let last = value.lastChild, to = value.to - (last && last.isError ? 0 : 1);
            if (to > from) return { parser: attr.parser, overlay: [{ from, to }] };
          } else if (value.type.id == UnquotedAttributeValue) {
            return { parser: attr.parser, overlay: [{ from: value.from, to: value.to }] };
          }
        }
      }
    }
    return null;
  });
}
var descendantOp = 107;
var Unit = 1;
var callee = 108;
var identifier = 109;
var VariableName = 2;
var queryIdentifier = 110;
var space = [
  9,
  10,
  11,
  12,
  13,
  32,
  133,
  160,
  5760,
  8192,
  8193,
  8194,
  8195,
  8196,
  8197,
  8198,
  8199,
  8200,
  8201,
  8202,
  8232,
  8233,
  8239,
  8287,
  12288
];
var colon = 58;
var parenL = 40;
var underscore = 95;
var bracketL = 91;
var dash2 = 45;
var period = 46;
var hash = 35;
var percent = 37;
var ampersand = 38;
var backslash = 92;
var newline = 10;
var asterisk = 42;
function isAlpha(ch) {
  return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch >= 161;
}
function isDigit(ch) {
  return ch >= 48 && ch <= 57;
}
var identifiers = new ExternalTokenizer((input, stack) => {
  for (let inside = false, dashes = 0, i = 0; ; i++) {
    let { next } = input;
    if (isAlpha(next) || next == dash2 || next == underscore || inside && isDigit(next)) {
      if (!inside && (next != dash2 || i > 0)) inside = true;
      if (dashes === i && next == dash2) dashes++;
      input.advance();
    } else if (next == backslash && input.peek(1) != newline) {
      input.advance();
      if (input.next > -1) input.advance();
      inside = true;
    } else {
      if (inside) input.acceptToken(
        dashes == 2 && stack.canShift(VariableName) ? VariableName : stack.canShift(queryIdentifier) ? queryIdentifier : next == parenL ? callee : identifier
      );
      break;
    }
  }
});
var descendant = new ExternalTokenizer((input) => {
  if (space.includes(input.peek(-1))) {
    let { next } = input;
    if (isAlpha(next) || next == underscore || next == hash || next == period || next == asterisk || next == bracketL || next == colon && isAlpha(input.peek(1)) || next == dash2 || next == ampersand)
      input.acceptToken(descendantOp);
  }
});
var unitToken = new ExternalTokenizer((input) => {
  if (!space.includes(input.peek(-1))) {
    let { next } = input;
    if (next == percent) {
      input.advance();
      input.acceptToken(Unit);
    }
    if (isAlpha(next)) {
      do {
        input.advance();
      } while (isAlpha(input.next) || isDigit(input.next));
      input.acceptToken(Unit);
    }
  }
});
var cssHighlighting = styleTags({
  "AtKeyword import charset namespace keyframes media supports": tags.definitionKeyword,
  "from to selector": tags.keyword,
  NamespaceName: tags.namespace,
  KeyframeName: tags.labelName,
  KeyframeRangeName: tags.operatorKeyword,
  TagName: tags.tagName,
  ClassName: tags.className,
  PseudoClassName: tags.constant(tags.className),
  IdName: tags.labelName,
  "FeatureName PropertyName": tags.propertyName,
  AttributeName: tags.attributeName,
  NumberLiteral: tags.number,
  KeywordQuery: tags.keyword,
  UnaryQueryOp: tags.operatorKeyword,
  "CallTag ValueName": tags.atom,
  VariableName: tags.variableName,
  Callee: tags.operatorKeyword,
  Unit: tags.unit,
  "UniversalSelector NestingSelector": tags.definitionOperator,
  "MatchOp CompareOp": tags.compareOperator,
  "ChildOp SiblingOp, LogicOp": tags.logicOperator,
  BinOp: tags.arithmeticOperator,
  Important: tags.modifier,
  Comment: tags.blockComment,
  ColorLiteral: tags.color,
  "ParenthesizedContent StringLiteral": tags.string,
  ":": tags.punctuation,
  "PseudoOp #": tags.derefOperator,
  "; ,": tags.separator,
  "( )": tags.paren,
  "[ ]": tags.squareBracket,
  "{ }": tags.brace
});
var spec_callee = { __proto__: null, lang: 34, "nth-child": 34, "nth-last-child": 34, "nth-of-type": 34, "nth-last-of-type": 34, dir: 34, "host-context": 34, url: 62, "url-prefix": 62, domain: 62, regexp: 62 };
var spec_AtKeyword = { __proto__: null, "@import": 120, "@media": 154, "@charset": 158, "@namespace": 162, "@keyframes": 168, "@supports": 180 };
var spec_queryIdentifier = { __proto__: null, layer: 124, not: 144, only: 144, selector: 150 };
var parser2 = LRParser.deserialize({
  version: 14,
  states: ">`QYQ[OOO#kQ[OOP#rOWOOOOQP'#Cd'#CdOOQP'#Cc'#CcO#wQ[O'#CfO$hQXO'#CaO$rQ[O'#CiO$}Q[O'#DUO%SQ[O'#DXO%XQ[O'#D[O%XQ[O'#D_OOQP'#Ev'#EvO%yQdO'#DhO&hQ[O'#DzO%yQdO'#D|O&yQ[O'#EOO'UQ[O'#ERO'^Q[O'#EXO'lQ[O'#EZOOQS'#Eu'#EuOOQS'#E^'#E^QYQ[OOO'sQXO'#CdO(hQWO'#DdO(mQWO'#E{O(xQ[O'#E{QOQWOOP)SO#tO'#C_POOO)C@e)C@eOOQP'#Ch'#ChOOQP,59Q,59QO#wQ[O,59QO)_Q[O,59TO$}Q[O,59pO%SQ[O,59sO%XQ[O,59vO%XQ[O,59xO%XQ[O,59yO%XQ[O'#EcO)jQWO,58{O)rQ[O'#DcOOQS,58{,58{OOQP'#Cl'#ClOOQO'#DS'#DSOOQP,59T,59TO)yQWO,59TO*OQWO,59TOOQP'#DW'#DWOOQP,59p,59pOOQO'#DY'#DYO*TQ`O,59sO*nQXO,59vO+UQXO,59yOOQS'#Cq'#CqO%yQdO'#CrO+lQvO'#CtO-hQtO,5:SOOQO'#Cy'#CyO*OQWO'#CxO-rQWO'#CzO-wQ[O'#DPOOQS'#Ex'#ExOOQO'#Dn'#DnO.eQdO'#DwO.uQWO'#E|O'^Q[O'#DuO/TQWO'#DxOOQO'#E}'#E}O)mQWO,5:fO/YQpO,5:hOOQS'#EQ'#EQO/bQWO,5:jO/gQ[O,5:jOOQO'#ET'#ETO/oQWO,5:mO/tQWO,5:sO/|QWO,5:uOOQS-E8[-E8[O0UQdO,5:OO0fQ[O'#EeO0sQWO,5;gO0sQWO,5;gPOOO'#E]'#E]P1OO#tO,58yPOOO,58y,58yOOQP1G.l1G.lOOQP1G.o1G.oO)yQWO1G.oO*OQWO1G.oOOQP1G/[1G/[O1ZQ`O1G/_O1cQXO1G/bO1yQXO1G/dO2aQXO1G/eO2wQXO,5:}OOQO-E8a-E8aOOQS1G.g1G.gO3RQWO,59}O3WQ[O'#DTO3_QdO'#CpOOQP1G/_1G/_O%yQdO1G/_O3fQpO,59^OOQS,59`,59`O%yQdO,59bO3nQ[O'#DkO4PQWO1G/nO-VQ[O1G/nOOQS,59d,59dO4UQ!bO,59fOOQS'#DQ'#DQOOQS'#E`'#E`O4aQ[O,59kOOQS,59k,59kO4iQpO'#DnO4wQpO,5:ZO5PQWO,5:cOOQO'#FO'#FOO4zQpO,5:_O'^Q[O,5:]O5XQ[O'#EgO5pQWO,5;hO5{QWO,5:aO%XQ[O,5:dOOQS1G0Q1G0QOOQS1G0S1G0SOOQS1G0U1G0UO6^QWO1G0UO6cQdO'#EUOOQS1G0X1G0XOOQS1G0_1G0_OOQS1G0a1G0aO6nQtO1G/jOOQO1G/j1G/jOOQO,5;P,5;PO7UQ[O,5;POOQO-E8c-E8cO7cQWO1G1RPOOO-E8Z-E8ZPOOO1G.e1G.eOOQP7+$Z7+$ZOOQP7+$y7+$yO%yQdO7+$yOOQS1G/i1G/iO7nQXO'#EzO7xQWO,59oO7}QtO'#E_O8uQdO'#EwO9PQWO,59[O9UQpO7+$yOOQS1G.x1G.xOOQS1G.|1G.|O9^Q[O,5:VOOQS7+%Y7+%YO9cQWO7+%YOOQS1G/Q1G/QO9hQWO1G/QOOQS-E8^-E8^OOQS1G/V1G/VO%yQdO1G/uO9mQdO1G/yOOQO1G/}1G/}OOQO1G/w1G/wO9tQWO,5;ROOQO-E8e-E8eO:SQXO1G0OOOQS7+%p7+%pO:ZQYO'#CtOOQO'#EW'#EWO:iQ`O'#EVOOQO'#EV'#EVO:tQWO'#EhO:|QdO,5:pOOQS,5:p,5:pO;XQtO'#EdO%yQdO'#EdO<YQdO7+%UOOQO7+%U7+%UOOQO1G0k1G0kO<mQpO<<HeO<uQ[O'#EbO=PQWO,5;fOOQP1G/Z1G/ZOOQS-E8]-E8]O=XQdO'#EaO=cQWO,5;cOOQT1G.v1G.vOOQP<<He<<HeOOQO'#Dm'#DmO=kQWO1G/qOOQS<<Ht<<HtOOQS7+$l7+$lO=sQdO7+%aOOQO'#Dp'#DpO=zQpO7+%eOOQO7+%j7+%jOOQO,5:q,5:qO6fQdO'#EiO:tQWO,5;SOOQS,5;S,5;SOOQS-E8f-E8fOOQS1G0[1G0[O>SQtO,5;OOOQS-E8b-E8bOOQO<<Hp<<HpOOQPAN>PAN>PO?TQXO,5:|OOQO-E8`-E8`O?_QdO,5:{OOQO-E8_-E8_O9^Q[O'#EfO?iQWO7+%]OOQS7+%]7+%]OOQO<<H{<<H{OOQO<<IP<<IPO?qQdO<<IPOOQO,5;T,5;TOOQO-E8g-E8gOOQS1G0n1G0nOOQO,5;Q,5;QOOQO-E8d-E8dOOQS<<Hw<<HwO@YQWOAN>kOOQOG24VG24V",
  stateData: "@g~O#dOS#eQQ~OU[OX[OZTO^VO_VOrXOyWO!PYO!SZO!]cO!^]O!o^O!q_O!s`O!vaO!|bO#aRO~OQhOU[OX[OZTO^VO_VOrXOyWO!PYO!SZO!]cO!^]O!o^O!q_O!s`O!vaO!|bO#agO~O#^#oP~P!aO#elO~O#anO~OZpO^qO_qOrsOyrO!PtO!SvO#_uO~OuwO!UyO~P#|Oa!PO#`|O#a{O~O#a!QO~O#a!SO~OU[OX[OZTO^VO_VOrXOyWO!PYO!SZO#aRO~OQ!`Oc!XOg!`Oi!`Oo!^Or!_O#`![O#a!WO#m!YO~Oc!bO!j!dO!m!eO#b!aO!U#pP~Oi!jOo!^O#a!iO~Oi!lO#a!lO~Oc!bO!j!dO!m!eO#b!aO~O!Z#pP~P&hOZWX^WX^!XX_WXrWXuWXyWX!PWX!SWX!UWX#_WX~O^!qO~O!Z!rO#^#oX!T#oX~O#^#oX!T#oX~P!aO#f!uO#g!uO#h!wO~Oa!{O#`|O#a{O~OuwO!UyO~O!T#oP~P!aOc#VO~Oc#WO~Oq#XO}#YO~OZpO^qO_qOrsOyrO~Ou!Oa!P!Oa!S!Oa!U!Oa#_!Oab!Oa~P*]Ou!Ra!P!Ra!S!Ra!U!Ra#_!Rab!Ra~P*]OP#[OchXkhX!ZhX!`hX!jhX!mhX#bhXbhX!hhXQhXghXihXohXrhXuhX!YhX#^hX#`hX#ahX#mhXqhX!ThX~Oc!bO!j!dO!m!eO#b!aO!Z#pP~Ok#]O!`#^O~P-VOc#bO~Oq#fO#a#cO~OQ#jOg#jOi#jOo!^O#`![O#m!YO~Oc!bO!j!dO!m!eO#b#gO~P.POu#mO!f#lO!U#pX!Z#pX~Oc#pO~Ok#]O!Z#rO~O!Z#sO~Oi#tOo!^O~O!U#uO~O!UyO!f#lO~O!UyO!Z#xO~O!Y#zO!Z!Wa#^!Wa!T!Wa~P%yO!Z#XX#^#XX!T#XX~P!aO!Z!rO#^#oa!T#oa~O#f!uO#g!uO#h$QO~Oq$SO}$TO~Ou!Oi!P!Oi!S!Oi!U!Oi#_!Oib!Oi~P*]Ou!Qi!P!Qi!S!Qi!U!Qi#_!Qib!Qi~P*]Ou!Ri!P!Ri!S!Ri!U!Ri#_!Rib!Ri~P*]Ou#Va!U#Va~P#|O!T$UO~Ob#nP~P%XOb#kP~P%yOb$]Ok#]O~Oc$_O!Z!_X!j!_X!m!_X#b!_X~O!Z$`O~Ob$bOi$cOp$cO~Oq$eO#a#cO~O^!dXb!bX!f!bX!h!dX~O^$fO!h$gO~Ob$hO!f#lO~Oc!bO!j!dO!m!eO#b!aOu#ZX!U#ZX!Z#ZX~Ou#mO!U#pa!Z#pa~O!f#lOu!ia!U!ia!Z!iab!ia~O!Z$mO~O!T$tO#a$oO#m$nO~Ok#]Ou$vO!Y$xO!Z!Wi#^!Wi!T!Wi~P%yO!Z#Xa#^#Xa!T#Xa~P!aO!Z!rO#^#oi!T#oi~Ou${Ob#nX~P#|Ob$}O~Ok#]OQ#RXb#RXc#RXg#RXi#RXo#RXr#RXu#RX#`#RX#a#RX#m#RX~Ou%POb#kX~P%yOb%RO~Ok#]Oq%SO~O#a%TO~O!Z%VO~Ob%WO~O#b%YO~P.PO!f#lOu#Za!U#Za!Z#Za~Ob%[O~P#|OP#[OuhX!UhXbhX~O#m$nOu!yX!U!yX~Ou%^O!UyO~O!T%bO#a$oO#m$nO~Ok#]OQ#WXc#WXg#WXi#WXo#WXr#WXu#WX!Y#WX!Z#WX#^#WX#`#WX#a#WX#m#WX!T#WX~Ou$vO!Y%eO!Z!Wq#^!Wq!T!Wq~P%yOk#]Oq%fO~Ob#UXu#UX~P%XOu${Ob#na~Ob#TXu#TX~P%yOu%POb#ka~OZ%kOb%mO~Ob%nO~P%yOb%oO!h%pO~Ok#]OQ#Wac#Wag#Wai#Wao#War#Wau#Wa!Y#Wa!Z#Wa#^#Wa#`#Wa#a#Wa#m#Wa!T#Wa~Ob#Uau#Ua~P#|Ob#Tau#Ta~P%yOZ%kOb%vO~OQ#jOg#jOi#jOo!^O#`![O#b%YO#m$nO~Ob%xO~O#dp#e#mk!S#m~",
  goto: "/l#sPPP#tP#wP$Q$dP$QP$v$QPP$|PPP%S%]%]P%oP%]P&`&w'^PPPP%]'{P(P(V$QP(]$Q(cP$QP$Q$QPPP(i)O)]PP#wPP)dP)g)m)m)x)mP)mP)mP)m)mP#wP#wP#wP*R#wP*U*X*[*c#wP#wP*h*n*}+]+c+i+o+u+{,V,],c,iPPPPPPPPPPP,o,x-n-qP.g.j.p.|/cRmQ_dOPfjy!r#|q[OPYZfjtuvwy!r#V#p#|${qSOPYZfjtuvwy!r#V#p#|${QoTR!xpQ}VR!yqQ!y!PQ#a!]R$R!{q!`]_!X!q#W#Y#]#y$T$Y$f$v$w%P%X%ip!`]_!X!q#W#Y#]#y$T$Y$f$v$w%P%X%iU#j!b$g%pU$q#u$s%^R%]$pp!`]_!X!q#W#Y#]#y$T$Y$f$v$w%P%X%iV#j!b$g%pw!]]_!X!b!q#W#Y#]#y$T$Y$f$g$v$w%P%X%i%pp!`]_!X!q#W#Y#]#y$T$Y$f$v$w%P%X%iQ!j`U#j!b$g%pR#t!kT#d!_#eQ!OVR!zqQ!y!OR$R!zQ!RWR!|rQ!TXR!}sQzUQ#TxQ#q!gQ#w!nQ#x!oQ%`$rR%s%_SiPyQ!tjQ#{!rR$y#|ZhPjy!r#|R#`!ZQ%U$_R%t%kc!f^bc!Z!b!d#`#l#mQ#h!bQ%Z$gR%w%pR!k`R!maR#v!mS$r#u$sR%q%^V$p#u$s%^Q!vlR$P!vQfOSjPyU!pfj#|R#|!rQ$Y#WU%O$Y%X%iQ%X$fR%i%PQ#e!_R$d#eQ%Q$YR%j%QQ$|$VR%h$|QxUR#SxQ$w#yR%d$wQ!siS#}!s$OR$O!tQ%l%UR%u%lQ#n!cR$k#nQ$s#uR%a$sQ%_$rR%r%__eOPfjy!r#|^UOPfjy!r#|Q!UYQ!VZQ#OtQ#PuQ#QvQ#RwQ$V#VQ$l#pR%g${R$Z#WQ!Z]Q!h_Q#Z!XQ#y!q[$X#W$Y$f%P%X%iQ$[#YQ$^#]S$u#y$wQ$z$TR%c$vR$W#VQkPR#UyQ!g^Q!ocQ#_!ZR$a#`W!c^c!Z#`Q!nbQ#i!bQ#o!dQ$i#lR$j#mQ#k!bQ%Z$gR%w%p",
  nodeNames: "\u26A0 Unit VariableName Comment StyleSheet RuleSet UniversalSelector TagSelector TagName NestingSelector ClassSelector . ClassName PseudoClassSelector : :: PseudoClassName PseudoClassName ) ( ArgList ValueName ParenthesizedValue ColorLiteral NumberLiteral StringLiteral BinaryExpression BinOp CallExpression Callee CallLiteral CallTag ParenthesizedContent ] [ LineNames LineName , PseudoClassName ArgList IdSelector # IdName AttributeSelector AttributeName MatchOp ChildSelector ChildOp DescendantSelector SiblingSelector SiblingOp } { Block Declaration PropertyName Important ; ImportStatement AtKeyword import Layer layer LayerName KeywordQuery FeatureQuery FeatureName BinaryQuery LogicOp ComparisonQuery CompareOp UnaryQuery UnaryQueryOp ParenthesizedQuery SelectorQuery selector MediaStatement media CharsetStatement charset NamespaceStatement namespace NamespaceName KeyframesStatement keyframes KeyframeName KeyframeList KeyframeSelector KeyframeRangeName SupportsStatement supports AtRule Styles",
  maxTerm: 126,
  nodeProps: [
    ["isolate", -2, 3, 25, ""],
    ["openedBy", 18, "(", 33, "[", 51, "{"],
    ["closedBy", 19, ")", 34, "]", 52, "}"]
  ],
  propSources: [cssHighlighting],
  skippedNodes: [0, 3, 93],
  repeatNodeCount: 13,
  tokenData: "LU~R!^OX$}X^%u^p$}pq%uqr)Xrs.Rst/utu6duv$}vw7^wx7oxy9^yz9oz{9t{|:_|}?Q}!O?c!O!P@Q!P!Q@i!Q![Ab![!]B]!]!^CX!^!_Cj!_!`Df!`!aDy!a!b$}!b!cEz!c!}$}!}#OHX#O#P$}#P#QHj#Q#R6d#R#T$}#T#UH{#U#c$}#c#dJ^#d#o$}#o#pJs#p#q6d#q#rKU#r#sKg#s#y$}#y#z%u#z$f$}$f$g%u$g#BY$}#BY#BZ%u#BZ$IS$}$IS$I_%u$I_$I|$}$I|$JO%u$JO$JT$}$JT$JU%u$JU$KV$}$KV$KW%u$KW&FU$}&FU&FV%u&FV;'S$};'S;=`LO<%lO$}`%QSOy%^z;'S%^;'S;=`%o<%lO%^`%cSp`Oy%^z;'S%^;'S;=`%o<%lO%^`%rP;=`<%l%^~%zh#d~OX%^X^'f^p%^pq'fqy%^z#y%^#y#z'f#z$f%^$f$g'f$g#BY%^#BY#BZ'f#BZ$IS%^$IS$I_'f$I_$I|%^$I|$JO'f$JO$JT%^$JT$JU'f$JU$KV%^$KV$KW'f$KW&FU%^&FU&FV'f&FV;'S%^;'S;=`%o<%lO%^~'mh#d~p`OX%^X^'f^p%^pq'fqy%^z#y%^#y#z'f#z$f%^$f$g'f$g#BY%^#BY#BZ'f#BZ$IS%^$IS$I_'f$I_$I|%^$I|$JO'f$JO$JT%^$JT$JU'f$JU$KV%^$KV$KW'f$KW&FU%^&FU&FV'f&FV;'S%^;'S;=`%o<%lO%^l)[UOy%^z#]%^#]#^)n#^;'S%^;'S;=`%o<%lO%^l)sUp`Oy%^z#a%^#a#b*V#b;'S%^;'S;=`%o<%lO%^l*[Up`Oy%^z#d%^#d#e*n#e;'S%^;'S;=`%o<%lO%^l*sUp`Oy%^z#c%^#c#d+V#d;'S%^;'S;=`%o<%lO%^l+[Up`Oy%^z#f%^#f#g+n#g;'S%^;'S;=`%o<%lO%^l+sUp`Oy%^z#h%^#h#i,V#i;'S%^;'S;=`%o<%lO%^l,[Up`Oy%^z#T%^#T#U,n#U;'S%^;'S;=`%o<%lO%^l,sUp`Oy%^z#b%^#b#c-V#c;'S%^;'S;=`%o<%lO%^l-[Up`Oy%^z#h%^#h#i-n#i;'S%^;'S;=`%o<%lO%^l-uS!Y[p`Oy%^z;'S%^;'S;=`%o<%lO%^~.UWOY.RZr.Rrs.ns#O.R#O#P.s#P;'S.R;'S;=`/o<%lO.R~.sOi~~.vRO;'S.R;'S;=`/P;=`O.R~/SXOY.RZr.Rrs.ns#O.R#O#P.s#P;'S.R;'S;=`/o;=`<%l.R<%lO.R~/rP;=`<%l.Rn/zYyQOy%^z!Q%^!Q![0j![!c%^!c!i0j!i#T%^#T#Z0j#Z;'S%^;'S;=`%o<%lO%^l0oYp`Oy%^z!Q%^!Q![1_![!c%^!c!i1_!i#T%^#T#Z1_#Z;'S%^;'S;=`%o<%lO%^l1dYp`Oy%^z!Q%^!Q![2S![!c%^!c!i2S!i#T%^#T#Z2S#Z;'S%^;'S;=`%o<%lO%^l2ZYg[p`Oy%^z!Q%^!Q![2y![!c%^!c!i2y!i#T%^#T#Z2y#Z;'S%^;'S;=`%o<%lO%^l3QYg[p`Oy%^z!Q%^!Q![3p![!c%^!c!i3p!i#T%^#T#Z3p#Z;'S%^;'S;=`%o<%lO%^l3uYp`Oy%^z!Q%^!Q![4e![!c%^!c!i4e!i#T%^#T#Z4e#Z;'S%^;'S;=`%o<%lO%^l4lYg[p`Oy%^z!Q%^!Q![5[![!c%^!c!i5[!i#T%^#T#Z5[#Z;'S%^;'S;=`%o<%lO%^l5aYp`Oy%^z!Q%^!Q![6P![!c%^!c!i6P!i#T%^#T#Z6P#Z;'S%^;'S;=`%o<%lO%^l6WSg[p`Oy%^z;'S%^;'S;=`%o<%lO%^d6gUOy%^z!_%^!_!`6y!`;'S%^;'S;=`%o<%lO%^d7QS}Sp`Oy%^z;'S%^;'S;=`%o<%lO%^b7cSXQOy%^z;'S%^;'S;=`%o<%lO%^~7rWOY7oZw7owx.nx#O7o#O#P8[#P;'S7o;'S;=`9W<%lO7o~8_RO;'S7o;'S;=`8h;=`O7o~8kXOY7oZw7owx.nx#O7o#O#P8[#P;'S7o;'S;=`9W;=`<%l7o<%lO7o~9ZP;=`<%l7on9cSc^Oy%^z;'S%^;'S;=`%o<%lO%^~9tOb~n9{UUQkWOy%^z!_%^!_!`6y!`;'S%^;'S;=`%o<%lO%^n:fWkW!SQOy%^z!O%^!O!P;O!P!Q%^!Q![>T![;'S%^;'S;=`%o<%lO%^l;TUp`Oy%^z!Q%^!Q![;g![;'S%^;'S;=`%o<%lO%^l;nYp`#m[Oy%^z!Q%^!Q![;g![!g%^!g!h<^!h#X%^#X#Y<^#Y;'S%^;'S;=`%o<%lO%^l<cYp`Oy%^z{%^{|=R|}%^}!O=R!O!Q%^!Q![=j![;'S%^;'S;=`%o<%lO%^l=WUp`Oy%^z!Q%^!Q![=j![;'S%^;'S;=`%o<%lO%^l=qUp`#m[Oy%^z!Q%^!Q![=j![;'S%^;'S;=`%o<%lO%^l>[[p`#m[Oy%^z!O%^!O!P;g!P!Q%^!Q![>T![!g%^!g!h<^!h#X%^#X#Y<^#Y;'S%^;'S;=`%o<%lO%^n?VSu^Oy%^z;'S%^;'S;=`%o<%lO%^l?hWkWOy%^z!O%^!O!P;O!P!Q%^!Q![>T![;'S%^;'S;=`%o<%lO%^n@VUZQOy%^z!Q%^!Q![;g![;'S%^;'S;=`%o<%lO%^~@nTkWOy%^z{@}{;'S%^;'S;=`%o<%lO%^~AUSp`#e~Oy%^z;'S%^;'S;=`%o<%lO%^lAg[#m[Oy%^z!O%^!O!P;g!P!Q%^!Q![>T![!g%^!g!h<^!h#X%^#X#Y<^#Y;'S%^;'S;=`%o<%lO%^jBbU^YOy%^z![%^![!]Bt!];'S%^;'S;=`%o<%lO%^bB{S_Qp`Oy%^z;'S%^;'S;=`%o<%lO%^nC^S!Z^Oy%^z;'S%^;'S;=`%o<%lO%^hCoU!hWOy%^z!_%^!_!`DR!`;'S%^;'S;=`%o<%lO%^hDYS!hWp`Oy%^z;'S%^;'S;=`%o<%lO%^lDmS!hW}SOy%^z;'S%^;'S;=`%o<%lO%^jEQV!PQ!hWOy%^z!_%^!_!`DR!`!aEg!a;'S%^;'S;=`%o<%lO%^bEnS!PQp`Oy%^z;'S%^;'S;=`%o<%lO%^bE}YOy%^z}%^}!OFm!O!c%^!c!}G[!}#T%^#T#oG[#o;'S%^;'S;=`%o<%lO%^bFrWp`Oy%^z!c%^!c!}G[!}#T%^#T#oG[#o;'S%^;'S;=`%o<%lO%^bGc[!]Qp`Oy%^z}%^}!OG[!O!Q%^!Q![G[![!c%^!c!}G[!}#T%^#T#oG[#o;'S%^;'S;=`%o<%lO%^nH^Sr^Oy%^z;'S%^;'S;=`%o<%lO%^nHoSq^Oy%^z;'S%^;'S;=`%o<%lO%^jIOUOy%^z#b%^#b#cIb#c;'S%^;'S;=`%o<%lO%^jIgUp`Oy%^z#W%^#W#XIy#X;'S%^;'S;=`%o<%lO%^jJQS!fYp`Oy%^z;'S%^;'S;=`%o<%lO%^jJaUOy%^z#f%^#f#gIy#g;'S%^;'S;=`%o<%lO%^fJxS!UUOy%^z;'S%^;'S;=`%o<%lO%^nKZS!T^Oy%^z;'S%^;'S;=`%o<%lO%^fKlU!SQOy%^z!_%^!_!`6y!`;'S%^;'S;=`%o<%lO%^`LRP;=`<%l$}",
  tokenizers: [descendant, unitToken, identifiers, 1, 2, 3, 4, new LocalTokenGroup("m~RRYZ[z{a~~g~aO#g~~dP!P!Qg~lO#h~~", 28, 114)],
  topRules: { "StyleSheet": [0, 4], "Styles": [1, 92] },
  specialized: [{ term: 108, get: (value) => spec_callee[value] || -1 }, { term: 59, get: (value) => spec_AtKeyword[value] || -1 }, { term: 110, get: (value) => spec_queryIdentifier[value] || -1 }],
  tokenPrec: 1441
});
var _properties = null;
function properties() {
  if (!_properties && typeof document == "object" && document.body) {
    let { style } = document.body, names = [], seen = /* @__PURE__ */ new Set();
    for (let prop in style)
      if (prop != "cssText" && prop != "cssFloat") {
        if (typeof style[prop] == "string") {
          if (/[A-Z]/.test(prop))
            prop = prop.replace(/[A-Z]/g, (ch) => "-" + ch.toLowerCase());
          if (!seen.has(prop)) {
            names.push(prop);
            seen.add(prop);
          }
        }
      }
    _properties = names.sort().map((name) => ({ type: "property", label: name, apply: name + ": " }));
  }
  return _properties || [];
}
var pseudoClasses = /* @__PURE__ */ [
  "active",
  "after",
  "any-link",
  "autofill",
  "backdrop",
  "before",
  "checked",
  "cue",
  "default",
  "defined",
  "disabled",
  "empty",
  "enabled",
  "file-selector-button",
  "first",
  "first-child",
  "first-letter",
  "first-line",
  "first-of-type",
  "focus",
  "focus-visible",
  "focus-within",
  "fullscreen",
  "has",
  "host",
  "host-context",
  "hover",
  "in-range",
  "indeterminate",
  "invalid",
  "is",
  "lang",
  "last-child",
  "last-of-type",
  "left",
  "link",
  "marker",
  "modal",
  "not",
  "nth-child",
  "nth-last-child",
  "nth-last-of-type",
  "nth-of-type",
  "only-child",
  "only-of-type",
  "optional",
  "out-of-range",
  "part",
  "placeholder",
  "placeholder-shown",
  "read-only",
  "read-write",
  "required",
  "right",
  "root",
  "scope",
  "selection",
  "slotted",
  "target",
  "target-text",
  "valid",
  "visited",
  "where"
].map((name) => ({ type: "class", label: name }));
var values = /* @__PURE__ */ [
  "above",
  "absolute",
  "activeborder",
  "additive",
  "activecaption",
  "after-white-space",
  "ahead",
  "alias",
  "all",
  "all-scroll",
  "alphabetic",
  "alternate",
  "always",
  "antialiased",
  "appworkspace",
  "asterisks",
  "attr",
  "auto",
  "auto-flow",
  "avoid",
  "avoid-column",
  "avoid-page",
  "avoid-region",
  "axis-pan",
  "background",
  "backwards",
  "baseline",
  "below",
  "bidi-override",
  "blink",
  "block",
  "block-axis",
  "bold",
  "bolder",
  "border",
  "border-box",
  "both",
  "bottom",
  "break",
  "break-all",
  "break-word",
  "bullets",
  "button",
  "button-bevel",
  "buttonface",
  "buttonhighlight",
  "buttonshadow",
  "buttontext",
  "calc",
  "capitalize",
  "caps-lock-indicator",
  "caption",
  "captiontext",
  "caret",
  "cell",
  "center",
  "checkbox",
  "circle",
  "cjk-decimal",
  "clear",
  "clip",
  "close-quote",
  "col-resize",
  "collapse",
  "color",
  "color-burn",
  "color-dodge",
  "column",
  "column-reverse",
  "compact",
  "condensed",
  "contain",
  "content",
  "contents",
  "content-box",
  "context-menu",
  "continuous",
  "copy",
  "counter",
  "counters",
  "cover",
  "crop",
  "cross",
  "crosshair",
  "currentcolor",
  "cursive",
  "cyclic",
  "darken",
  "dashed",
  "decimal",
  "decimal-leading-zero",
  "default",
  "default-button",
  "dense",
  "destination-atop",
  "destination-in",
  "destination-out",
  "destination-over",
  "difference",
  "disc",
  "discard",
  "disclosure-closed",
  "disclosure-open",
  "document",
  "dot-dash",
  "dot-dot-dash",
  "dotted",
  "double",
  "down",
  "e-resize",
  "ease",
  "ease-in",
  "ease-in-out",
  "ease-out",
  "element",
  "ellipse",
  "ellipsis",
  "embed",
  "end",
  "ethiopic-abegede-gez",
  "ethiopic-halehame-aa-er",
  "ethiopic-halehame-gez",
  "ew-resize",
  "exclusion",
  "expanded",
  "extends",
  "extra-condensed",
  "extra-expanded",
  "fantasy",
  "fast",
  "fill",
  "fill-box",
  "fixed",
  "flat",
  "flex",
  "flex-end",
  "flex-start",
  "footnotes",
  "forwards",
  "from",
  "geometricPrecision",
  "graytext",
  "grid",
  "groove",
  "hand",
  "hard-light",
  "help",
  "hidden",
  "hide",
  "higher",
  "highlight",
  "highlighttext",
  "horizontal",
  "hsl",
  "hsla",
  "hue",
  "icon",
  "ignore",
  "inactiveborder",
  "inactivecaption",
  "inactivecaptiontext",
  "infinite",
  "infobackground",
  "infotext",
  "inherit",
  "initial",
  "inline",
  "inline-axis",
  "inline-block",
  "inline-flex",
  "inline-grid",
  "inline-table",
  "inset",
  "inside",
  "intrinsic",
  "invert",
  "italic",
  "justify",
  "keep-all",
  "landscape",
  "large",
  "larger",
  "left",
  "level",
  "lighter",
  "lighten",
  "line-through",
  "linear",
  "linear-gradient",
  "lines",
  "list-item",
  "listbox",
  "listitem",
  "local",
  "logical",
  "loud",
  "lower",
  "lower-hexadecimal",
  "lower-latin",
  "lower-norwegian",
  "lowercase",
  "ltr",
  "luminosity",
  "manipulation",
  "match",
  "matrix",
  "matrix3d",
  "medium",
  "menu",
  "menutext",
  "message-box",
  "middle",
  "min-intrinsic",
  "mix",
  "monospace",
  "move",
  "multiple",
  "multiple_mask_images",
  "multiply",
  "n-resize",
  "narrower",
  "ne-resize",
  "nesw-resize",
  "no-close-quote",
  "no-drop",
  "no-open-quote",
  "no-repeat",
  "none",
  "normal",
  "not-allowed",
  "nowrap",
  "ns-resize",
  "numbers",
  "numeric",
  "nw-resize",
  "nwse-resize",
  "oblique",
  "opacity",
  "open-quote",
  "optimizeLegibility",
  "optimizeSpeed",
  "outset",
  "outside",
  "outside-shape",
  "overlay",
  "overline",
  "padding",
  "padding-box",
  "painted",
  "page",
  "paused",
  "perspective",
  "pinch-zoom",
  "plus-darker",
  "plus-lighter",
  "pointer",
  "polygon",
  "portrait",
  "pre",
  "pre-line",
  "pre-wrap",
  "preserve-3d",
  "progress",
  "push-button",
  "radial-gradient",
  "radio",
  "read-only",
  "read-write",
  "read-write-plaintext-only",
  "rectangle",
  "region",
  "relative",
  "repeat",
  "repeating-linear-gradient",
  "repeating-radial-gradient",
  "repeat-x",
  "repeat-y",
  "reset",
  "reverse",
  "rgb",
  "rgba",
  "ridge",
  "right",
  "rotate",
  "rotate3d",
  "rotateX",
  "rotateY",
  "rotateZ",
  "round",
  "row",
  "row-resize",
  "row-reverse",
  "rtl",
  "run-in",
  "running",
  "s-resize",
  "sans-serif",
  "saturation",
  "scale",
  "scale3d",
  "scaleX",
  "scaleY",
  "scaleZ",
  "screen",
  "scroll",
  "scrollbar",
  "scroll-position",
  "se-resize",
  "self-start",
  "self-end",
  "semi-condensed",
  "semi-expanded",
  "separate",
  "serif",
  "show",
  "single",
  "skew",
  "skewX",
  "skewY",
  "skip-white-space",
  "slide",
  "slider-horizontal",
  "slider-vertical",
  "sliderthumb-horizontal",
  "sliderthumb-vertical",
  "slow",
  "small",
  "small-caps",
  "small-caption",
  "smaller",
  "soft-light",
  "solid",
  "source-atop",
  "source-in",
  "source-out",
  "source-over",
  "space",
  "space-around",
  "space-between",
  "space-evenly",
  "spell-out",
  "square",
  "start",
  "static",
  "status-bar",
  "stretch",
  "stroke",
  "stroke-box",
  "sub",
  "subpixel-antialiased",
  "svg_masks",
  "super",
  "sw-resize",
  "symbolic",
  "symbols",
  "system-ui",
  "table",
  "table-caption",
  "table-cell",
  "table-column",
  "table-column-group",
  "table-footer-group",
  "table-header-group",
  "table-row",
  "table-row-group",
  "text",
  "text-bottom",
  "text-top",
  "textarea",
  "textfield",
  "thick",
  "thin",
  "threeddarkshadow",
  "threedface",
  "threedhighlight",
  "threedlightshadow",
  "threedshadow",
  "to",
  "top",
  "transform",
  "translate",
  "translate3d",
  "translateX",
  "translateY",
  "translateZ",
  "transparent",
  "ultra-condensed",
  "ultra-expanded",
  "underline",
  "unidirectional-pan",
  "unset",
  "up",
  "upper-latin",
  "uppercase",
  "url",
  "var",
  "vertical",
  "vertical-text",
  "view-box",
  "visible",
  "visibleFill",
  "visiblePainted",
  "visibleStroke",
  "visual",
  "w-resize",
  "wait",
  "wave",
  "wider",
  "window",
  "windowframe",
  "windowtext",
  "words",
  "wrap",
  "wrap-reverse",
  "x-large",
  "x-small",
  "xor",
  "xx-large",
  "xx-small"
].map((name) => ({ type: "keyword", label: name })).concat(/* @__PURE__ */ [
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "grey",
  "green",
  "greenyellow",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen"
].map((name) => ({ type: "constant", label: name })));
var tags4 = /* @__PURE__ */ [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "footer",
  "form",
  "header",
  "hgroup",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "meter",
  "nav",
  "ol",
  "output",
  "p",
  "pre",
  "ruby",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul"
].map((name) => ({ type: "type", label: name }));
var atRules = /* @__PURE__ */ [
  "@charset",
  "@color-profile",
  "@container",
  "@counter-style",
  "@font-face",
  "@font-feature-values",
  "@font-palette-values",
  "@import",
  "@keyframes",
  "@layer",
  "@media",
  "@namespace",
  "@page",
  "@position-try",
  "@property",
  "@scope",
  "@starting-style",
  "@supports",
  "@view-transition"
].map((label) => ({ type: "keyword", label }));
var identifier2 = /^(\w[\w-]*|-\w[\w-]*|)$/;
var variable = /^-(-[\w-]*)?$/;
function isVarArg(node, doc) {
  var _a;
  if (node.name == "(" || node.type.isError)
    node = node.parent || node;
  if (node.name != "ArgList")
    return false;
  let callee2 = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.firstChild;
  if ((callee2 === null || callee2 === void 0 ? void 0 : callee2.name) != "Callee")
    return false;
  return doc.sliceString(callee2.from, callee2.to) == "var";
}
var VariablesByNode = /* @__PURE__ */ new NodeWeakMap();
var declSelector = ["Declaration"];
function astTop(node) {
  for (let cur = node; ; ) {
    if (cur.type.isTop)
      return cur;
    if (!(cur = cur.parent))
      return node;
  }
}
function variableNames(doc, node, isVariable) {
  if (node.to - node.from > 4096) {
    let known = VariablesByNode.get(node);
    if (known)
      return known;
    let result = [], seen = /* @__PURE__ */ new Set(), cursor = node.cursor(IterMode.IncludeAnonymous);
    if (cursor.firstChild())
      do {
        for (let option of variableNames(doc, cursor.node, isVariable))
          if (!seen.has(option.label)) {
            seen.add(option.label);
            result.push(option);
          }
      } while (cursor.nextSibling());
    VariablesByNode.set(node, result);
    return result;
  } else {
    let result = [], seen = /* @__PURE__ */ new Set();
    node.cursor().iterate((node2) => {
      var _a;
      if (isVariable(node2) && node2.matchContext(declSelector) && ((_a = node2.node.nextSibling) === null || _a === void 0 ? void 0 : _a.name) == ":") {
        let name = doc.sliceString(node2.from, node2.to);
        if (!seen.has(name)) {
          seen.add(name);
          result.push({ label: name, type: "variable" });
        }
      }
    });
    return result;
  }
}
var defineCSSCompletionSource = (isVariable) => (context) => {
  let { state, pos } = context, node = syntaxTree(state).resolveInner(pos, -1);
  let isDash = node.type.isError && node.from == node.to - 1 && state.doc.sliceString(node.from, node.to) == "-";
  if (node.name == "PropertyName" || (isDash || node.name == "TagName") && /^(Block|Styles)$/.test(node.resolve(node.to).name))
    return { from: node.from, options: properties(), validFor: identifier2 };
  if (node.name == "ValueName")
    return { from: node.from, options: values, validFor: identifier2 };
  if (node.name == "PseudoClassName")
    return { from: node.from, options: pseudoClasses, validFor: identifier2 };
  if (isVariable(node) || (context.explicit || isDash) && isVarArg(node, state.doc))
    return {
      from: isVariable(node) || isDash ? node.from : pos,
      options: variableNames(state.doc, astTop(node), isVariable),
      validFor: variable
    };
  if (node.name == "TagName") {
    for (let { parent } = node; parent; parent = parent.parent)
      if (parent.name == "Block")
        return { from: node.from, options: properties(), validFor: identifier2 };
    return { from: node.from, options: tags4, validFor: identifier2 };
  }
  if (node.name == "AtKeyword")
    return { from: node.from, options: atRules, validFor: identifier2 };
  if (!context.explicit)
    return null;
  let above = node.resolve(pos), before = above.childBefore(pos);
  if (before && before.name == ":" && above.name == "PseudoClassSelector")
    return { from: pos, options: pseudoClasses, validFor: identifier2 };
  if (before && before.name == ":" && above.name == "Declaration" || above.name == "ArgList")
    return { from: pos, options: values, validFor: identifier2 };
  if (above.name == "Block" || above.name == "Styles")
    return { from: pos, options: properties(), validFor: identifier2 };
  return null;
};
var cssCompletionSource = /* @__PURE__ */ defineCSSCompletionSource((n) => n.name == "VariableName");
var cssLanguage = /* @__PURE__ */ LRLanguage.define({
  name: "css",
  parser: /* @__PURE__ */ parser2.configure({
    props: [
      /* @__PURE__ */ indentNodeProp.add({
        Declaration: /* @__PURE__ */ continuedIndent()
      }),
      /* @__PURE__ */ foldNodeProp.add({
        "Block KeyframeList": foldInside
      })
    ]
  }),
  languageData: {
    commentTokens: { block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*\}$/,
    wordChars: "-"
  }
});
function css() {
  return new LanguageSupport(cssLanguage, cssLanguage.data.of({ autocomplete: cssCompletionSource }));
}
var noSemi = 315;
var noSemiType = 316;
var incdec = 1;
var incdecPrefix = 2;
var questionDot = 3;
var JSXStartTag = 4;
var insertSemi = 317;
var spaces = 319;
var newline2 = 320;
var LineComment = 5;
var BlockComment = 6;
var Dialect_jsx = 0;
var space2 = [
  9,
  10,
  11,
  12,
  13,
  32,
  133,
  160,
  5760,
  8192,
  8193,
  8194,
  8195,
  8196,
  8197,
  8198,
  8199,
  8200,
  8201,
  8202,
  8232,
  8233,
  8239,
  8287,
  12288
];
var braceR = 125;
var semicolon = 59;
var slash2 = 47;
var star = 42;
var plus = 43;
var minus = 45;
var lt = 60;
var comma = 44;
var question2 = 63;
var dot = 46;
var bracketL2 = 91;
var trackNewline = new ContextTracker({
  start: false,
  shift(context, term) {
    return term == LineComment || term == BlockComment || term == spaces ? context : term == newline2;
  },
  strict: false
});
var insertSemicolon = new ExternalTokenizer((input, stack) => {
  let { next } = input;
  if (next == braceR || next == -1 || stack.context)
    input.acceptToken(insertSemi);
}, { contextual: true, fallback: true });
var noSemicolon = new ExternalTokenizer((input, stack) => {
  let { next } = input, after;
  if (space2.indexOf(next) > -1) return;
  if (next == slash2 && ((after = input.peek(1)) == slash2 || after == star)) return;
  if (next != braceR && next != semicolon && next != -1 && !stack.context)
    input.acceptToken(noSemi);
}, { contextual: true });
var noSemicolonType = new ExternalTokenizer((input, stack) => {
  if (input.next == bracketL2 && !stack.context) input.acceptToken(noSemiType);
}, { contextual: true });
var operatorToken = new ExternalTokenizer((input, stack) => {
  let { next } = input;
  if (next == plus || next == minus) {
    input.advance();
    if (next == input.next) {
      input.advance();
      let mayPostfix = !stack.context && stack.canShift(incdec);
      input.acceptToken(mayPostfix ? incdec : incdecPrefix);
    }
  } else if (next == question2 && input.peek(1) == dot) {
    input.advance();
    input.advance();
    if (input.next < 48 || input.next > 57)
      input.acceptToken(questionDot);
  }
}, { contextual: true });
function identifierChar(ch, start) {
  return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch == 95 || ch >= 192 || !start && ch >= 48 && ch <= 57;
}
var jsx2 = new ExternalTokenizer((input, stack) => {
  if (input.next != lt || !stack.dialectEnabled(Dialect_jsx)) return;
  input.advance();
  if (input.next == slash2) return;
  let back = 0;
  while (space2.indexOf(input.next) > -1) {
    input.advance();
    back++;
  }
  if (identifierChar(input.next, true)) {
    input.advance();
    back++;
    while (identifierChar(input.next, false)) {
      input.advance();
      back++;
    }
    while (space2.indexOf(input.next) > -1) {
      input.advance();
      back++;
    }
    if (input.next == comma) return;
    for (let i = 0; ; i++) {
      if (i == 7) {
        if (!identifierChar(input.next, true)) return;
        break;
      }
      if (input.next != "extends".charCodeAt(i)) break;
      input.advance();
      back++;
    }
  }
  input.acceptToken(JSXStartTag, -back);
});
var jsHighlight = styleTags({
  "get set async static": tags.modifier,
  "for while do if else switch try catch finally return throw break continue default case": tags.controlKeyword,
  "in of await yield void typeof delete instanceof as satisfies": tags.operatorKeyword,
  "let var const using function class extends": tags.definitionKeyword,
  "import export from": tags.moduleKeyword,
  "with debugger new": tags.keyword,
  TemplateString: tags.special(tags.string),
  super: tags.atom,
  BooleanLiteral: tags.bool,
  this: tags.self,
  null: tags.null,
  Star: tags.modifier,
  VariableName: tags.variableName,
  "CallExpression/VariableName TaggedTemplateExpression/VariableName": tags.function(tags.variableName),
  VariableDefinition: tags.definition(tags.variableName),
  Label: tags.labelName,
  PropertyName: tags.propertyName,
  PrivatePropertyName: tags.special(tags.propertyName),
  "CallExpression/MemberExpression/PropertyName": tags.function(tags.propertyName),
  "FunctionDeclaration/VariableDefinition": tags.function(tags.definition(tags.variableName)),
  "ClassDeclaration/VariableDefinition": tags.definition(tags.className),
  "NewExpression/VariableName": tags.className,
  PropertyDefinition: tags.definition(tags.propertyName),
  PrivatePropertyDefinition: tags.definition(tags.special(tags.propertyName)),
  UpdateOp: tags.updateOperator,
  "LineComment Hashbang": tags.lineComment,
  BlockComment: tags.blockComment,
  Number: tags.number,
  String: tags.string,
  Escape: tags.escape,
  ArithOp: tags.arithmeticOperator,
  LogicOp: tags.logicOperator,
  BitOp: tags.bitwiseOperator,
  CompareOp: tags.compareOperator,
  RegExp: tags.regexp,
  Equals: tags.definitionOperator,
  Arrow: tags.function(tags.punctuation),
  ": Spread": tags.punctuation,
  "( )": tags.paren,
  "[ ]": tags.squareBracket,
  "{ }": tags.brace,
  "InterpolationStart InterpolationEnd": tags.special(tags.brace),
  ".": tags.derefOperator,
  ", ;": tags.separator,
  "@": tags.meta,
  TypeName: tags.typeName,
  TypeDefinition: tags.definition(tags.typeName),
  "type enum interface implements namespace module declare": tags.definitionKeyword,
  "abstract global Privacy readonly override": tags.modifier,
  "is keyof unique infer asserts": tags.operatorKeyword,
  JSXAttributeValue: tags.attributeValue,
  JSXText: tags.content,
  "JSXStartTag JSXStartCloseTag JSXSelfCloseEndTag JSXEndTag": tags.angleBracket,
  "JSXIdentifier JSXNameSpacedName": tags.tagName,
  "JSXAttribute/JSXIdentifier JSXAttribute/JSXNameSpacedName": tags.attributeName,
  "JSXBuiltin/JSXIdentifier": tags.standard(tags.tagName)
});
var spec_identifier = { __proto__: null, export: 20, as: 25, from: 33, default: 36, async: 41, function: 42, in: 52, out: 55, const: 56, extends: 60, this: 64, true: 72, false: 72, null: 84, void: 88, typeof: 92, super: 108, new: 142, delete: 154, yield: 163, await: 167, class: 172, public: 235, private: 235, protected: 235, readonly: 237, instanceof: 256, satisfies: 259, import: 292, keyof: 349, unique: 353, infer: 359, asserts: 395, is: 397, abstract: 417, implements: 419, type: 421, let: 424, var: 426, using: 429, interface: 435, enum: 439, namespace: 445, module: 447, declare: 451, global: 455, for: 474, of: 483, while: 486, with: 490, do: 494, if: 498, else: 500, switch: 504, case: 510, try: 516, catch: 520, finally: 524, return: 528, throw: 532, break: 536, continue: 540, debugger: 544 };
var spec_word = { __proto__: null, async: 129, get: 131, set: 133, declare: 195, public: 197, private: 197, protected: 197, static: 199, abstract: 201, override: 203, readonly: 209, accessor: 211, new: 401 };
var spec_LessThan = { __proto__: null, "<": 193 };
var parser3 = LRParser.deserialize({
  version: 14,
  states: "$EOQ%TQlOOO%[QlOOO'_QpOOP(lO`OOO*zQ!0MxO'#CiO+RO#tO'#CjO+aO&jO'#CjO+oO#@ItO'#DaO.QQlO'#DgO.bQlO'#DrO%[QlO'#DzO0fQlO'#ESOOQ!0Lf'#E['#E[O1PQ`O'#EXOOQO'#Ep'#EpOOQO'#Ik'#IkO1XQ`O'#GsO1dQ`O'#EoO1iQ`O'#EoO3hQ!0MxO'#JqO6[Q!0MxO'#JrO6uQ`O'#F]O6zQ,UO'#FtOOQ!0Lf'#Ff'#FfO7VO7dO'#FfO7eQMhO'#F|O9[Q`O'#F{OOQ!0Lf'#Jr'#JrOOQ!0Lb'#Jq'#JqO9aQ`O'#GwOOQ['#K^'#K^O9lQ`O'#IXO9qQ!0LrO'#IYOOQ['#J_'#J_OOQ['#I^'#I^Q`QlOOQ`QlOOO9yQ!L^O'#DvO:QQlO'#EOO:XQlO'#EQO9gQ`O'#GsO:`QMhO'#CoO:nQ`O'#EnO:yQ`O'#EyO;OQMhO'#FeO;mQ`O'#GsOOQO'#K_'#K_O;rQ`O'#K_O<QQ`O'#G{O<QQ`O'#G|O<QQ`O'#HOO9gQ`O'#HRO<wQ`O'#HUO>`Q`O'#CeO>pQ`O'#HbO>xQ`O'#HhO>xQ`O'#HjO`QlO'#HlO>xQ`O'#HnO>xQ`O'#HqO>}Q`O'#HwO?SQ!0LsO'#H}O%[QlO'#IPO?_Q!0LsO'#IRO?jQ!0LsO'#ITO9qQ!0LrO'#IVO?uQ!0MxO'#CiO@wQpO'#DlQOQ`OOO%[QlO'#EQOA_Q`O'#ETO:`QMhO'#EnOAjQ`O'#EnOAuQ!bO'#FeOOQ['#Cg'#CgOOQ!0Lb'#Dq'#DqOOQ!0Lb'#Ju'#JuO%[QlO'#JuOOQO'#Jx'#JxOOQO'#Ig'#IgOBuQpO'#EgOOQ!0Lb'#Ef'#EfOOQ!0Lb'#J|'#J|OCqQ!0MSO'#EgOC{QpO'#EWOOQO'#Jw'#JwODaQpO'#JxOEnQpO'#EWOC{QpO'#EgPE{O&2DjO'#CbPOOO)CD|)CD|OOOO'#I_'#I_OFWO#tO,59UOOQ!0Lh,59U,59UOOOO'#I`'#I`OFfO&jO,59UOFtQ!L^O'#DcOOOO'#Ib'#IbOF{O#@ItO,59{OOQ!0Lf,59{,59{OGZQlO'#IcOGnQ`O'#JsOImQ!fO'#JsO+}QlO'#JsOItQ`O,5:ROJ[Q`O'#EpOJiQ`O'#KSOJtQ`O'#KROJtQ`O'#KROJ|Q`O,5;^OKRQ`O'#KQOOQ!0Ln,5:^,5:^OKYQlO,5:^OMWQ!0MxO,5:fOMwQ`O,5:nONbQ!0LrO'#KPONiQ`O'#KOO9aQ`O'#KOON}Q`O'#KOO! VQ`O,5;]O! [Q`O'#KOO!#aQ!fO'#JrOOQ!0Lh'#Ci'#CiO%[QlO'#ESO!$PQ!fO,5:sOOQS'#Jy'#JyOOQO-E<i-E<iO9gQ`O,5=_O!$gQ`O,5=_O!$lQlO,5;ZO!&oQMhO'#EkO!(YQ`O,5;ZO!(_QlO'#DyO!(iQpO,5;dO!(qQpO,5;dO%[QlO,5;dOOQ['#FT'#FTOOQ['#FV'#FVO%[QlO,5;eO%[QlO,5;eO%[QlO,5;eO%[QlO,5;eO%[QlO,5;eO%[QlO,5;eO%[QlO,5;eO%[QlO,5;eO%[QlO,5;eO%[QlO,5;eOOQ['#FZ'#FZO!)PQlO,5;tOOQ!0Lf,5;y,5;yOOQ!0Lf,5;z,5;zOOQ!0Lf,5;|,5;|O%[QlO'#IoO!+SQ!0LrO,5<iO%[QlO,5;eO!&oQMhO,5;eO!+qQMhO,5;eO!-cQMhO'#E^O%[QlO,5;wOOQ!0Lf,5;{,5;{O!-jQ,UO'#FjO!.gQ,UO'#KWO!.RQ,UO'#KWO!.nQ,UO'#KWOOQO'#KW'#KWO!/SQ,UO,5<SOOOW,5<`,5<`O!/eQlO'#FvOOOW'#In'#InO7VO7dO,5<QO!/lQ,UO'#FxOOQ!0Lf,5<Q,5<QO!0]Q$IUO'#CyOOQ!0Lh'#C}'#C}O!0pO#@ItO'#DRO!1^QMjO,5<eO!1eQ`O,5<hO!3QQ(CWO'#GXO!3_Q`O'#GYO!3dQ`O'#GYO!5SQ(CWO'#G^O!6XQpO'#GbOOQO'#Gn'#GnO!+xQMhO'#GmOOQO'#Gp'#GpO!+xQMhO'#GoO!6zQ$IUO'#JkOOQ!0Lh'#Jk'#JkO!7UQ`O'#JjO!7dQ`O'#JiO!7lQ`O'#CuOOQ!0Lh'#C{'#C{O!7}Q`O'#C}OOQ!0Lh'#DV'#DVOOQ!0Lh'#DX'#DXO1SQ`O'#DZO!+xQMhO'#GPO!+xQMhO'#GRO!8SQ`O'#GTO!8XQ`O'#GUO!3dQ`O'#G[O!+xQMhO'#GaO<QQ`O'#JjO!8^Q`O'#EqO!8{Q`O,5<gOOQ!0Lb'#Cr'#CrO!9TQ`O'#ErO!9}QpO'#EsOOQ!0Lb'#KQ'#KQO!:UQ!0LrO'#K`O9qQ!0LrO,5=cO`QlO,5>sOOQ['#Jg'#JgOOQ[,5>t,5>tOOQ[-E<[-E<[O!<TQ!0MxO,5:bO!9xQpO,5:`O!>nQ!0MxO,5:jO%[QlO,5:jO!AUQ!0MxO,5:lOOQO,5@y,5@yO!AuQMhO,5=_O!BTQ!0LrO'#JhO9[Q`O'#JhO!BfQ!0LrO,59ZO!BqQpO,59ZO!ByQMhO,59ZO:`QMhO,59ZO!CUQ`O,5;ZO!C^Q`O'#HaO!CrQ`O'#KcO%[QlO,5;}O!9xQpO,5<PO!CzQ`O,5=zO!DPQ`O,5=zO!DUQ`O,5=zO9qQ!0LrO,5=zO<QQ`O,5=jOOQO'#Cy'#CyO!DdQpO,5=gO!DlQMhO,5=hO!DwQ`O,5=jO!D|Q!bO,5=mO!EUQ`O'#K_O>}Q`O'#HWO9gQ`O'#HYO!EZQ`O'#HYO:`QMhO'#H[O!E`Q`O'#H[OOQ[,5=p,5=pO!EeQ`O'#H]O!EvQ`O'#CoO!E{Q`O,59PO!FVQ`O,59PO!H[QlO,59POOQ[,59P,59PO!HlQ!0LrO,59PO%[QlO,59PO!JwQlO'#HdOOQ['#He'#HeOOQ['#Hf'#HfO`QlO,5=|O!K_Q`O,5=|O`QlO,5>SO`QlO,5>UO!KdQ`O,5>WO`QlO,5>YO!KiQ`O,5>]O!KnQlO,5>cOOQ[,5>i,5>iO%[QlO,5>iO9qQ!0LrO,5>kOOQ[,5>m,5>mO# xQ`O,5>mOOQ[,5>o,5>oO# xQ`O,5>oOOQ[,5>q,5>qO#!fQpO'#D_O%[QlO'#JuO##XQpO'#JuO##cQpO'#DmO##tQpO'#DmO#&VQlO'#DmO#&^Q`O'#JtO#&fQ`O,5:WO#&kQ`O'#EtO#&yQ`O'#KTO#'RQ`O,5;_O#'WQpO'#DmO#'eQpO'#EVOOQ!0Lf,5:o,5:oO%[QlO,5:oO#'lQ`O,5:oO>}Q`O,5;YO!BqQpO,5;YO!ByQMhO,5;YO:`QMhO,5;YO#'tQ`O,5@aO#'yQ07dO,5:sOOQO-E<e-E<eO#)PQ!0MSO,5;ROC{QpO,5:rO#)ZQpO,5:rOC{QpO,5;RO!BfQ!0LrO,5:rOOQ!0Lb'#Ej'#EjOOQO,5;R,5;RO%[QlO,5;RO#)hQ!0LrO,5;RO#)sQ!0LrO,5;RO!BqQpO,5:rOOQO,5;X,5;XO#*RQ!0LrO,5;RPOOO'#I]'#I]P#*gO&2DjO,58|POOO,58|,58|OOOO-E<]-E<]OOQ!0Lh1G.p1G.pOOOO-E<^-E<^OOOO,59},59}O#*rQ!bO,59}OOOO-E<`-E<`OOQ!0Lf1G/g1G/gO#*wQ!fO,5>}O+}QlO,5>}OOQO,5?T,5?TO#+RQlO'#IcOOQO-E<a-E<aO#+`Q`O,5@_O#+hQ!fO,5@_O#+oQ`O,5@mOOQ!0Lf1G/m1G/mO%[QlO,5@nO#+wQ`O'#IiOOQO-E<g-E<gO#+oQ`O,5@mOOQ!0Lb1G0x1G0xOOQ!0Ln1G/x1G/xOOQ!0Ln1G0Y1G0YO%[QlO,5@kO#,]Q!0LrO,5@kO#,nQ!0LrO,5@kO#,uQ`O,5@jO9aQ`O,5@jO#,}Q`O,5@jO#-]Q`O'#IlO#,uQ`O,5@jOOQ!0Lb1G0w1G0wO!(iQpO,5:uO!(tQpO,5:uOOQS,5:w,5:wO#-}QdO,5:wO#.VQMhO1G2yO9gQ`O1G2yOOQ!0Lf1G0u1G0uO#.eQ!0MxO1G0uO#/jQ!0MvO,5;VOOQ!0Lh'#GW'#GWO#0WQ!0MzO'#JkO!$lQlO1G0uO#2cQ!fO'#JvO%[QlO'#JvO#2mQ`O,5:eOOQ!0Lh'#D_'#D_OOQ!0Lf1G1O1G1OO%[QlO1G1OOOQ!0Lf1G1f1G1fO#2rQ`O1G1OO#5WQ!0MxO1G1PO#5_Q!0MxO1G1PO#7uQ!0MxO1G1PO#7|Q!0MxO1G1PO#:dQ!0MxO1G1PO#<zQ!0MxO1G1PO#=RQ!0MxO1G1PO#=YQ!0MxO1G1PO#?pQ!0MxO1G1PO#?wQ!0MxO1G1PO#BUQ?MtO'#CiO#DPQ?MtO1G1`O#DWQ?MtO'#JrO#DkQ!0MxO,5?ZOOQ!0Lb-E<m-E<mO#FxQ!0MxO1G1PO#GuQ!0MzO1G1POOQ!0Lf1G1P1G1PO#HxQMjO'#J{O#ISQ`O,5:xO#IXQ!0MxO1G1cO#I{Q,UO,5<WO#JTQ,UO,5<XO#J]Q,UO'#FoO#JtQ`O'#FnOOQO'#KX'#KXOOQO'#Im'#ImO#JyQ,UO1G1nOOQ!0Lf1G1n1G1nOOOW1G1y1G1yO#K[Q?MtO'#JqO#KfQ`O,5<bO!)PQlO,5<bOOOW-E<l-E<lOOQ!0Lf1G1l1G1lO#KkQpO'#KWOOQ!0Lf,5<d,5<dO#KsQpO,5<dO#KxQMhO'#DTOOOO'#Ia'#IaO#LPO#@ItO,59mOOQ!0Lh,59m,59mO%[QlO1G2PO!8XQ`O'#IqO#L[Q`O,5<zOOQ!0Lh,5<w,5<wO!+xQMhO'#ItO#LxQMjO,5=XO!+xQMhO'#IvO#MkQMjO,5=ZO!&oQMhO,5=]OOQO1G2S1G2SO#MuQ!dO'#CrO#NYQ(CWO'#ErO$ _QpO'#GbO$ uQ!dO,5<sO$ |Q`O'#KZO9aQ`O'#KZO$![Q`O,5<uO!+xQMhO,5<tO$!aQ`O'#GZO$!rQ`O,5<tO$!wQ!dO'#GWO$#UQ!dO'#K[O$#`Q`O'#K[O!&oQMhO'#K[O$#eQ`O,5<xO$#jQlO'#JuO$#tQpO'#GcO##tQpO'#GcO$$VQ`O'#GgO!3dQ`O'#GkO$$[Q!0LrO'#IsO$$gQpO,5<|OOQ!0Lp,5<|,5<|O$$nQpO'#GcO$${QpO'#GdO$%^QpO'#GdO$%cQMjO,5=XO$%sQMjO,5=ZOOQ!0Lh,5=^,5=^O!+xQMhO,5@UO!+xQMhO,5@UO$&TQ`O'#IxO$&iQ`O,5@TO$&qQ`O,59aOOQ!0Lh,59i,59iO$'hQ$IYO,59uOOQ!0Lh'#Jo'#JoO$(ZQMjO,5<kO$(|QMjO,5<mO@oQ`O,5<oOOQ!0Lh,5<p,5<pO$)WQ`O,5<vO$)]QMjO,5<{O$)mQ`O,5@UO$){Q`O'#KOO!$lQlO1G2RO$*QQ`O1G2RO9aQ`O'#KRO9aQ`O'#EtO%[QlO'#EtO9aQ`O'#IzO$*VQ!0LrO,5@zOOQ[1G2}1G2}OOQ[1G4_1G4_OOQ!0Lf1G/|1G/|OOQ!0Lf1G/z1G/zO$,XQ!0MxO1G0UOOQ[1G2y1G2yO!&oQMhO1G2yO%[QlO1G2yO#.YQ`O1G2yO$.]QMhO'#EkOOQ!0Lb,5@S,5@SO$.jQ!0LrO,5@SOOQ[1G.u1G.uO!BfQ!0LrO1G.uO!BqQpO1G.uO!ByQMhO1G.uO$.{Q`O1G0uO$/QQ`O'#CiO$/]Q`O'#KdO$/eQ`O,5={O$/jQ`O'#KdO$/oQ`O'#KdO$/}Q`O'#JQO$0]Q`O,5@}O$0eQ!fO1G1iOOQ!0Lf1G1k1G1kO9gQ`O1G3fO@oQ`O1G3fO$0lQ`O1G3fO$0qQ`O1G3fOOQ[1G3f1G3fO!DwQ`O1G3UO!&oQMhO1G3RO$0vQ`O1G3ROOQ[1G3S1G3SO!&oQMhO1G3SO$0{Q`O1G3SO$1TQpO'#HQOOQ[1G3U1G3UO!6SQpO'#I|O!D|Q!bO1G3XOOQ[1G3X1G3XOOQ[,5=r,5=rO$1]QMhO,5=tO9gQ`O,5=tO$$VQ`O,5=vO9[Q`O,5=vO!BqQpO,5=vO!ByQMhO,5=vO:`QMhO,5=vO$1kQ`O'#KbO$1vQ`O,5=wOOQ[1G.k1G.kO$1{Q!0LrO1G.kO@oQ`O1G.kO$2WQ`O1G.kO9qQ!0LrO1G.kO$4`Q!fO,5APO$4mQ`O,5APO9aQ`O,5APO$4xQlO,5>OO$5PQ`O,5>OOOQ[1G3h1G3hO`QlO1G3hOOQ[1G3n1G3nOOQ[1G3p1G3pO>xQ`O1G3rO$5UQlO1G3tO$9YQlO'#HsOOQ[1G3w1G3wO$9gQ`O'#HyO>}Q`O'#H{OOQ[1G3}1G3}O$9oQlO1G3}O9qQ!0LrO1G4TOOQ[1G4V1G4VOOQ!0Lb'#G_'#G_O9qQ!0LrO1G4XO9qQ!0LrO1G4ZO$=vQ`O,5@aO!)PQlO,5;`O9aQ`O,5;`O>}Q`O,5:XO!)PQlO,5:XO!BqQpO,5:XO$={Q?MtO,5:XOOQO,5;`,5;`O$>VQpO'#IdO$>mQ`O,5@`OOQ!0Lf1G/r1G/rO$>uQpO'#IjO$?PQ`O,5@oOOQ!0Lb1G0y1G0yO##tQpO,5:XOOQO'#If'#IfO$?XQpO,5:qOOQ!0Ln,5:q,5:qO#'oQ`O1G0ZOOQ!0Lf1G0Z1G0ZO%[QlO1G0ZOOQ!0Lf1G0t1G0tO>}Q`O1G0tO!BqQpO1G0tO!ByQMhO1G0tOOQ!0Lb1G5{1G5{O!BfQ!0LrO1G0^OOQO1G0m1G0mO%[QlO1G0mO$?`Q!0LrO1G0mO$?kQ!0LrO1G0mO!BqQpO1G0^OC{QpO1G0^O$?yQ!0LrO1G0mOOQO1G0^1G0^O$@_Q!0MxO1G0mPOOO-E<Z-E<ZPOOO1G.h1G.hOOOO1G/i1G/iO$@iQ!bO,5<iO$@qQ!fO1G4iOOQO1G4o1G4oO%[QlO,5>}O$@{Q`O1G5yO$ATQ`O1G6XO$A]Q!fO1G6YO9aQ`O,5?TO$AgQ!0MxO1G6VO%[QlO1G6VO$AwQ!0LrO1G6VO$BYQ`O1G6UO$BYQ`O1G6UO9aQ`O1G6UO$BbQ`O,5?WO9aQ`O,5?WOOQO,5?W,5?WO$BvQ`O,5?WO$){Q`O,5?WOOQO-E<j-E<jOOQS1G0a1G0aOOQS1G0c1G0cO#.QQ`O1G0cOOQ[7+(e7+(eO!&oQMhO7+(eO%[QlO7+(eO$CUQ`O7+(eO$CaQMhO7+(eO$CoQ!0MzO,5=XO$EzQ!0MzO,5=ZO$HVQ!0MzO,5=XO$JhQ!0MzO,5=ZO$LyQ!0MzO,59uO% OQ!0MzO,5<kO%#ZQ!0MzO,5<mO%%fQ!0MzO,5<{OOQ!0Lf7+&a7+&aO%'wQ!0MxO7+&aO%(kQlO'#IeO%(xQ`O,5@bO%)QQ!fO,5@bOOQ!0Lf1G0P1G0PO%)[Q`O7+&jOOQ!0Lf7+&j7+&jO%)aQ?MtO,5:fO%[QlO7+&zO%)kQ?MtO,5:bO%)xQ?MtO,5:jO%*SQ?MtO,5:lO%*^QMhO'#IhO%*hQ`O,5@gOOQ!0Lh1G0d1G0dOOQO1G1r1G1rOOQO1G1s1G1sO%*pQ!jO,5<ZO!)PQlO,5<YOOQO-E<k-E<kOOQ!0Lf7+'Y7+'YOOOW7+'e7+'eOOOW1G1|1G1|O%*{Q`O1G1|OOQ!0Lf1G2O1G2OOOOO,59o,59oO%+QQ!dO,59oOOOO-E<_-E<_OOQ!0Lh1G/X1G/XO%+XQ!0MxO7+'kOOQ!0Lh,5?],5?]O%+{QMhO1G2fP%,SQ`O'#IqPOQ!0Lh-E<o-E<oO%,pQMjO,5?`OOQ!0Lh-E<r-E<rO%-cQMjO,5?bOOQ!0Lh-E<t-E<tO%-mQ!dO1G2wO%-tQ!dO'#CrO%.[QMhO'#KRO$#jQlO'#JuOOQ!0Lh1G2_1G2_O%.cQ`O'#IpO%.wQ`O,5@uO%.wQ`O,5@uO%/PQ`O,5@uO%/[Q`O,5@uOOQO1G2a1G2aO%/jQMjO1G2`O!+xQMhO1G2`O%/zQ(CWO'#IrO%0XQ`O,5@vO!&oQMhO,5@vO%0aQ!dO,5@vOOQ!0Lh1G2d1G2dO%2qQ!fO'#CiO%2{Q`O,5=POOQ!0Lb,5<},5<}O%3TQpO,5<}OOQ!0Lb,5=O,5=OOClQ`O,5<}O%3`QpO,5<}OOQ!0Lb,5=R,5=RO$){Q`O,5=VOOQO,5?_,5?_OOQO-E<q-E<qOOQ!0Lp1G2h1G2hO##tQpO,5<}O$#jQlO,5=PO%3nQ`O,5=OO%3yQpO,5=OO!+xQMhO'#ItO%4sQMjO1G2sO!+xQMhO'#IvO%5fQMjO1G2uO%5pQMjO1G5pO%5zQMjO1G5pOOQO,5?d,5?dOOQO-E<v-E<vOOQO1G.{1G.{O!9xQpO,59wO%[QlO,59wOOQ!0Lh,5<j,5<jO%6XQ`O1G2ZO!+xQMhO1G2bO!+xQMhO1G5pO!+xQMhO1G5pO%6^Q!0MxO7+'mOOQ!0Lf7+'m7+'mO!$lQlO7+'mO%7QQ`O,5;`OOQ!0Lb,5?f,5?fOOQ!0Lb-E<x-E<xO%7VQ!dO'#K]O#'oQ`O7+(eO4UQ!fO7+(eO$CXQ`O7+(eO%7aQ!0MvO'#CiO%7tQ!0MvO,5=SO%8fQ`O,5=SO%8nQ`O,5=SOOQ!0Lb1G5n1G5nOOQ[7+$a7+$aO!BfQ!0LrO7+$aO!BqQpO7+$aO!$lQlO7+&aO%8sQ`O'#JPO%9[Q`O,5AOOOQO1G3g1G3gO9gQ`O,5AOO%9[Q`O,5AOO%9dQ`O,5AOOOQO,5?l,5?lOOQO-E=O-E=OOOQ!0Lf7+'T7+'TO%9iQ`O7+)QO9qQ!0LrO7+)QO9gQ`O7+)QO@oQ`O7+)QOOQ[7+(p7+(pO%9nQ!0MvO7+(mO!&oQMhO7+(mO!DrQ`O7+(nOOQ[7+(n7+(nO!&oQMhO7+(nO%9xQ`O'#KaO%:TQ`O,5=lOOQO,5?h,5?hOOQO-E<z-E<zOOQ[7+(s7+(sO%;gQpO'#HZOOQ[1G3`1G3`O!&oQMhO1G3`O%[QlO1G3`O%;nQ`O1G3`O%;yQMhO1G3`O9qQ!0LrO1G3bO$$VQ`O1G3bO9[Q`O1G3bO!BqQpO1G3bO!ByQMhO1G3bO%<XQ`O'#JOO%<mQ`O,5@|O%<uQpO,5@|OOQ!0Lb1G3c1G3cOOQ[7+$V7+$VO@oQ`O7+$VO9qQ!0LrO7+$VO%=QQ`O7+$VO%[QlO1G6kO%[QlO1G6lO%=VQ!0LrO1G6kO%=aQlO1G3jO%=hQ`O1G3jO%=mQlO1G3jOOQ[7+)S7+)SO9qQ!0LrO7+)^O`QlO7+)`OOQ['#Kg'#KgOOQ['#JR'#JRO%=tQlO,5>_OOQ[,5>_,5>_O%[QlO'#HtO%>RQ`O'#HvOOQ[,5>e,5>eO9aQ`O,5>eOOQ[,5>g,5>gOOQ[7+)i7+)iOOQ[7+)o7+)oOOQ[7+)s7+)sOOQ[7+)u7+)uO%>WQpO1G5{O%>rQ?MtO1G0zO%>|Q`O1G0zOOQO1G/s1G/sO%?XQ?MtO1G/sO>}Q`O1G/sO!)PQlO'#DmOOQO,5?O,5?OOOQO-E<b-E<bOOQO,5?U,5?UOOQO-E<h-E<hO!BqQpO1G/sOOQO-E<d-E<dOOQ!0Ln1G0]1G0]OOQ!0Lf7+%u7+%uO#'oQ`O7+%uOOQ!0Lf7+&`7+&`O>}Q`O7+&`O!BqQpO7+&`OOQO7+%x7+%xO$@_Q!0MxO7+&XOOQO7+&X7+&XO%[QlO7+&XO%?cQ!0LrO7+&XO!BfQ!0LrO7+%xO!BqQpO7+%xO%?nQ!0LrO7+&XO%?|Q!0MxO7++qO%[QlO7++qO%@^Q`O7++pO%@^Q`O7++pOOQO1G4r1G4rO9aQ`O1G4rO%@fQ`O1G4rOOQS7+%}7+%}O#'oQ`O<<LPO4UQ!fO<<LPO%@tQ`O<<LPOOQ[<<LP<<LPO!&oQMhO<<LPO%[QlO<<LPO%@|Q`O<<LPO%AXQ!0MzO,5?`O%CdQ!0MzO,5?bO%EoQ!0MzO1G2`O%HQQ!0MzO1G2sO%J]Q!0MzO1G2uO%LhQ!fO,5?PO%[QlO,5?POOQO-E<c-E<cO%LrQ`O1G5|OOQ!0Lf<<JU<<JUO%LzQ?MtO1G0uO& RQ?MtO1G1PO& YQ?MtO1G1PO&#ZQ?MtO1G1PO&#bQ?MtO1G1PO&%cQ?MtO1G1PO&'dQ?MtO1G1PO&'kQ?MtO1G1PO&'rQ?MtO1G1PO&)sQ?MtO1G1PO&)zQ?MtO1G1PO&*RQ!0MxO<<JfO&+yQ?MtO1G1PO&,vQ?MvO1G1PO&-yQ?MvO'#JkO&0PQ?MtO1G1cO&0^Q?MtO1G0UO&0hQMjO,5?SOOQO-E<f-E<fO!)PQlO'#FqOOQO'#KY'#KYOOQO1G1u1G1uO&0rQ`O1G1tO&0wQ?MtO,5?ZOOOW7+'h7+'hOOOO1G/Z1G/ZO&1RQ!dO1G4wOOQ!0Lh7+(Q7+(QP!&oQMhO,5?]O!+xQMhO7+(cO&1YQ`O,5?[O9aQ`O,5?[OOQO-E<n-E<nO&1hQ`O1G6aO&1hQ`O1G6aO&1pQ`O1G6aO&1{QMjO7+'zO&2]Q!dO,5?^O&2gQ`O,5?^O!&oQMhO,5?^OOQO-E<p-E<pO&2lQ!dO1G6bO&2vQ`O1G6bO&3OQ`O1G2kO!&oQMhO1G2kOOQ!0Lb1G2i1G2iOOQ!0Lb1G2j1G2jO%3TQpO1G2iO!BqQpO1G2iOClQ`O1G2iOOQ!0Lb1G2q1G2qO&3TQpO1G2iO&3cQ`O1G2kO$){Q`O1G2jOClQ`O1G2jO$#jQlO1G2kO&3kQ`O1G2jO&4_QMjO,5?`OOQ!0Lh-E<s-E<sO&5QQMjO,5?bOOQ!0Lh-E<u-E<uO!+xQMhO7++[OOQ!0Lh1G/c1G/cO&5[Q`O1G/cOOQ!0Lh7+'u7+'uO&5aQMjO7+'|O&5qQMjO7++[O&5{QMjO7++[O&6YQ!0MxO<<KXOOQ!0Lf<<KX<<KXO&6|Q`O1G0zO!&oQMhO'#IyO&7RQ`O,5@wO&9TQ!fO<<LPO!&oQMhO1G2nO&9[Q!0LrO1G2nOOQ[<<G{<<G{O!BfQ!0LrO<<G{O&9mQ!0MxO<<I{OOQ!0Lf<<I{<<I{OOQO,5?k,5?kO&:aQ`O,5?kO&:fQ`O,5?kOOQO-E<}-E<}O&:tQ`O1G6jO&:tQ`O1G6jO9gQ`O1G6jO@oQ`O<<LlOOQ[<<Ll<<LlO&:|Q`O<<LlO9qQ!0LrO<<LlOOQ[<<LX<<LXO%9nQ!0MvO<<LXOOQ[<<LY<<LYO!DrQ`O<<LYO&;RQpO'#I{O&;^Q`O,5@{O!)PQlO,5@{OOQ[1G3W1G3WOOQO'#I}'#I}O9qQ!0LrO'#I}O&;fQpO,5=uOOQ[,5=u,5=uO&;mQpO'#EgO&;tQpO'#GeO&;yQ`O7+(zO&<OQ`O7+(zOOQ[7+(z7+(zO!&oQMhO7+(zO%[QlO7+(zO&<WQ`O7+(zOOQ[7+(|7+(|O9qQ!0LrO7+(|O$$VQ`O7+(|O9[Q`O7+(|O!BqQpO7+(|O&<cQ`O,5?jOOQO-E<|-E<|OOQO'#H^'#H^O&<nQ`O1G6hO9qQ!0LrO<<GqOOQ[<<Gq<<GqO@oQ`O<<GqO&<vQ`O7+,VO&<{Q`O7+,WO%[QlO7+,VO%[QlO7+,WOOQ[7+)U7+)UO&=QQ`O7+)UO&=VQlO7+)UO&=^Q`O7+)UOOQ[<<Lx<<LxOOQ[<<Lz<<LzOOQ[-E=P-E=POOQ[1G3y1G3yO&=cQ`O,5>`OOQ[,5>b,5>bO&=hQ`O1G4PO9aQ`O7+&fO!)PQlO7+&fOOQO7+%_7+%_O&=mQ?MtO1G6YO>}Q`O7+%_OOQ!0Lf<<Ia<<IaOOQ!0Lf<<Iz<<IzO>}Q`O<<IzOOQO<<Is<<IsO$@_Q!0MxO<<IsO%[QlO<<IsOOQO<<Id<<IdO!BfQ!0LrO<<IdO&=wQ!0LrO<<IsO&>SQ!0MxO<= ]O&>dQ`O<= [OOQO7+*^7+*^O9aQ`O7+*^OOQ[ANAkANAkO&>lQ!fOANAkO!&oQMhOANAkO#'oQ`OANAkO4UQ!fOANAkO&>sQ`OANAkO%[QlOANAkO&>{Q!0MzO7+'zO&A^Q!0MzO,5?`O&CiQ!0MzO,5?bO&EtQ!0MzO7+'|O&HVQ!fO1G4kO&HaQ?MtO7+&aO&JeQ?MvO,5=XO&LlQ?MvO,5=ZO&L|Q?MvO,5=XO&M^Q?MvO,5=ZO&MnQ?MvO,59uO' tQ?MvO,5<kO'#wQ?MvO,5<mO'&]Q?MvO,5<{O'(RQ?MtO7+'kO'(`Q?MtO7+'mO'(mQ`O,5<]OOQO7+'`7+'`OOQ!0Lh7+*c7+*cO'(rQMjO<<K}OOQO1G4v1G4vO'(yQ`O1G4vO')UQ`O1G4vO')dQ`O7++{O')dQ`O7++{O!&oQMhO1G4xO')lQ!dO1G4xO')vQ`O7++|O'*OQ`O7+(VO'*ZQ!dO7+(VOOQ!0Lb7+(T7+(TOOQ!0Lb7+(U7+(UO!BqQpO7+(TOClQ`O7+(TO'*eQ`O7+(VO!&oQMhO7+(VO$){Q`O7+(UO'*jQ`O7+(VOClQ`O7+(UO'*rQMjO<<NvOOQ!0Lh7+$}7+$}O!+xQMhO<<NvO'*|Q!dO,5?eOOQO-E<w-E<wO'+WQ!0MvO7+(YO!&oQMhO7+(YOOQ[AN=gAN=gO9gQ`O1G5VOOQO1G5V1G5VO'+hQ`O1G5VO'+mQ`O7+,UO'+mQ`O7+,UO9qQ!0LrOANBWO@oQ`OANBWOOQ[ANBWANBWOOQ[ANAsANAsOOQ[ANAtANAtO'+uQ`O,5?gOOQO-E<y-E<yO',QQ?MtO1G6gOOQO,5?i,5?iOOQO-E<{-E<{OOQ[1G3a1G3aO',[Q`O,5=POOQ[<<Lf<<LfO!&oQMhO<<LfO&;yQ`O<<LfO',aQ`O<<LfO%[QlO<<LfOOQ[<<Lh<<LhO9qQ!0LrO<<LhO$$VQ`O<<LhO9[Q`O<<LhO',iQpO1G5UO',tQ`O7+,SOOQ[AN=]AN=]O9qQ!0LrOAN=]OOQ[<= q<= qOOQ[<= r<= rO',|Q`O<= qO'-RQ`O<= rOOQ[<<Lp<<LpO'-WQ`O<<LpO'-]QlO<<LpOOQ[1G3z1G3zO>}Q`O7+)kO'-dQ`O<<JQO'-oQ?MtO<<JQOOQO<<Hy<<HyOOQ!0LfAN?fAN?fOOQOAN?_AN?_O$@_Q!0MxOAN?_OOQOAN?OAN?OO%[QlOAN?_OOQO<<Mx<<MxOOQ[G27VG27VO!&oQMhOG27VO#'oQ`OG27VO'-yQ!fOG27VO4UQ!fOG27VO'.QQ`OG27VO'.YQ?MtO<<JfO'.gQ?MvO1G2`O'0]Q?MvO,5?`O'2`Q?MvO,5?bO'4cQ?MvO1G2sO'6fQ?MvO1G2uO'8iQ?MtO<<KXO'8vQ?MtO<<I{OOQO1G1w1G1wO!+xQMhOANAiOOQO7+*b7+*bO'9TQ`O7+*bO'9`Q`O<= gO'9hQ!dO7+*dOOQ!0Lb<<Kq<<KqO$){Q`O<<KqOClQ`O<<KqO'9rQ`O<<KqO!&oQMhO<<KqOOQ!0Lb<<Ko<<KoO!BqQpO<<KoO'9}Q!dO<<KqOOQ!0Lb<<Kp<<KpO':XQ`O<<KqO!&oQMhO<<KqO$){Q`O<<KpO':^QMjOANDbO':hQ!0MvO<<KtOOQO7+*q7+*qO9gQ`O7+*qO':xQ`O<= pOOQ[G27rG27rO9qQ!0LrOG27rO!)PQlO1G5RO';QQ`O7+,RO';YQ`O1G2kO&;yQ`OANBQOOQ[ANBQANBQO!&oQMhOANBQO';_Q`OANBQOOQ[ANBSANBSO9qQ!0LrOANBSO$$VQ`OANBSOOQO'#H_'#H_OOQO7+*p7+*pOOQ[G22wG22wOOQ[ANE]ANE]OOQ[ANE^ANE^OOQ[ANB[ANB[O';gQ`OANB[OOQ[<<MV<<MVO!)PQlOAN?lOOQOG24yG24yO$@_Q!0MxOG24yO#'oQ`OLD,qOOQ[LD,qLD,qO!&oQMhOLD,qO';lQ!fOLD,qO';sQ?MvO7+'zO'=iQ?MvO,5?`O'?lQ?MvO,5?bO'AoQ?MvO7+'|O'CeQMjOG27TOOQO<<M|<<M|OOQ!0LbANA]ANA]O$){Q`OANA]OClQ`OANA]O'CuQ!dOANA]OOQ!0LbANAZANAZO'C|Q`OANA]O!&oQMhOANA]O'DXQ!dOANA]OOQ!0LbANA[ANA[OOQO<<N]<<N]OOQ[LD-^LD-^O'DcQ?MtO7+*mOOQO'#Gf'#GfOOQ[G27lG27lO&;yQ`OG27lO!&oQMhOG27lOOQ[G27nG27nO9qQ!0LrOG27nOOQ[G27vG27vO'DmQ?MtOG25WOOQOLD*eLD*eOOQ[!$(!]!$(!]O#'oQ`O!$(!]O!&oQMhO!$(!]O'DwQ!0MzOG27TOOQ!0LbG26wG26wO$){Q`OG26wO'GYQ`OG26wOClQ`OG26wO'GeQ!dOG26wO!&oQMhOG26wOOQ[LD-WLD-WO&;yQ`OLD-WOOQ[LD-YLD-YOOQ[!)9Ew!)9EwO#'oQ`O!)9EwOOQ!0LbLD,cLD,cO$){Q`OLD,cOClQ`OLD,cO'GlQ`OLD,cO'GwQ!dOLD,cOOQ[!$(!r!$(!rOOQ[!.K;c!.K;cO'HOQ?MvOG27TOOQ!0Lb!$( }!$( }O$){Q`O!$( }OClQ`O!$( }O'ItQ`O!$( }OOQ!0Lb!)9Ei!)9EiO$){Q`O!)9EiOClQ`O!)9EiOOQ!0Lb!.K;T!.K;TO$){Q`O!.K;TOOQ!0Lb!4/0o!4/0oO!)PQlO'#DzO1PQ`O'#EXO'JPQ!fO'#JqO'JWQ!L^O'#DvO'J_QlO'#EOO'JfQ!fO'#CiO'L|Q!fO'#CiO!)PQlO'#EQO'M^QlO,5;ZO!)PQlO,5;eO!)PQlO,5;eO!)PQlO,5;eO!)PQlO,5;eO!)PQlO,5;eO!)PQlO,5;eO!)PQlO,5;eO!)PQlO,5;eO!)PQlO,5;eO!)PQlO,5;eO!)PQlO'#IoO( aQ`O,5<iO!)PQlO,5;eO( iQMhO,5;eO(#SQMhO,5;eO!)PQlO,5;wO!&oQMhO'#GmO( iQMhO'#GmO!&oQMhO'#GoO( iQMhO'#GoO1SQ`O'#DZO1SQ`O'#DZO!&oQMhO'#GPO( iQMhO'#GPO!&oQMhO'#GRO( iQMhO'#GRO!&oQMhO'#GaO( iQMhO'#GaO!)PQlO,5:jO(#ZQpO'#D_O(#eQpO'#JuO!)PQlO,5@nO'M^QlO1G0uO(#oQ?MtO'#CiO!)PQlO1G2PO!&oQMhO'#ItO( iQMhO'#ItO!&oQMhO'#IvO( iQMhO'#IvO(#yQ!dO'#CrO!&oQMhO,5<tO( iQMhO,5<tO'M^QlO1G2RO!)PQlO7+&zO!&oQMhO1G2`O( iQMhO1G2`O!&oQMhO'#ItO( iQMhO'#ItO!&oQMhO'#IvO( iQMhO'#IvO!&oQMhO1G2bO( iQMhO1G2bO'M^QlO7+'mO'M^QlO7+&aO!&oQMhOANAiO( iQMhOANAiO($^Q`O'#EoO($cQ`O'#EoO($kQ`O'#F]O($pQ`O'#EyO($uQ`O'#KSO(%QQ`O'#KQO(%]Q`O,5;ZO(%bQMjO,5<eO(%iQ`O'#GYO(%nQ`O'#GYO(%sQ`O,5<gO(%{Q`O,5;ZO(&TQ?MtO1G1`O(&[Q`O,5<tO(&aQ`O,5<tO(&fQ`O,5<vO(&kQ`O,5<vO(&pQ`O1G2RO(&uQ`O1G0uO(&zQMjO<<K}O('RQMjO<<K}O7eQMhO'#F|O9[Q`O'#F{OAjQ`O'#EnO!)PQlO,5;tO!3dQ`O'#GYO!3dQ`O'#GYO!3dQ`O'#G[O!3dQ`O'#G[O!+xQMhO7+(cO!+xQMhO7+(cO%-mQ!dO1G2wO%-mQ!dO1G2wO!&oQMhO,5=]O!&oQMhO,5=]",
  stateData: "((X~O'{OS'|OSTOS'}RQ~OPYOQYOSfOY!VOaqOdzOeyOl!POpkOrYOskOtkOzkO|YO!OYO!SWO!WkO!XkO!_XO!iuO!lZO!oYO!pYO!qYO!svO!uwO!xxO!|]O$W|O$niO%h}O%j!QO%l!OO%m!OO%n!OO%q!RO%s!SO%v!TO%w!TO%y!UO&V!WO&]!XO&_!YO&a!ZO&c![O&f!]O&l!^O&r!_O&t!`O&v!aO&x!bO&z!cO(SSO(UTO(XUO(`VO(n[O~OWtO~P`OPYOQYOSfOd!jOe!iOpkOrYOskOtkOzkO|YO!OYO!SWO!WkO!XkO!_!eO!iuO!lZO!oYO!pYO!qYO!svO!u!gO!x!hO$W!kO$niO(S!dO(UTO(XUO(`VO(n[O~Oa!wOs!nO!S!oO!b!yO!c!vO!d!vO!|;wO#T!pO#U!pO#V!xO#W!pO#X!pO#[!zO#]!zO(T!lO(UTO(XUO(d!mO(n!sO~O'}!{O~OP]XR]X[]Xa]Xj]Xr]X!Q]X!S]X!]]X!l]X!p]X#R]X#S]X#`]X#kfX#n]X#o]X#p]X#q]X#r]X#s]X#t]X#u]X#v]X#x]X#z]X#{]X$Q]X'y]X(`]X(q]X(x]X(y]X~O!g%RX~P(qO_!}O(U#PO(V!}O(W#PO~O_#QO(W#PO(X#PO(Y#QO~Ox#SO!U#TO(a#TO(b#VO~OPYOQYOSfOd!jOe!iOpkOrYOskOtkOzkO|YO!OYO!SWO!WkO!XkO!_!eO!iuO!lZO!oYO!pYO!qYO!svO!u!gO!x!hO$W!kO$niO(S;{O(UTO(XUO(`VO(n[O~O![#ZO!]#WO!Y(gP!Y(uP~P+}O!^#cO~P`OPYOQYOSfOd!jOe!iOrYOskOtkOzkO|YO!OYO!SWO!WkO!XkO!_!eO!iuO!lZO!oYO!pYO!qYO!svO!u!gO!x!hO$W!kO$niO(UTO(XUO(`VO(n[O~Op#mO![#iO!|]O#i#lO#j#iO(S;|O!k(rP~P.iO!l#oO(S#nO~O!x#sO!|]O%h#tO~O#k#uO~O!g#vO#k#uO~OP$[OR#zO[$cOj$ROr$aO!Q#yO!S#{O!]$_O!l#xO!p$[O#R$RO#n$OO#o$PO#p$PO#q$PO#r$QO#s$RO#t$RO#u$bO#v$SO#x$UO#z$WO#{$XO(`VO(q$YO(x#|O(y#}O~Oa(eX'y(eX'v(eX!k(eX!Y(eX!_(eX%i(eX!g(eX~P1qO#S$dO#`$eO$Q$eOP(fXR(fX[(fXj(fXr(fX!Q(fX!S(fX!](fX!l(fX!p(fX#R(fX#n(fX#o(fX#p(fX#q(fX#r(fX#s(fX#t(fX#u(fX#v(fX#x(fX#z(fX#{(fX(`(fX(q(fX(x(fX(y(fX!_(fX%i(fX~Oa(fX'y(fX'v(fX!Y(fX!k(fXv(fX!g(fX~P4UO#`$eO~O$]$hO$_$gO$f$mO~OSfO!_$nO$i$oO$k$qO~Oh%VOj%cOk%cOl%cOp%WOr%XOs$tOt$tOz%YO|%ZO!O%[O!S${O!_$|O!i%aO!l$xO#j%bO$W%_O$t%]O$v%^O$y%`O(S$sO(UTO(XUO(`$uO(x$}O(y%POg(]P~O!l%dO~O!S%gO!_%hO(S%fO~O!g%lO~Oa%mO'y%mO~O!Q%qO~P%[O(T!lO~P%[O%n%uO~P%[Oh%VO!l%dO(S%fO(T!lO~Oe%|O!l%dO(S%fO~Oj$RO~O!Q&RO!_&OO!l&QO%j&UO(S%fO(T!lO(UTO(XUO`)VP~O!x#sO~O%s&WO!S)RX!_)RX(S)RX~O(S&XO~Ol!PO!u&^O%j!QO%l!OO%m!OO%n!OO%q!RO%s!SO%v!TO%w!TO~Od&cOe&bO!x&`O%h&aO%{&_O~P<VOd&fOeyOl!PO!_&eO!u&^O!xxO!|]O%h}O%l!OO%m!OO%n!OO%q!RO%s!SO%v!TO%w!TO%y!UO~Ob&iO#`&lO%j&gO(T!lO~P=[O!l&mO!u&qO~O!l#oO~O!_XO~Oa%mO'w&yO'y%mO~Oa%mO'w&|O'y%mO~Oa%mO'w'OO'y%mO~O'v]X!Y]Xv]X!k]X&Z]X!_]X%i]X!g]X~P(qO!b']O!c'UO!d'UO(T!lO(UTO(XUO~Os'SO!S'RO!['VO(d'QO!^(hP!^(wP~P@cOn'`O!_'^O(S%fO~Oe'eO!l%dO(S%fO~O!Q&RO!l&QO~Os!nO!S!oO!|;wO#T!pO#U!pO#W!pO#X!pO(T!lO(UTO(XUO(d!mO(n!sO~O!b'kO!c'jO!d'jO#V!pO#['lO#]'lO~PA}Oa%mOh%VO!g#vO!l%dO'y%mO(q'nO~O!p'rO#`'pO~PC]Os!nO!S!oO(UTO(XUO(d!mO(n!sO~O!_XOs(lX!S(lX!b(lX!c(lX!d(lX!|(lX#T(lX#U(lX#V(lX#W(lX#X(lX#[(lX#](lX(T(lX(U(lX(X(lX(d(lX(n(lX~O!c'jO!d'jO(T!lO~PC{O(O'vO(P'vO(Q'xO~O_!}O(U'zO(V!}O(W'zO~O_#QO(W'zO(X'zO(Y#QO~Ov'|O~P%[Ox#SO!U#TO(a#TO(b(PO~O![(RO!Y'VX!Y']X!]'VX!]']X~P+}O!](TO!Y(gX~OP$[OR#zO[$cOj$ROr$aO!Q#yO!S#{O!](TO!l#xO!p$[O#R$RO#n$OO#o$PO#p$PO#q$PO#r$QO#s$RO#t$RO#u$bO#v$SO#x$UO#z$WO#{$XO(`VO(q$YO(x#|O(y#}O~O!Y(gX~PGvO!Y(YO~O!Y(tX!](tX!g(tX!k(tX(q(tX~O#`(tX#k#dX!^(tX~PIyO#`(ZO!Y(vX!](vX~O!]([O!Y(uX~O!Y(_O~O#`$eO~PIyO!^(`O~P`OR#zO!Q#yO!S#{O!l#xO(`VOP!na[!naj!nar!na!]!na!p!na#R!na#n!na#o!na#p!na#q!na#r!na#s!na#t!na#u!na#v!na#x!na#z!na#{!na(q!na(x!na(y!na~Oa!na'y!na'v!na!Y!na!k!nav!na!_!na%i!na!g!na~PKaO!k(aO~O!g#vO#`(bO(q'nO!](sXa(sX'y(sX~O!k(sX~PM|O!S%gO!_%hO!|]O#i(gO#j(fO(S%fO~O!](hO!k(rX~O!k(jO~O!S%gO!_%hO#j(fO(S%fO~OP(fXR(fX[(fXj(fXr(fX!Q(fX!S(fX!](fX!l(fX!p(fX#R(fX#n(fX#o(fX#p(fX#q(fX#r(fX#s(fX#t(fX#u(fX#v(fX#x(fX#z(fX#{(fX(`(fX(q(fX(x(fX(y(fX~O!g#vO!k(fX~P! jOR(lO!Q(kO!l#xO#S$dO!|!{a!S!{a~O!x!{a%h!{a!_!{a#i!{a#j!{a(S!{a~P!#kO!x(pO~OPYOQYOSfOd!jOe!iOpkOrYOskOtkOzkO|YO!OYO!SWO!WkO!XkO!_XO!iuO!lZO!oYO!pYO!qYO!svO!u!gO!x!hO$W!kO$niO(S!dO(UTO(XUO(`VO(n[O~Oh%VOp%WOr%XOs$tOt$tOz%YO|%ZO!O<eO!S${O!_$|O!i=vO!l$xO#j<kO$W%_O$t<gO$v<iO$y%`O(S(tO(UTO(XUO(`$uO(x$}O(y%PO~O#k(vO~O![(xO!k(jP~P%[O(d(zO(n[O~O!S(|O!l#xO(d(zO(n[O~OP;vOQ;vOSfOd=rOe!iOpkOr;vOskOtkOzkO|;vO!O;vO!SWO!WkO!XkO!_!eO!i;yO!lZO!o;vO!p;vO!q;vO!s;zO!u;}O!x!hO$W!kO$n=pO(S)ZO(UTO(XUO(`VO(n[O~O!]$_Oa$qa'y$qa'v$qa!k$qa!Y$qa!_$qa%i$qa!g$qa~Ol)bO~P!&oOh%VOp%WOr%XOs$tOt$tOz%YO|%ZO!O%[O!S${O!_$|O!i%aO!l$xO#j%bO$W%_O$t%]O$v%^O$y%`O(S(tO(UTO(XUO(`$uO(x$}O(y%PO~Og(oP~P!+xO!Q)gO!g)fO!_$^X$Z$^X$]$^X$_$^X$f$^X~O!g)fO!_(zX$Z(zX$](zX$_(zX$f(zX~O!Q)gO~P!.RO!Q)gO!_(zX$Z(zX$](zX$_(zX$f(zX~O!_)iO$Z)mO$])hO$_)hO$f)nO~O![)qO~P!)PO$]$hO$_$gO$f)uO~On$zX!Q$zX#S$zX'x$zX(x$zX(y$zX~OgmXg$zXnmX!]mX#`mX~P!/wOx)wO(a)xO(b)zO~On*TO!Q)|O'x)}O(x$}O(y%PO~Og){O~P!0{Og*UO~Oh%VOp%WOr%XOs$tOt$tOz%YO|%ZO!O<eO!S*WO!_*XO!i=vO!l$xO#j<kO$W%_O$t<gO$v<iO$y%`O(UTO(XUO(`$uO(x$}O(y%PO~O![*[O(S*VO!k(}P~P!1jO#k*^O~O!l*_O~Oh%VOp%WOr%XOs$tOt$tOz%YO|%ZO!O<eO!S${O!_$|O!i=vO!l$xO#j<kO$W%_O$t<gO$v<iO$y%`O(S*aO(UTO(XUO(`$uO(x$}O(y%PO~O![*dO!Y)OP~P!3iOr*pOs!nO!S*fO!b*nO!c*hO!d*hO!l*_O#[*oO%`*jO(T!lO(UTO(XUO(d!mO~O!^*mO~P!5^O#S$dOn(_X!Q(_X'x(_X(x(_X(y(_X!](_X#`(_X~Og(_X$O(_X~P!6`On*uO#`*tOg(^X!](^X~O!]*vOg(]X~Oj%cOk%cOl%cO(S&XOg(]P~Os*yO~O!l+OO~O(S(tO~Op+TO!S%gO![#iO!_%hO!|]O#i#lO#j#iO(S%fO!k(rP~O!g#vO#k+UO~O!S%gO![+WO!]([O!_%hO(S%fO!Y(uP~Os'YO!S+YO![+XO(UTO(XUO(d(zO~O!^(wP~P!9iO!]+ZOa)SX'y)SX~OP$[OR#zO[$cOj$ROr$aO!Q#yO!S#{O!l#xO!p$[O#R$RO#n$OO#o$PO#p$PO#q$PO#r$QO#s$RO#t$RO#u$bO#v$SO#x$UO#z$WO#{$XO(`VO(q$YO(x#|O(y#}O~Oa!ja!]!ja'y!ja'v!ja!Y!ja!k!jav!ja!_!ja%i!ja!g!ja~P!:aOR#zO!Q#yO!S#{O!l#xO(`VOP!ra[!raj!rar!ra!]!ra!p!ra#R!ra#n!ra#o!ra#p!ra#q!ra#r!ra#s!ra#t!ra#u!ra#v!ra#x!ra#z!ra#{!ra(q!ra(x!ra(y!ra~Oa!ra'y!ra'v!ra!Y!ra!k!rav!ra!_!ra%i!ra!g!ra~P!<wOR#zO!Q#yO!S#{O!l#xO(`VOP!ta[!taj!tar!ta!]!ta!p!ta#R!ta#n!ta#o!ta#p!ta#q!ta#r!ta#s!ta#t!ta#u!ta#v!ta#x!ta#z!ta#{!ta(q!ta(x!ta(y!ta~Oa!ta'y!ta'v!ta!Y!ta!k!tav!ta!_!ta%i!ta!g!ta~P!?_Oh%VOn+dO!_'^O%i+cO~O!g+fOa([X!_([X'y([X!]([X~Oa%mO!_XO'y%mO~Oh%VO!l%dO~Oh%VO!l%dO(S%fO~O!g#vO#k(vO~Ob+qO%j+rO(S+nO(UTO(XUO!^)WP~O!]+sO`)VX~O[+wO~O`+xO~O!_&OO(S%fO(T!lO`)VP~Oh%VO#`+}O~Oh%VOn,QO!_$|O~O!_,SO~O!Q,UO!_XO~O%n%uO~O!x,ZO~Oe,`O~Ob,aO(S#nO(UTO(XUO!^)UP~Oe%|O~O%j!QO(S&XO~P=[O[,fO`,eO~OPYOQYOSfOdzOeyOpkOrYOskOtkOzkO|YO!OYO!SWO!WkO!XkO!iuO!lZO!oYO!pYO!qYO!svO!xxO!|]O$niO%h}O(UTO(XUO(`VO(n[O~O!_!eO!u!gO$W!kO(S!dO~P!F_O`,eOa%mO'y%mO~OPYOQYOSfOd!jOe!iOpkOrYOskOtkOzkO|YO!OYO!SWO!WkO!XkO!_!eO!iuO!lZO!oYO!pYO!qYO!svO!x!hO$W!kO$niO(S!dO(UTO(XUO(`VO(n[O~Oa,kOl!OO!uwO%l!OO%m!OO%n!OO~P!HwO!l&mO~O&],qO~O!_,sO~O&n,uO&p,vOP&kaQ&kaS&kaY&kaa&kad&kae&kal&kap&kar&kas&kat&kaz&ka|&ka!O&ka!S&ka!W&ka!X&ka!_&ka!i&ka!l&ka!o&ka!p&ka!q&ka!s&ka!u&ka!x&ka!|&ka$W&ka$n&ka%h&ka%j&ka%l&ka%m&ka%n&ka%q&ka%s&ka%v&ka%w&ka%y&ka&V&ka&]&ka&_&ka&a&ka&c&ka&f&ka&l&ka&r&ka&t&ka&v&ka&x&ka&z&ka'v&ka(S&ka(U&ka(X&ka(`&ka(n&ka!^&ka&d&kab&ka&i&ka~O(S,{O~Oh!eX!]!RX!^!RX!g!RX!g!eX!l!eX#`!RX~O!]!eX!^!eX~P# }O!g-QO#`-POh(iX!]#hX!^#hX!g(iX!l(iX~O!](iX!^(iX~P#!pOh%VO!g-SO!l%dO!]!aX!^!aX~Os!nO!S!oO(UTO(XUO(d!mO~OP;vOQ;vOSfOd=rOe!iOpkOr;vOskOtkOzkO|;vO!O;vO!SWO!WkO!XkO!_!eO!i;yO!lZO!o;vO!p;vO!q;vO!s;zO!u;}O!x!hO$W!kO$n=pO(UTO(XUO(`VO(n[O~O(S<rO~P#$VO!]-WO!^(hX~O!^-YO~O!g-QO#`-PO!]#hX!^#hX~O!]-ZO!^(wX~O!^-]O~O!c-^O!d-^O(T!lO~P##tO!^-aO~P'_On-dO!_'^O~O!Y-iO~Os!{a!b!{a!c!{a!d!{a#T!{a#U!{a#V!{a#W!{a#X!{a#[!{a#]!{a(T!{a(U!{a(X!{a(d!{a(n!{a~P!#kO!p-nO#`-lO~PC]O!c-pO!d-pO(T!lO~PC{Oa%mO#`-lO'y%mO~Oa%mO!g#vO#`-lO'y%mO~Oa%mO!g#vO!p-nO#`-lO'y%mO(q'nO~O(O'vO(P'vO(Q-uO~Ov-vO~O!Y'Va!]'Va~P!:aO![-zO!Y'VX!]'VX~P%[O!](TO!Y(ga~O!Y(ga~PGvO!]([O!Y(ua~O!S%gO![.OO!_%hO(S%fO!Y']X!]']X~O#`.QO!](sa!k(saa(sa'y(sa~O!g#vO~P#,]O!](hO!k(ra~O!S%gO!_%hO#j.UO(S%fO~Op.ZO!S%gO![.WO!_%hO!|]O#i.YO#j.WO(S%fO!]'`X!k'`X~OR._O!l#xO~Oh%VOn.bO!_'^O%i.aO~Oa#ci!]#ci'y#ci'v#ci!Y#ci!k#civ#ci!_#ci%i#ci!g#ci~P!:aOn=|O!Q)|O'x)}O(x$}O(y%PO~O#k#_aa#_a#`#_a'y#_a!]#_a!k#_a!_#_a!Y#_a~P#/XO#k(_XP(_XR(_X[(_Xa(_Xj(_Xr(_X!S(_X!l(_X!p(_X#R(_X#n(_X#o(_X#p(_X#q(_X#r(_X#s(_X#t(_X#u(_X#v(_X#x(_X#z(_X#{(_X'y(_X(`(_X(q(_X!k(_X!Y(_X'v(_Xv(_X!_(_X%i(_X!g(_X~P!6`O!].oO!k(jX~P!:aO!k.rO~O!Y.tO~OP$[OR#zO!Q#yO!S#{O!l#xO!p$[O(`VO[#mia#mij#mir#mi!]#mi#R#mi#o#mi#p#mi#q#mi#r#mi#s#mi#t#mi#u#mi#v#mi#x#mi#z#mi#{#mi'y#mi(q#mi(x#mi(y#mi'v#mi!Y#mi!k#miv#mi!_#mi%i#mi!g#mi~O#n#mi~P#2wO#n$OO~P#2wOP$[OR#zOr$aO!Q#yO!S#{O!l#xO!p$[O#n$OO#o$PO#p$PO#q$PO(`VO[#mia#mij#mi!]#mi#R#mi#s#mi#t#mi#u#mi#v#mi#x#mi#z#mi#{#mi'y#mi(q#mi(x#mi(y#mi'v#mi!Y#mi!k#miv#mi!_#mi%i#mi!g#mi~O#r#mi~P#5fO#r$QO~P#5fOP$[OR#zO[$cOj$ROr$aO!Q#yO!S#{O!l#xO!p$[O#R$RO#n$OO#o$PO#p$PO#q$PO#r$QO#s$RO#t$RO#u$bO(`VOa#mi!]#mi#x#mi#z#mi#{#mi'y#mi(q#mi(x#mi(y#mi'v#mi!Y#mi!k#miv#mi!_#mi%i#mi!g#mi~O#v#mi~P#8TOP$[OR#zO[$cOj$ROr$aO!Q#yO!S#{O!l#xO!p$[O#R$RO#n$OO#o$PO#p$PO#q$PO#r$QO#s$RO#t$RO#u$bO#v$SO(`VO(y#}Oa#mi!]#mi#z#mi#{#mi'y#mi(q#mi(x#mi'v#mi!Y#mi!k#miv#mi!_#mi%i#mi!g#mi~O#x$UO~P#:kO#x#mi~P#:kO#v$SO~P#8TOP$[OR#zO[$cOj$ROr$aO!Q#yO!S#{O!l#xO!p$[O#R$RO#n$OO#o$PO#p$PO#q$PO#r$QO#s$RO#t$RO#u$bO#v$SO#x$UO(`VO(x#|O(y#}Oa#mi!]#mi#{#mi'y#mi(q#mi'v#mi!Y#mi!k#miv#mi!_#mi%i#mi!g#mi~O#z#mi~P#=aO#z$WO~P#=aOP]XR]X[]Xj]Xr]X!Q]X!S]X!l]X!p]X#R]X#S]X#`]X#kfX#n]X#o]X#p]X#q]X#r]X#s]X#t]X#u]X#v]X#x]X#z]X#{]X$Q]X(`]X(q]X(x]X(y]X!]]X!^]X~O$O]X~P#@OOP$[OR#zO[<_Oj<SOr<]O!Q#yO!S#{O!l#xO!p$[O#R<SO#n<PO#o<QO#p<QO#q<QO#r<RO#s<SO#t<SO#u<^O#v<TO#x<VO#z<XO#{<YO(`VO(q$YO(x#|O(y#}O~O$O.vO~P#B]O#S$dO#`<`O$Q<`O$O(fX!^(fX~P! jOa'ca!]'ca'y'ca'v'ca!k'ca!Y'cav'ca!_'ca%i'ca!g'ca~P!:aO[#mia#mij#mir#mi!]#mi#R#mi#r#mi#s#mi#t#mi#u#mi#v#mi#x#mi#z#mi#{#mi'y#mi(q#mi'v#mi!Y#mi!k#miv#mi!_#mi%i#mi!g#mi~OP$[OR#zO!Q#yO!S#{O!l#xO!p$[O#n$OO#o$PO#p$PO#q$PO(`VO(x#mi(y#mi~P#E_On=|O!Q)|O'x)}O(x$}O(y%POP#miR#mi!S#mi!l#mi!p#mi#n#mi#o#mi#p#mi#q#mi(`#mi~P#E_O!].zOg(oX~P!0{Og.|O~Oa$Pi!]$Pi'y$Pi'v$Pi!Y$Pi!k$Piv$Pi!_$Pi%i$Pi!g$Pi~P!:aO$].}O$_.}O~O$]/OO$_/OO~O!g)fO#`/PO!_$cX$Z$cX$]$cX$_$cX$f$cX~O![/QO~O!_)iO$Z/SO$])hO$_)hO$f/TO~O!]<ZO!^(eX~P#B]O!^/UO~O!g)fO$f(zX~O$f/WO~Ov/XO~P!&oOx)wO(a)xO(b/[O~O!S/_O~O(x$}On%aa!Q%aa'x%aa(y%aa!]%aa#`%aa~Og%aa$O%aa~P#LaO(y%POn%ca!Q%ca'x%ca(x%ca!]%ca#`%ca~Og%ca$O%ca~P#MSO!]fX!gfX!kfX!k$zX(qfX~P!/wO![/hO!]([O(S/gO!Y(uP!Y)OP~P!1jOr*pO!b*nO!c*hO!d*hO!l*_O#[*oO%`*jO(T!lO(UTO(XUO~Os<oO!S/iO![+XO!^*mO(d<nO!^(wP~P#NmO!k/jO~P#/XO!]/kO!g#vO(q'nO!k(}X~O!k/pO~O!S%gO![*[O!_%hO(S%fO!k(}P~O#k/rO~O!Y$zX!]$zX!g%RX~P!/wO!]/sO!Y)OX~P#/XO!g/uO~O!Y/wO~OpkO(S/xO~P.iOh%VOr/}O!g#vO!l%dO(q'nO~O!g+fO~Oa%mO!]0RO'y%mO~O!^0TO~P!5^O!c0UO!d0UO(T!lO~P##tOs!nO!S0VO(UTO(XUO(d!mO~O#[0XO~Og%aa!]%aa#`%aa$O%aa~P!0{Og%ca!]%ca#`%ca$O%ca~P!0{Oj%cOk%cOl%cO(S&XOg'lX!]'lX~O!]*vOg(]a~Og0bO~OR0cO!Q0cO!S0dO#S$dOn}a'x}a(x}a(y}a!]}a#`}a~Og}a$O}a~P$&vO!Q)|O'x)}On$sa(x$sa(y$sa!]$sa#`$sa~Og$sa$O$sa~P$'rO!Q)|O'x)}On$ua(x$ua(y$ua!]$ua#`$ua~Og$ua$O$ua~P$(eO#k0gO~Og%Ta!]%Ta#`%Ta$O%Ta~P!0{On0iO#`0hOg(^a!](^a~O!g#vO~O#k0lO~O!]+ZOa)Sa'y)Sa~OR#zO!Q#yO!S#{O!l#xO(`VOP!ri[!rij!rir!ri!]!ri!p!ri#R!ri#n!ri#o!ri#p!ri#q!ri#r!ri#s!ri#t!ri#u!ri#v!ri#x!ri#z!ri#{!ri(q!ri(x!ri(y!ri~Oa!ri'y!ri'v!ri!Y!ri!k!riv!ri!_!ri%i!ri!g!ri~P$*bOh%VOr%XOs$tOt$tOz%YO|%ZO!O<eO!S${O!_$|O!i=vO!l$xO#j<kO$W%_O$t<gO$v<iO$y%`O(UTO(XUO(`$uO(x$}O(y%PO~Op0uO%]0vO(S0tO~P$,xO!g+fOa([a!_([a'y([a!]([a~O#k0|O~O[]X!]fX!^fX~O!]0}O!^)WX~O!^1PO~O[1QO~Ob1SO(S+nO(UTO(XUO~O!_&OO(S%fO`'tX!]'tX~O!]+sO`)Va~O!k1VO~P!:aO[1YO~O`1ZO~O#`1^O~On1aO!_$|O~O(d(zO!^)TP~Oh%VOn1jO!_1gO%i1iO~O[1tO!]1rO!^)UX~O!^1uO~O`1wOa%mO'y%mO~O(S#nO(UTO(XUO~O#S$dO#`$eO$Q$eOP(fXR(fX[(fXr(fX!Q(fX!S(fX!](fX!l(fX!p(fX#R(fX#n(fX#o(fX#p(fX#q(fX#r(fX#s(fX#t(fX#u(fX#v(fX#x(fX#z(fX#{(fX(`(fX(q(fX(x(fX(y(fX~Oj1zO&Z1{Oa(fX~P$2cOj1zO#`$eO&Z1{O~Oa1}O~P%[Oa2PO~O&d2SOP&biQ&biS&biY&bia&bid&bie&bil&bip&bir&bis&bit&biz&bi|&bi!O&bi!S&bi!W&bi!X&bi!_&bi!i&bi!l&bi!o&bi!p&bi!q&bi!s&bi!u&bi!x&bi!|&bi$W&bi$n&bi%h&bi%j&bi%l&bi%m&bi%n&bi%q&bi%s&bi%v&bi%w&bi%y&bi&V&bi&]&bi&_&bi&a&bi&c&bi&f&bi&l&bi&r&bi&t&bi&v&bi&x&bi&z&bi'v&bi(S&bi(U&bi(X&bi(`&bi(n&bi!^&bib&bi&i&bi~Ob2YO!^2WO&i2XO~P`O!_XO!l2[O~O&p,vOP&kiQ&kiS&kiY&kia&kid&kie&kil&kip&kir&kis&kit&kiz&ki|&ki!O&ki!S&ki!W&ki!X&ki!_&ki!i&ki!l&ki!o&ki!p&ki!q&ki!s&ki!u&ki!x&ki!|&ki$W&ki$n&ki%h&ki%j&ki%l&ki%m&ki%n&ki%q&ki%s&ki%v&ki%w&ki%y&ki&V&ki&]&ki&_&ki&a&ki&c&ki&f&ki&l&ki&r&ki&t&ki&v&ki&x&ki&z&ki'v&ki(S&ki(U&ki(X&ki(`&ki(n&ki!^&ki&d&kib&ki&i&ki~O!Y2bO~O!]!aa!^!aa~P#B]Os!nO!S!oO![2hO(d!mO!]'WX!^'WX~P@cO!]-WO!^(ha~O!]'^X!^'^X~P!9iO!]-ZO!^(wa~O!^2oO~P'_Oa%mO#`2xO'y%mO~Oa%mO!g#vO#`2xO'y%mO~Oa%mO!g#vO!p2|O#`2xO'y%mO(q'nO~Oa%mO'y%mO~P!:aO!]$_Ov$qa~O!Y'Vi!]'Vi~P!:aO!](TO!Y(gi~O!]([O!Y(ui~O!Y(vi!](vi~P!:aO!](si!k(sia(si'y(si~P!:aO#`3OO!](si!k(sia(si'y(si~O!](hO!k(ri~O!S%gO!_%hO!|]O#i3TO#j3SO(S%fO~O!S%gO!_%hO#j3SO(S%fO~On3[O!_'^O%i3ZO~Oh%VOn3[O!_'^O%i3ZO~O#k%aaP%aaR%aa[%aaa%aaj%aar%aa!S%aa!l%aa!p%aa#R%aa#n%aa#o%aa#p%aa#q%aa#r%aa#s%aa#t%aa#u%aa#v%aa#x%aa#z%aa#{%aa'y%aa(`%aa(q%aa!k%aa!Y%aa'v%aav%aa!_%aa%i%aa!g%aa~P#LaO#k%caP%caR%ca[%caa%caj%car%ca!S%ca!l%ca!p%ca#R%ca#n%ca#o%ca#p%ca#q%ca#r%ca#s%ca#t%ca#u%ca#v%ca#x%ca#z%ca#{%ca'y%ca(`%ca(q%ca!k%ca!Y%ca'v%cav%ca!_%ca%i%ca!g%ca~P#MSO#k%aaP%aaR%aa[%aaa%aaj%aar%aa!S%aa!]%aa!l%aa!p%aa#R%aa#n%aa#o%aa#p%aa#q%aa#r%aa#s%aa#t%aa#u%aa#v%aa#x%aa#z%aa#{%aa'y%aa(`%aa(q%aa!k%aa!Y%aa'v%aa#`%aav%aa!_%aa%i%aa!g%aa~P#/XO#k%caP%caR%ca[%caa%caj%car%ca!S%ca!]%ca!l%ca!p%ca#R%ca#n%ca#o%ca#p%ca#q%ca#r%ca#s%ca#t%ca#u%ca#v%ca#x%ca#z%ca#{%ca'y%ca(`%ca(q%ca!k%ca!Y%ca'v%ca#`%cav%ca!_%ca%i%ca!g%ca~P#/XO#k}aP}a[}aa}aj}ar}a!l}a!p}a#R}a#n}a#o}a#p}a#q}a#r}a#s}a#t}a#u}a#v}a#x}a#z}a#{}a'y}a(`}a(q}a!k}a!Y}a'v}av}a!_}a%i}a!g}a~P$&vO#k$saP$saR$sa[$saa$saj$sar$sa!S$sa!l$sa!p$sa#R$sa#n$sa#o$sa#p$sa#q$sa#r$sa#s$sa#t$sa#u$sa#v$sa#x$sa#z$sa#{$sa'y$sa(`$sa(q$sa!k$sa!Y$sa'v$sav$sa!_$sa%i$sa!g$sa~P$'rO#k$uaP$uaR$ua[$uaa$uaj$uar$ua!S$ua!l$ua!p$ua#R$ua#n$ua#o$ua#p$ua#q$ua#r$ua#s$ua#t$ua#u$ua#v$ua#x$ua#z$ua#{$ua'y$ua(`$ua(q$ua!k$ua!Y$ua'v$uav$ua!_$ua%i$ua!g$ua~P$(eO#k%TaP%TaR%Ta[%Taa%Taj%Tar%Ta!S%Ta!]%Ta!l%Ta!p%Ta#R%Ta#n%Ta#o%Ta#p%Ta#q%Ta#r%Ta#s%Ta#t%Ta#u%Ta#v%Ta#x%Ta#z%Ta#{%Ta'y%Ta(`%Ta(q%Ta!k%Ta!Y%Ta'v%Ta#`%Tav%Ta!_%Ta%i%Ta!g%Ta~P#/XOa#cq!]#cq'y#cq'v#cq!Y#cq!k#cqv#cq!_#cq%i#cq!g#cq~P!:aO![3dO!]'XX!k'XX~P%[O!].oO!k(ja~O!].oO!k(ja~P!:aO!Y3gO~O$O!na!^!na~PKaO$O!ja!]!ja!^!ja~P#B]O$O!ra!^!ra~P!<wO$O!ta!^!ta~P!?_Og'[X!]'[X~P!+xO!].zOg(oa~OSfO!_3{O$d3|O~O!^4QO~Ov4RO~P#/XOa$mq!]$mq'y$mq'v$mq!Y$mq!k$mqv$mq!_$mq%i$mq!g$mq~P!:aO!Y4TO~P!&oO!S4UO~O!Q)|O'x)}O(y%POn'ha(x'ha!]'ha#`'ha~Og'ha$O'ha~P%,XO!Q)|O'x)}On'ja(x'ja(y'ja!]'ja#`'ja~Og'ja$O'ja~P%,zO(q$YO~P#/XO!YfX!Y$zX!]fX!]$zX!g%RX#`fX~P!/wO(S<xO~P!1jO!S%gO![4XO!_%hO(S%fO!]'dX!k'dX~O!]/kO!k(}a~O!]/kO!g#vO!k(}a~O!]/kO!g#vO(q'nO!k(}a~Og$|i!]$|i#`$|i$O$|i~P!0{O![4aO!Y'fX!]'fX~P!3iO!]/sO!Y)Oa~O!]/sO!Y)Oa~P#/XOP]XR]X[]Xj]Xr]X!Q]X!S]X!Y]X!]]X!l]X!p]X#R]X#S]X#`]X#kfX#n]X#o]X#p]X#q]X#r]X#s]X#t]X#u]X#v]X#x]X#z]X#{]X$Q]X(`]X(q]X(x]X(y]X~Oj%YX!g%YX~P%0kOj4fO!g#vO~Oh%VO!g#vO!l%dO~Oh%VOr4kO!l%dO(q'nO~Or4pO!g#vO(q'nO~Os!nO!S4qO(UTO(XUO(d!mO~O(x$}On%ai!Q%ai'x%ai(y%ai!]%ai#`%ai~Og%ai$O%ai~P%4[O(y%POn%ci!Q%ci'x%ci(x%ci!]%ci#`%ci~Og%ci$O%ci~P%4}Og(^i!](^i~P!0{O#`4wOg(^i!](^i~P!0{O!k4zO~Oa$oq!]$oq'y$oq'v$oq!Y$oq!k$oqv$oq!_$oq%i$oq!g$oq~P!:aO!Y5QO~O!]5RO!_)PX~P#/XOa$zX!_$zX%^]X'y$zX!]$zX~P!/wO%^5UOaoXnoX!QoX!_oX'xoX'yoX(xoX(yoX!]oX~Op5VO(S#nO~O%^5UO~Ob5]O%j5^O(S+nO(UTO(XUO!]'sX!^'sX~O!]0}O!^)Wa~O[5bO~O`5cO~Oa%mO'y%mO~P#/XO!]5kO#`5mO!^)TX~O!^5nO~Or5tOs!nO!S*fO!b!yO!c!vO!d!vO!|;wO#T!pO#U!pO#V!pO#W!pO#X!pO#[5sO#]!zO(T!lO(UTO(XUO(d!mO(n!sO~O!^5rO~P%:YOn5yO!_1gO%i5xO~Oh%VOn5yO!_1gO%i5xO~Ob6QO(S#nO(UTO(XUO!]'rX!^'rX~O!]1rO!^)Ua~O(UTO(XUO(d6SO~O`6WO~Oj6ZO&Z6[O~PM|O!k6]O~P%[Oa6_O~Oa6_O~P%[Ob2YO!^6dO&i2XO~P`O!g6fO~O!g6hOh(ii!](ii!^(ii!g(ii!l(iir(ii(q(ii~O!]#hi!^#hi~P#B]O#`6iO!]#hi!^#hi~O!]!ai!^!ai~P#B]Oa%mO#`6rO'y%mO~Oa%mO!g#vO#`6rO'y%mO~O!](sq!k(sqa(sq'y(sq~P!:aO!](hO!k(rq~O!S%gO!_%hO#j6yO(S%fO~O!_'^O%i6|O~On7QO!_'^O%i6|O~O#k'haP'haR'ha['haa'haj'har'ha!S'ha!l'ha!p'ha#R'ha#n'ha#o'ha#p'ha#q'ha#r'ha#s'ha#t'ha#u'ha#v'ha#x'ha#z'ha#{'ha'y'ha(`'ha(q'ha!k'ha!Y'ha'v'hav'ha!_'ha%i'ha!g'ha~P%,XO#k'jaP'jaR'ja['jaa'jaj'jar'ja!S'ja!l'ja!p'ja#R'ja#n'ja#o'ja#p'ja#q'ja#r'ja#s'ja#t'ja#u'ja#v'ja#x'ja#z'ja#{'ja'y'ja(`'ja(q'ja!k'ja!Y'ja'v'jav'ja!_'ja%i'ja!g'ja~P%,zO#k$|iP$|iR$|i[$|ia$|ij$|ir$|i!S$|i!]$|i!l$|i!p$|i#R$|i#n$|i#o$|i#p$|i#q$|i#r$|i#s$|i#t$|i#u$|i#v$|i#x$|i#z$|i#{$|i'y$|i(`$|i(q$|i!k$|i!Y$|i'v$|i#`$|iv$|i!_$|i%i$|i!g$|i~P#/XO#k%aiP%aiR%ai[%aia%aij%air%ai!S%ai!l%ai!p%ai#R%ai#n%ai#o%ai#p%ai#q%ai#r%ai#s%ai#t%ai#u%ai#v%ai#x%ai#z%ai#{%ai'y%ai(`%ai(q%ai!k%ai!Y%ai'v%aiv%ai!_%ai%i%ai!g%ai~P%4[O#k%ciP%ciR%ci[%cia%cij%cir%ci!S%ci!l%ci!p%ci#R%ci#n%ci#o%ci#p%ci#q%ci#r%ci#s%ci#t%ci#u%ci#v%ci#x%ci#z%ci#{%ci'y%ci(`%ci(q%ci!k%ci!Y%ci'v%civ%ci!_%ci%i%ci!g%ci~P%4}O!]'Xa!k'Xa~P!:aO!].oO!k(ji~O$O#ci!]#ci!^#ci~P#B]OP$[OR#zO!Q#yO!S#{O!l#xO!p$[O(`VO[#mij#mir#mi#R#mi#o#mi#p#mi#q#mi#r#mi#s#mi#t#mi#u#mi#v#mi#x#mi#z#mi#{#mi$O#mi(q#mi(x#mi(y#mi!]#mi!^#mi~O#n#mi~P%MXO#n<PO~P%MXOP$[OR#zOr<]O!Q#yO!S#{O!l#xO!p$[O#n<PO#o<QO#p<QO#q<QO(`VO[#mij#mi#R#mi#s#mi#t#mi#u#mi#v#mi#x#mi#z#mi#{#mi$O#mi(q#mi(x#mi(y#mi!]#mi!^#mi~O#r#mi~P& aO#r<RO~P& aOP$[OR#zO[<_Oj<SOr<]O!Q#yO!S#{O!l#xO!p$[O#R<SO#n<PO#o<QO#p<QO#q<QO#r<RO#s<SO#t<SO#u<^O(`VO#x#mi#z#mi#{#mi$O#mi(q#mi(x#mi(y#mi!]#mi!^#mi~O#v#mi~P&#iOP$[OR#zO[<_Oj<SOr<]O!Q#yO!S#{O!l#xO!p$[O#R<SO#n<PO#o<QO#p<QO#q<QO#r<RO#s<SO#t<SO#u<^O#v<TO(`VO(y#}O#z#mi#{#mi$O#mi(q#mi(x#mi!]#mi!^#mi~O#x<VO~P&%jO#x#mi~P&%jO#v<TO~P&#iOP$[OR#zO[<_Oj<SOr<]O!Q#yO!S#{O!l#xO!p$[O#R<SO#n<PO#o<QO#p<QO#q<QO#r<RO#s<SO#t<SO#u<^O#v<TO#x<VO(`VO(x#|O(y#}O#{#mi$O#mi(q#mi!]#mi!^#mi~O#z#mi~P&'yO#z<XO~P&'yOa#|y!]#|y'y#|y'v#|y!Y#|y!k#|yv#|y!_#|y%i#|y!g#|y~P!:aO[#mij#mir#mi#R#mi#r#mi#s#mi#t#mi#u#mi#v#mi#x#mi#z#mi#{#mi$O#mi(q#mi!]#mi!^#mi~OP$[OR#zO!Q#yO!S#{O!l#xO!p$[O#n<PO#o<QO#p<QO#q<QO(`VO(x#mi(y#mi~P&*uOn=}O!Q)|O'x)}O(x$}O(y%POP#miR#mi!S#mi!l#mi!p#mi#n#mi#o#mi#p#mi#q#mi(`#mi~P&*uO#S$dOP(_XR(_X[(_Xj(_Xn(_Xr(_X!Q(_X!S(_X!l(_X!p(_X#R(_X#n(_X#o(_X#p(_X#q(_X#r(_X#s(_X#t(_X#u(_X#v(_X#x(_X#z(_X#{(_X$O(_X'x(_X(`(_X(q(_X(x(_X(y(_X!](_X!^(_X~O$O$Pi!]$Pi!^$Pi~P#B]O$O!ri!^!ri~P$*bOg'[a!]'[a~P!0{O!^7dO~O!]'ca!^'ca~P#B]O!Y7eO~P#/XO!g#vO(q'nO!]'da!k'da~O!]/kO!k(}i~O!]/kO!g#vO!k(}i~Og$|q!]$|q#`$|q$O$|q~P!0{O!Y'fa!]'fa~P#/XO!g7lO~O!]/sO!Y)Oi~P#/XO!]/sO!Y)Oi~O!Y7oO~Oh%VOr7tO!l%dO(q'nO~Oj7vO!g#vO~Or7yO!g#vO(q'nO~O!Q)|O'x)}O(y%POn'ia(x'ia!]'ia#`'ia~Og'ia$O'ia~P&3vO!Q)|O'x)}On'ka(x'ka(y'ka!]'ka#`'ka~Og'ka$O'ka~P&4iO!Y7{O~Og%Oq!]%Oq#`%Oq$O%Oq~P!0{Og(^q!](^q~P!0{O#`7|Og(^q!](^q~P!0{Oa$oy!]$oy'y$oy'v$oy!Y$oy!k$oyv$oy!_$oy%i$oy!g$oy~P!:aO!g6hO~O!]5RO!_)Pa~O!_'^OP$TaR$Ta[$Taj$Tar$Ta!Q$Ta!S$Ta!]$Ta!l$Ta!p$Ta#R$Ta#n$Ta#o$Ta#p$Ta#q$Ta#r$Ta#s$Ta#t$Ta#u$Ta#v$Ta#x$Ta#z$Ta#{$Ta(`$Ta(q$Ta(x$Ta(y$Ta~O%i6|O~P&7ZO%^8QOa%[i!_%[i'y%[i!]%[i~Oa#cy!]#cy'y#cy'v#cy!Y#cy!k#cyv#cy!_#cy%i#cy!g#cy~P!:aO[8SO~Ob8UO(S+nO(UTO(XUO~O!]0}O!^)Wi~O`8YO~O(d(zO!]'oX!^'oX~O!]5kO!^)Ta~O!^8cO~P%:YO(n!sO~P$${O#[8dO~O!_1gO~O!_1gO%i8fO~On8iO!_1gO%i8fO~O[8nO!]'ra!^'ra~O!]1rO!^)Ui~O!k8rO~O!k8sO~O!k8vO~O!k8vO~P%[Oa8xO~O!g8yO~O!k8zO~O!](vi!^(vi~P#B]Oa%mO#`9SO'y%mO~O!](sy!k(sya(sy'y(sy~P!:aO!](hO!k(ry~O%i9VO~P&7ZO!_'^O%i9VO~O#k$|qP$|qR$|q[$|qa$|qj$|qr$|q!S$|q!]$|q!l$|q!p$|q#R$|q#n$|q#o$|q#p$|q#q$|q#r$|q#s$|q#t$|q#u$|q#v$|q#x$|q#z$|q#{$|q'y$|q(`$|q(q$|q!k$|q!Y$|q'v$|q#`$|qv$|q!_$|q%i$|q!g$|q~P#/XO#k'iaP'iaR'ia['iaa'iaj'iar'ia!S'ia!l'ia!p'ia#R'ia#n'ia#o'ia#p'ia#q'ia#r'ia#s'ia#t'ia#u'ia#v'ia#x'ia#z'ia#{'ia'y'ia(`'ia(q'ia!k'ia!Y'ia'v'iav'ia!_'ia%i'ia!g'ia~P&3vO#k'kaP'kaR'ka['kaa'kaj'kar'ka!S'ka!l'ka!p'ka#R'ka#n'ka#o'ka#p'ka#q'ka#r'ka#s'ka#t'ka#u'ka#v'ka#x'ka#z'ka#{'ka'y'ka(`'ka(q'ka!k'ka!Y'ka'v'kav'ka!_'ka%i'ka!g'ka~P&4iO#k%OqP%OqR%Oq[%Oqa%Oqj%Oqr%Oq!S%Oq!]%Oq!l%Oq!p%Oq#R%Oq#n%Oq#o%Oq#p%Oq#q%Oq#r%Oq#s%Oq#t%Oq#u%Oq#v%Oq#x%Oq#z%Oq#{%Oq'y%Oq(`%Oq(q%Oq!k%Oq!Y%Oq'v%Oq#`%Oqv%Oq!_%Oq%i%Oq!g%Oq~P#/XO!]'Xi!k'Xi~P!:aO$O#cq!]#cq!^#cq~P#B]O(x$}OP%aaR%aa[%aaj%aar%aa!S%aa!l%aa!p%aa#R%aa#n%aa#o%aa#p%aa#q%aa#r%aa#s%aa#t%aa#u%aa#v%aa#x%aa#z%aa#{%aa$O%aa(`%aa(q%aa!]%aa!^%aa~On%aa!Q%aa'x%aa(y%aa~P&HnO(y%POP%caR%ca[%caj%car%ca!S%ca!l%ca!p%ca#R%ca#n%ca#o%ca#p%ca#q%ca#r%ca#s%ca#t%ca#u%ca#v%ca#x%ca#z%ca#{%ca$O%ca(`%ca(q%ca!]%ca!^%ca~On%ca!Q%ca'x%ca(x%ca~P&JuOn=}O!Q)|O'x)}O(y%PO~P&HnOn=}O!Q)|O'x)}O(x$}O~P&JuOR0cO!Q0cO!S0dO#S$dOP}a[}aj}an}ar}a!l}a!p}a#R}a#n}a#o}a#p}a#q}a#r}a#s}a#t}a#u}a#v}a#x}a#z}a#{}a$O}a'x}a(`}a(q}a(x}a(y}a!]}a!^}a~O!Q)|O'x)}OP$saR$sa[$saj$san$sar$sa!S$sa!l$sa!p$sa#R$sa#n$sa#o$sa#p$sa#q$sa#r$sa#s$sa#t$sa#u$sa#v$sa#x$sa#z$sa#{$sa$O$sa(`$sa(q$sa(x$sa(y$sa!]$sa!^$sa~O!Q)|O'x)}OP$uaR$ua[$uaj$uan$uar$ua!S$ua!l$ua!p$ua#R$ua#n$ua#o$ua#p$ua#q$ua#r$ua#s$ua#t$ua#u$ua#v$ua#x$ua#z$ua#{$ua$O$ua(`$ua(q$ua(x$ua(y$ua!]$ua!^$ua~On=}O!Q)|O'x)}O(x$}O(y%PO~OP%TaR%Ta[%Taj%Tar%Ta!S%Ta!l%Ta!p%Ta#R%Ta#n%Ta#o%Ta#p%Ta#q%Ta#r%Ta#s%Ta#t%Ta#u%Ta#v%Ta#x%Ta#z%Ta#{%Ta$O%Ta(`%Ta(q%Ta!]%Ta!^%Ta~P'%zO$O$mq!]$mq!^$mq~P#B]O$O$oq!]$oq!^$oq~P#B]O!^9dO~O$O9eO~P!0{O!g#vO!]'di!k'di~O!g#vO(q'nO!]'di!k'di~O!]/kO!k(}q~O!Y'fi!]'fi~P#/XO!]/sO!Y)Oq~Or9lO!g#vO(q'nO~O[9nO!Y9mO~P#/XO!Y9mO~Oj9tO!g#vO~Og(^y!](^y~P!0{O!]'ma!_'ma~P#/XOa%[q!_%[q'y%[q!]%[q~P#/XO[9yO~O!]0}O!^)Wq~O#`9}O!]'oa!^'oa~O!]5kO!^)Ti~P#B]O!S:PO~O!_1gO%i:SO~O(UTO(XUO(d:XO~O!]1rO!^)Uq~O!k:[O~O!k:]O~O!k:^O~O!k:^O~P%[O#`:aO!]#hy!^#hy~O!]#hy!^#hy~P#B]O%i:fO~P&7ZO!_'^O%i:fO~O$O#|y!]#|y!^#|y~P#B]OP$|iR$|i[$|ij$|ir$|i!S$|i!l$|i!p$|i#R$|i#n$|i#o$|i#p$|i#q$|i#r$|i#s$|i#t$|i#u$|i#v$|i#x$|i#z$|i#{$|i$O$|i(`$|i(q$|i!]$|i!^$|i~P'%zO!Q)|O'x)}O(y%POP'haR'ha['haj'han'har'ha!S'ha!l'ha!p'ha#R'ha#n'ha#o'ha#p'ha#q'ha#r'ha#s'ha#t'ha#u'ha#v'ha#x'ha#z'ha#{'ha$O'ha(`'ha(q'ha(x'ha!]'ha!^'ha~O!Q)|O'x)}OP'jaR'ja['jaj'jan'jar'ja!S'ja!l'ja!p'ja#R'ja#n'ja#o'ja#p'ja#q'ja#r'ja#s'ja#t'ja#u'ja#v'ja#x'ja#z'ja#{'ja$O'ja(`'ja(q'ja(x'ja(y'ja!]'ja!^'ja~O(x$}OP%aiR%ai[%aij%ain%air%ai!Q%ai!S%ai!l%ai!p%ai#R%ai#n%ai#o%ai#p%ai#q%ai#r%ai#s%ai#t%ai#u%ai#v%ai#x%ai#z%ai#{%ai$O%ai'x%ai(`%ai(q%ai(y%ai!]%ai!^%ai~O(y%POP%ciR%ci[%cij%cin%cir%ci!Q%ci!S%ci!l%ci!p%ci#R%ci#n%ci#o%ci#p%ci#q%ci#r%ci#s%ci#t%ci#u%ci#v%ci#x%ci#z%ci#{%ci$O%ci'x%ci(`%ci(q%ci(x%ci!]%ci!^%ci~O$O$oy!]$oy!^$oy~P#B]O$O#cy!]#cy!^#cy~P#B]O!g#vO!]'dq!k'dq~O!]/kO!k(}y~O!Y'fq!]'fq~P#/XOr:pO!g#vO(q'nO~O[:tO!Y:sO~P#/XO!Y:sO~Og(^!R!](^!R~P!0{Oa%[y!_%[y'y%[y!]%[y~P#/XO!]0}O!^)Wy~O!]5kO!^)Tq~O(S:zO~O!_1gO%i:}O~O!k;QO~O%i;VO~P&7ZOP$|qR$|q[$|qj$|qr$|q!S$|q!l$|q!p$|q#R$|q#n$|q#o$|q#p$|q#q$|q#r$|q#s$|q#t$|q#u$|q#v$|q#x$|q#z$|q#{$|q$O$|q(`$|q(q$|q!]$|q!^$|q~P'%zO!Q)|O'x)}O(y%POP'iaR'ia['iaj'ian'iar'ia!S'ia!l'ia!p'ia#R'ia#n'ia#o'ia#p'ia#q'ia#r'ia#s'ia#t'ia#u'ia#v'ia#x'ia#z'ia#{'ia$O'ia(`'ia(q'ia(x'ia!]'ia!^'ia~O!Q)|O'x)}OP'kaR'ka['kaj'kan'kar'ka!S'ka!l'ka!p'ka#R'ka#n'ka#o'ka#p'ka#q'ka#r'ka#s'ka#t'ka#u'ka#v'ka#x'ka#z'ka#{'ka$O'ka(`'ka(q'ka(x'ka(y'ka!]'ka!^'ka~OP%OqR%Oq[%Oqj%Oqr%Oq!S%Oq!l%Oq!p%Oq#R%Oq#n%Oq#o%Oq#p%Oq#q%Oq#r%Oq#s%Oq#t%Oq#u%Oq#v%Oq#x%Oq#z%Oq#{%Oq$O%Oq(`%Oq(q%Oq!]%Oq!^%Oq~P'%zOg%e!Z!]%e!Z#`%e!Z$O%e!Z~P!0{O!Y;ZO~P#/XOr;[O!g#vO(q'nO~O[;^O!Y;ZO~P#/XO!]'oq!^'oq~P#B]O!]#h!Z!^#h!Z~P#B]O#k%e!ZP%e!ZR%e!Z[%e!Za%e!Zj%e!Zr%e!Z!S%e!Z!]%e!Z!l%e!Z!p%e!Z#R%e!Z#n%e!Z#o%e!Z#p%e!Z#q%e!Z#r%e!Z#s%e!Z#t%e!Z#u%e!Z#v%e!Z#x%e!Z#z%e!Z#{%e!Z'y%e!Z(`%e!Z(q%e!Z!k%e!Z!Y%e!Z'v%e!Z#`%e!Zv%e!Z!_%e!Z%i%e!Z!g%e!Z~P#/XOr;fO!g#vO(q'nO~O!Y;gO~P#/XOr;nO!g#vO(q'nO~O!Y;oO~P#/XOP%e!ZR%e!Z[%e!Zj%e!Zr%e!Z!S%e!Z!l%e!Z!p%e!Z#R%e!Z#n%e!Z#o%e!Z#p%e!Z#q%e!Z#r%e!Z#s%e!Z#t%e!Z#u%e!Z#v%e!Z#x%e!Z#z%e!Z#{%e!Z$O%e!Z(`%e!Z(q%e!Z!]%e!Z!^%e!Z~P'%zOr;rO!g#vO(q'nO~Ov(eX~P1qO!Q%qO~P!)PO(T!lO~P!)PO!YfX!]fX#`fX~P%0kOP]XR]X[]Xj]Xr]X!Q]X!S]X!]]X!]fX!l]X!p]X#R]X#S]X#`]X#`fX#kfX#n]X#o]X#p]X#q]X#r]X#s]X#t]X#u]X#v]X#x]X#z]X#{]X$Q]X(`]X(q]X(x]X(y]X~O!gfX!k]X!kfX(qfX~P'JsOP;vOQ;vOSfOd=rOe!iOpkOr;vOskOtkOzkO|;vO!O;vO!SWO!WkO!XkO!_XO!i;yO!lZO!o;vO!p;vO!q;vO!s;zO!u;}O!x!hO$W!kO$n=pO(S)ZO(UTO(XUO(`VO(n[O~O!]<ZO!^$qa~Oh%VOp%WOr%XOs$tOt$tOz%YO|%ZO!O<fO!S${O!_$|O!i=wO!l$xO#j<lO$W%_O$t<hO$v<jO$y%`O(S(tO(UTO(XUO(`$uO(x$}O(y%PO~Ol)bO~P( iOr!eX(q!eX~P# }Or(iX(q(iX~P#!pO!^]X!^fX~P'JsO!YfX!Y$zX!]fX!]$zX#`fX~P!/wO#k<OO~O!g#vO#k<OO~O#`<`O~Oj<SO~O#`<pO!](vX!^(vX~O#`<`O!](tX!^(tX~O#k<qO~Og<sO~P!0{O#k<yO~O#k<zO~O!g#vO#k<{O~O!g#vO#k<qO~O$O<|O~P#B]O#k<}O~O#k=OO~O#k=TO~O#k=UO~O#k=VO~O#k=WO~O$O=XO~P!0{O$O=YO~P!0{Ok#S#T#U#W#X#[#i#j#u$n$t$v$y%]%^%h%i%j%q%s%v%w%y%{~'}T#o!X'{(T#ps#n#qr!Q'|$]'|(S$_(d~",
  goto: "$8g)[PPPPPP)]PP)`P)qP+R/WPPPP6bPP6xPP<pPPP@dP@zP@zPPP@zPCSP@zP@zP@zPCWPC]PCzPHtPPPHxPPPPHxK{PPPLRLsPHxPHxPP! RHxPPPHxPHxP!#YHxP!&p!'u!(OP!(r!(v!(r!,TPPPPPPP!,t!'uPP!-U!.vP!2SHxHx!2X!5e!:R!:R!>QPPP!>YHxPPPPPPPPP!AiP!BvPPHx!DXPHxPHxHxHxHxHxPHx!EkP!HuP!K{P!LP!LZ!L_!L_P!HrP!Lc!LcP# iP# mHxPHx# s#$xCW@zP@zP@z@zP#&V@z@z#(i@z#+a@z#-m@z@z#.]#0q#0q#0v#1P#0q#1[PP#0qP@z#1t@z#5s@z@z6bPPP#9xPPP#:c#:cP#:cP#:y#:cPP#;PP#:vP#:v#;d#:v#<O#<U#<X)`#<[)`P#<c#<c#<cP)`P)`P)`P)`PP)`P#<i#<lP#<l)`P#<pP#<sP)`P)`P)`P)`P)`P)`)`PP#<y#=P#=[#=b#=h#=n#=t#>S#>Y#>d#>j#>t#>z#?[#?b#@S#@f#@l#@r#AQ#Ag#C[#Cj#Cq#E]#Ek#G]#Gk#Gq#Gw#G}#HX#H_#He#Ho#IR#IXPPPPPPPPPPP#I_PPPPPPP#JS#MZ#Ns#Nz$ SPPP$&nP$&w$)p$0Z$0^$0a$1`$1c$1j$1rP$1x$1{P$2i$2m$3e$4s$4x$5`PP$5e$5k$5o$5r$5v$5z$6v$7_$7v$7z$7}$8Q$8W$8Z$8_$8cR!|RoqOXst!Z#d%l&p&r&s&u,n,s2S2VY!vQ'^-`1g5qQ%svQ%{yQ&S|Q&h!VS'U!e-WQ'd!iS'j!r!yU*h$|*X*lQ+l%|Q+y&UQ,_&bQ-^']Q-h'eQ-p'kQ0U*nQ1q,`R<m;z%SdOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$_$a$e%l%s&Q&i&l&p&r&s&u&y'R'`'p(R(T(Z(b(v(x(|){*f+U+Y,k,n,s-d-l-z.Q.o.v/i0V0d0l0|1j1z1{1}2P2S2V2X2x3O3d4q5y6Z6[6_6r8i8x9SS#q];w!r)]$Z$n'V)q-P-S/Q2h3{5m6i9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sU*{%[<e<fQ+q&OQ,a&eQ,h&mQ0r+dQ0w+fQ1S+rQ1y,fQ3W.bQ5V0vQ5]0}Q6Q1rQ7O3[Q8U5^R9Y7Q'QkOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$Z$_$a$e$n%l%s&Q&i&l&m&p&r&s&u&y'R'V'`'p(R(T(Z(b(v(x(|)q){*f+U+Y+d,k,n,s-P-S-d-l-z.Q.b.o.v/Q/i0V0d0l0|1j1z1{1}2P2S2V2X2h2x3O3[3d3{4q5m5y6Z6[6_6i6r7Q8i8x9S9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=s!S!nQ!r!v!y!z$|'U']'^'j'k'l*h*l*n*o-W-^-`-p0U0X1g5q5s%[$ti#v$b$c$d$x${%O%Q%]%^%b)w*P*R*T*W*^*d*t*u+c+f+},Q.a.z/_/h/r/s/u0Y0[0g0h0i1^1a1i3Z4U4V4a4f4w5R5U5x6|7l7v7|8Q8f9V9e9n9t:S:f:t:};V;^<^<_<a<b<c<d<g<h<i<j<k<l<t<u<v<w<y<z<}=O=P=Q=R=S=T=U=X=Y=p=x=y=|=}Q&V|Q'S!eS'Y%h-ZQ+q&OQ,a&eQ0f+OQ1S+rQ1X+xQ1x,eQ1y,fQ5]0}Q5f1ZQ6Q1rQ6T1tQ6U1wQ8U5^Q8X5cQ8q6WQ9|8YQ:Y8nR<o*XrnOXst!V!Z#d%l&g&p&r&s&u,n,s2S2VR,c&i&z^OPXYstuvwz!Z!`!g!j!o#S#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$Z$_$a$e$n%l%s&Q&i&l&m&p&r&s&u&y'R'`'p(T(Z(b(v(x(|)q){*f+U+Y+d,k,n,s-P-S-d-l-z.Q.b.o.v/Q/i0V0d0l0|1j1z1{1}2P2S2V2X2h2x3O3[3d3{4q5m5y6Z6[6_6i6r7Q8i8x9S9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=r=s[#]WZ#W#Z'V(R!b%im#h#i#l$x%d%g([(f(g(h*W*[*_+W+X+Z,j-Q.O.U.V.W.Y/h/k2[3S3T4X6h6yQ%vxQ%zyS&P|&UQ&]!TQ'a!hQ'c!iQ(o#sS+k%{%|Q+o&OQ,Y&`Q,^&bS-g'd'eQ.d(pQ0{+lQ1R+rQ1T+sQ1W+wQ1l,ZS1p,_,`Q2t-hQ5[0}Q5`1QQ5e1YQ6P1qQ8T5^Q8W5bQ9x8SR:w9y!U$zi$d%O%Q%]%^%b*P*R*^*t*u.z/r0Y0[0g0h0i4V4w7|9e=p=x=y!^%xy!i!u%z%{%|'T'c'd'e'i's*g+k+l-T-g-h-o/{0O0{2m2t2{4i4j4m7s9pQ+e%vQ,O&YQ,R&ZQ,]&bQ.c(oQ1k,YU1o,^,_,`Q3].dQ5z1lS6O1p1qQ8m6P#f=t#v$b$c$x${)w*T*W*d+c+f+},Q.a/_/h/s/u1^1a1i3Z4U4a4f5R5U5x6|7l7v8Q8f9V9n9t:S:f:t:};V;^<a<c<g<i<k<t<v<y<}=P=R=T=X=|=}o=u<^<_<b<d<h<j<l<u<w<z=O=Q=S=U=YW%Ti%V*v=pS&Y!Q&gQ&Z!RQ&[!SQ+S%cR+|&W%]%Si#v$b$c$d$x${%O%Q%]%^%b)w*P*R*T*W*^*d*t*u+c+f+},Q.a.z/_/h/r/s/u0Y0[0g0h0i1^1a1i3Z4U4V4a4f4w5R5U5x6|7l7v7|8Q8f9V9e9n9t:S:f:t:};V;^<^<_<a<b<c<d<g<h<i<j<k<l<t<u<v<w<y<z<}=O=P=Q=R=S=T=U=X=Y=p=x=y=|=}T)x$u)yV*{%[<e<fW'Y!e%h*X-ZS({#y#zQ+`%qQ+v&RS.](k(lQ1b,SQ4x0cR8^5k'QkOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$Z$_$a$e$n%l%s&Q&i&l&m&p&r&s&u&y'R'V'`'p(R(T(Z(b(v(x(|)q){*f+U+Y+d,k,n,s-P-S-d-l-z.Q.b.o.v/Q/i0V0d0l0|1j1z1{1}2P2S2V2X2h2x3O3[3d3{4q5m5y6Z6[6_6i6r7Q8i8x9S9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=s$i$^c#Y#e%p%r%t(Q(W(r(w)P)Q)R)S)T)U)V)W)X)Y)[)^)`)e)o+a+u-U-s-x-}.P.n.q.u.w.x.y/]0j2c2f2v2}3c3h3i3j3k3l3m3n3o3p3q3r3s3t3w3x4P5O5Y6k6q6v7V7W7a7b8`8|9Q9[9b9c:c:y;R;x=gT#TV#U'RkOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$Z$_$a$e$n%l%s&Q&i&l&m&p&r&s&u&y'R'V'`'p(R(T(Z(b(v(x(|)q){*f+U+Y+d,k,n,s-P-S-d-l-z.Q.b.o.v/Q/i0V0d0l0|1j1z1{1}2P2S2V2X2h2x3O3[3d3{4q5m5y6Z6[6_6i6r7Q8i8x9S9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sQ'W!eR2i-W!W!nQ!e!r!v!y!z$|'U']'^'j'k'l*X*h*l*n*o-W-^-`-p0U0X1g5q5sR1d,UnqOXst!Z#d%l&p&r&s&u,n,s2S2VQ&w!^Q't!xS(q#u<OQ+i%yQ,W&]Q,X&_Q-e'bQ-r'mS.m(v<qS0k+U<{Q0y+jQ1f,VQ2Z,uQ2],vQ2e-RQ2r-fQ2u-jS5P0l=VQ5W0zS5Z0|=WQ6j2gQ6n2sQ6s2zQ8R5XQ8}6lQ9O6oQ9R6tR:`8z$d$]c#Y#e%r%t(Q(W(r(w)P)Q)R)S)T)U)V)W)X)Y)[)^)`)e)o+a+u-U-s-x-}.P.n.q.u.x.y/]0j2c2f2v2}3c3h3i3j3k3l3m3n3o3p3q3r3s3t3w3x4P5O5Y6k6q6v7V7W7a7b8`8|9Q9[9b9c:c:y;R;x=gS(m#p'gQ(}#zS+_%p.wS.^(l(nR3U._'QkOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$Z$_$a$e$n%l%s&Q&i&l&m&p&r&s&u&y'R'V'`'p(R(T(Z(b(v(x(|)q){*f+U+Y+d,k,n,s-P-S-d-l-z.Q.b.o.v/Q/i0V0d0l0|1j1z1{1}2P2S2V2X2h2x3O3[3d3{4q5m5y6Z6[6_6i6r7Q8i8x9S9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sS#q];wQ&r!XQ&s!YQ&u![Q&v!]R2R,qQ'_!hQ+b%vQ-c'aS.`(o+eQ2p-bW3Y.c.d0q0sQ6m2qW6z3V3X3]5TU9U6{6}7PU:e9W9X9ZS;T:d:gQ;b;UR;j;cU!wQ'^-`T5o1g5q!Q_OXZ`st!V!Z#d#h%d%l&g&i&p&r&s&u(h,n,s.V2S2V]!pQ!r'^-`1g5qT#q];w%^{OPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$_$a$e%l%s&Q&i&l&m&p&r&s&u&y'R'`'p(R(T(Z(b(v(x(|){*f+U+Y+d,k,n,s-d-l-z.Q.b.o.v/i0V0d0l0|1j1z1{1}2P2S2V2X2x3O3[3d4q5y6Z6[6_6r7Q8i8x9SS({#y#zS.](k(l!s=^$Z$n'V)q-P-S/Q2h3{5m6i9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sU$fd)],hS(n#p'gU*s%R(u3vU0e*z.i7]Q5T0rQ6{3WQ9X7OR:g9Ym!tQ!r!v!y!z'^'j'k'l-`-p1g5q5sQ'r!uS(d#g1|S-n'i'uQ/n*ZQ/{*gQ2|-qQ4]/oQ4i/}Q4j0OQ4o0WQ7h4WS7s4k4mS7w4p4rQ9g7iQ9k7oQ9p7tQ9u7yS:o9l9mS;Y:p:sS;e;Z;[S;m;f;gS;q;n;oR;t;rQ#wbQ'q!uS(c#g1|S(e#m+TQ+V%eQ+g%wQ+m%}U-m'i'r'uQ.R(dQ/m*ZQ/|*gQ0P*iQ0x+hQ1m,[S2y-n-qQ3R.ZS4[/n/oQ4e/yS4h/{0WQ4l0QQ5|1nQ6u2|Q7g4WQ7k4]U7r4i4o4rQ7u4nQ8k5}S9f7h7iQ9j7oQ9r7wQ9s7xQ:V8lQ:m9gS:n9k9mQ:v9uQ;P:WS;X:o:sS;d;Y;ZS;l;e;gS;p;m;oQ;s;qQ;u;tQ=a=[Q=l=eR=m=fV!wQ'^-`%^aOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$_$a$e%l%s&Q&i&l&m&p&r&s&u&y'R'`'p(R(T(Z(b(v(x(|){*f+U+Y+d,k,n,s-d-l-z.Q.b.o.v/i0V0d0l0|1j1z1{1}2P2S2V2X2x3O3[3d4q5y6Z6[6_6r7Q8i8x9SS#wz!j!r=Z$Z$n'V)q-P-S/Q2h3{5m6i9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sR=a=r%^bOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$_$a$e%l%s&Q&i&l&m&p&r&s&u&y'R'`'p(R(T(Z(b(v(x(|){*f+U+Y+d,k,n,s-d-l-z.Q.b.o.v/i0V0d0l0|1j1z1{1}2P2S2V2X2x3O3[3d4q5y6Z6[6_6r7Q8i8x9SQ%ej!^%wy!i!u%z%{%|'T'c'd'e'i's*g+k+l-T-g-h-o/{0O0{2m2t2{4i4j4m7s9pS%}z!jQ+h%xQ,[&bW1n,],^,_,`U5}1o1p1qS8l6O6PQ:W8m!r=[$Z$n'V)q-P-S/Q2h3{5m6i9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sQ=e=qR=f=r%QeOPXYstuvw!Z!`!g!o#S#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$_$a$e%l%s&Q&i&l&p&r&s&u&y'R'`'p(T(Z(b(v(x(|){*f+U+Y+d,k,n,s-d-l-z.Q.b.o.v/i0V0d0l0|1j1z1{1}2P2S2V2X2x3O3[3d4q5y6Z6[6_6r7Q8i8x9SY#bWZ#W#Z(R!b%im#h#i#l$x%d%g([(f(g(h*W*[*_+W+X+Z,j-Q.O.U.V.W.Y/h/k2[3S3T4X6h6yQ,i&m!p=]$Z$n)q-P-S/Q2h3{5m6i9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sR=`'VU'Z!e%h*XR2k-Z%SdOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$_$a$e%l%s&Q&i&l&p&r&s&u&y'R'`'p(R(T(Z(b(v(x(|){*f+U+Y,k,n,s-d-l-z.Q.o.v/i0V0d0l0|1j1z1{1}2P2S2V2X2x3O3d4q5y6Z6[6_6r8i8x9S!r)]$Z$n'V)q-P-S/Q2h3{5m6i9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sQ,h&mQ0r+dQ3W.bQ7O3[R9Y7Q!b$Tc#Y%p(Q(W(r(w)X)Y)^)e+u-s-x-}.P.n.q/]0j2v2}3c3s5O5Y6q6v7V9Q:c;x!P<U)[)o-U.w2c2f3h3q3r3w4P6k7W7a7b8`8|9[9b9c:y;R=g!f$Vc#Y%p(Q(W(r(w)U)V)X)Y)^)e+u-s-x-}.P.n.q/]0j2v2}3c3s5O5Y6q6v7V9Q:c;x!T<W)[)o-U.w2c2f3h3n3o3q3r3w4P6k7W7a7b8`8|9[9b9c:y;R=g!^$Zc#Y%p(Q(W(r(w)^)e+u-s-x-}.P.n.q/]0j2v2}3c3s5O5Y6q6v7V9Q:c;xQ4V/fz=s)[)o-U.w2c2f3h3w4P6k7W7a7b8`8|9[9b9c:y;R=gQ=x=zR=y={'QkOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$Z$_$a$e$n%l%s&Q&i&l&m&p&r&s&u&y'R'V'`'p(R(T(Z(b(v(x(|)q){*f+U+Y+d,k,n,s-P-S-d-l-z.Q.b.o.v/Q/i0V0d0l0|1j1z1{1}2P2S2V2X2h2x3O3[3d3{4q5m5y6Z6[6_6i6r7Q8i8x9S9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sS$oh$pR3|/P'XgOPWXYZhstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$Z$_$a$e$n$p%l%s&Q&i&l&m&p&r&s&u&y'R'V'`'p(R(T(Z(b(v(x(|)q){*f+U+Y+d,k,n,s-P-S-d-l-z.Q.b.o.v/P/Q/i0V0d0l0|1j1z1{1}2P2S2V2X2h2x3O3[3d3{4q5m5y6Z6[6_6i6r7Q8i8x9S9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sT$kf$qQ$ifS)h$l)lR)t$qT$jf$qT)j$l)l'XhOPWXYZhstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$Z$_$a$e$n$p%l%s&Q&i&l&m&p&r&s&u&y'R'V'`'p(R(T(Z(b(v(x(|)q){*f+U+Y+d,k,n,s-P-S-d-l-z.Q.b.o.v/P/Q/i0V0d0l0|1j1z1{1}2P2S2V2X2h2x3O3[3d3{4q5m5y6Z6[6_6i6r7Q8i8x9S9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=sT$oh$pQ$rhR)s$p%^jOPWXYZstuvw!Z!`!g!o#S#W#Z#d#o#u#x#{$O$P$Q$R$S$T$U$V$W$X$_$a$e%l%s&Q&i&l&m&p&r&s&u&y'R'`'p(R(T(Z(b(v(x(|){*f+U+Y+d,k,n,s-d-l-z.Q.b.o.v/i0V0d0l0|1j1z1{1}2P2S2V2X2x3O3[3d4q5y6Z6[6_6r7Q8i8x9S!s=q$Z$n'V)q-P-S/Q2h3{5m6i9}:a;v;y;z;}<O<P<Q<R<S<T<U<V<W<X<Y<Z<]<`<m<p<q<s<{<|=V=W=s#glOPXZst!Z!`!o#S#d#o#{$n%l&i&l&m&p&r&s&u&y'R'`(|)q*f+Y+d,k,n,s-d.b/Q/i0V0d1j1z1{1}2P2S2V2X3[3{4q5y6Z6[6_7Q8i8x!U%Ri$d%O%Q%]%^%b*P*R*^*t*u.z/r0Y0[0g0h0i4V4w7|9e=p=x=y#f(u#v$b$c$x${)w*T*W*d+c+f+},Q.a/_/h/s/u1^1a1i3Z4U4a4f5R5U5x6|7l7v8Q8f9V9n9t:S:f:t:};V;^<a<c<g<i<k<t<v<y<}=P=R=T=X=|=}Q+P%`Q/^)|o3v<^<_<b<d<h<j<l<u<w<z=O=Q=S=U=Y!U$yi$d%O%Q%]%^%b*P*R*^*t*u.z/r0Y0[0g0h0i4V4w7|9e=p=x=yQ*`$zU*i$|*X*lQ+Q%aQ0Q*j#f=c#v$b$c$x${)w*T*W*d+c+f+},Q.a/_/h/s/u1^1a1i3Z4U4a4f5R5U5x6|7l7v8Q8f9V9n9t:S:f:t:};V;^<a<c<g<i<k<t<v<y<}=P=R=T=X=|=}n=d<^<_<b<d<h<j<l<u<w<z=O=Q=S=U=YQ=h=tQ=i=uQ=j=vR=k=w!U%Ri$d%O%Q%]%^%b*P*R*^*t*u.z/r0Y0[0g0h0i4V4w7|9e=p=x=y#f(u#v$b$c$x${)w*T*W*d+c+f+},Q.a/_/h/s/u1^1a1i3Z4U4a4f5R5U5x6|7l7v8Q8f9V9n9t:S:f:t:};V;^<a<c<g<i<k<t<v<y<}=P=R=T=X=|=}o3v<^<_<b<d<h<j<l<u<w<z=O=Q=S=U=YnoOXst!Z#d%l&p&r&s&u,n,s2S2VS*c${*WQ,|&|Q,}'OR4`/s%[%Si#v$b$c$d$x${%O%Q%]%^%b)w*P*R*T*W*^*d*t*u+c+f+},Q.a.z/_/h/r/s/u0Y0[0g0h0i1^1a1i3Z4U4V4a4f4w5R5U5x6|7l7v7|8Q8f9V9e9n9t:S:f:t:};V;^<^<_<a<b<c<d<g<h<i<j<k<l<t<u<v<w<y<z<}=O=P=Q=R=S=T=U=X=Y=p=x=y=|=}Q,P&ZQ1`,RQ5i1_R8]5jV*k$|*X*lU*k$|*X*lT5p1g5qS/y*f/iQ4n0VT7x4q:PQ+g%wQ0P*iQ0x+hQ1m,[Q5|1nQ8k5}Q:V8lR;P:W!U%Oi$d%O%Q%]%^%b*P*R*^*t*u.z/r0Y0[0g0h0i4V4w7|9e=p=x=yx*P$v)c*Q*r+R/q0^0_3y4^4{4|4}7f7z9v:l=b=n=oS0Y*q0Z#f<a#v$b$c$x${)w*T*W*d+c+f+},Q.a/_/h/s/u1^1a1i3Z4U4a4f5R5U5x6|7l7v8Q8f9V9n9t:S:f:t:};V;^<a<c<g<i<k<t<v<y<}=P=R=T=X=|=}n<b<^<_<b<d<h<j<l<u<w<z=O=Q=S=U=Y!d<t(s)a*Y*b.e.h.l/Y/f/v0p1]3`4S4_4c5h7R7U7m7p7}8P9i9q9w:q:u;W;];h=z={`<u3u7X7[7`9]:h:k;kS=P.g3aT=Q7Z9`!U%Qi$d%O%Q%]%^%b*P*R*^*t*u.z/r0Y0[0g0h0i4V4w7|9e=p=x=y|*R$v)c*S*q+R/b/q0^0_3y4^4s4{4|4}7f7z9v:l=b=n=oS0[*r0]#f<c#v$b$c$x${)w*T*W*d+c+f+},Q.a/_/h/s/u1^1a1i3Z4U4a4f5R5U5x6|7l7v8Q8f9V9n9t:S:f:t:};V;^<a<c<g<i<k<t<v<y<}=P=R=T=X=|=}n<d<^<_<b<d<h<j<l<u<w<z=O=Q=S=U=Y!h<v(s)a*Y*b.f.g.l/Y/f/v0p1]3^3`4S4_4c5h7R7S7U7m7p7}8P9i9q9w:q:u;W;];h=z={d<w3u7Y7Z7`9]9^:h:i:k;kS=R.h3bT=S7[9arnOXst!V!Z#d%l&g&p&r&s&u,n,s2S2VQ&d!UR,k&mrnOXst!V!Z#d%l&g&p&r&s&u,n,s2S2VR&d!UQ,T&[R1[+|snOXst!V!Z#d%l&g&p&r&s&u,n,s2S2VQ1h,YS5w1k1lU8e5u5v5zS:R8g8hS:{:Q:TQ;_:|R;i;`Q&k!VR,d&gR6T1tR:Y8nS&P|&UR1T+sQ&p!WR,n&qR,t&vT2T,s2VR,x&wQ,w&wR2^,xQ'w!{R-t'wSsOtQ#dXT%os#dQ#OTR'y#OQ#RUR'{#RQ)y$uR/Z)yQ#UVR(O#UQ#XWU(U#X(V-{Q(V#YR-{(WQ-X'WR2j-XQ.p(wS3e.p3fR3f.qQ-`'^R2n-`Y!rQ'^-`1g5qR'h!rQ.{)cR3z.{U#_W%g*WU(]#_(^-|Q(^#`R-|(XQ-['ZR2l-[t`OXst!V!Z#d%l&g&i&p&r&s&u,n,s2S2VS#hZ%dU#r`#h.VR.V(hQ(i#jQ.S(eW.[(i.S3P6wQ3P.TR6w3QQ)l$lR/R)lQ$phR)r$pQ$`cU)_$`-w<[Q-w;xR<[)oQ/l*ZW4Y/l4Z7j9hU4Z/m/n/oS7j4[4]R9h7k$e*O$v(s)a)c*Y*b*q*r*|*}+R.g.h.j.k.l/Y/b/d/f/q/v0^0_0p1]3^3_3`3u3y4S4^4_4c4s4u4{4|4}5h7R7S7T7U7Z7[7^7_7`7f7m7p7z7}8P9]9^9_9i9q9v9w:h:i:j:k:l:q:u;W;];h;k=b=n=o=z={Q/t*bU4b/t4d7nQ4d/vR7n4cS*l$|*XR0S*lx*Q$v)c*q*r+R/q0^0_3y4^4{4|4}7f7z9v:l=b=n=o!d.e(s)a*Y*b.g.h.l/Y/f/v0p1]3`4S4_4c5h7R7U7m7p7}8P9i9q9w:q:u;W;];h=z={U/c*Q.e7Xa7X3u7Z7[7`9]:h:k;kQ0Z*qQ3a.gU4t0Z3a9`R9`7Z|*S$v)c*q*r+R/b/q0^0_3y4^4s4{4|4}7f7z9v:l=b=n=o!h.f(s)a*Y*b.g.h.l/Y/f/v0p1]3^3`4S4_4c5h7R7S7U7m7p7}8P9i9q9w:q:u;W;];h=z={U/e*S.f7Ye7Y3u7Z7[7`9]9^:h:i:k;kQ0]*rQ3b.hU4v0]3b9aR9a7[Q*w%UR0a*wQ5S0pR8O5SQ+[%jR0o+[Q5l1bS8_5l:OR:O8`Q,V&]R1e,VQ5q1gR8b5qQ1s,aS6R1s8oR8o6TQ1O+oW5_1O5a8V9zQ5a1RQ8V5`R9z8WQ+t&PR1U+tQ2V,sR6c2VYrOXst#dQ&t!ZQ+^%lQ,m&pQ,o&rQ,p&sQ,r&uQ2Q,nS2T,s2VR6b2SQ%npQ&x!_Q&{!aQ&}!bQ'P!cQ'o!uQ+]%kQ+i%yQ+{&VQ,c&kQ,z&zW-k'i'q'r'uQ-r'mQ0R*kQ0y+jS1v,d,gQ2_,yQ2`,|Q2a,}Q2u-jW2w-m-n-q-sQ5W0zQ5d1XQ5g1]Q5{1mQ6V1xQ6a2RU6p2v2y2|Q6s2zQ8R5XQ8Z5fQ8[5hQ8a5pQ8j5|Q8p6US9P6q6uQ9R6tQ9{8XQ:U8kQ:Z8qQ:b9QQ:x9|Q;O:VQ;S:cR;a;PQ%yyQ'b!iQ'm!uU+j%z%{%|Q-R'TU-f'c'd'eS-j'i'sQ/z*gS0z+k+lQ2g-TS2s-g-hQ2z-oS4g/{0OQ5X0{Q6l2mQ6o2tQ6t2{U7q4i4j4mQ9o7sR:r9pS$wi=pR*x%VU%Ui%V=pR0`*vQ$viS(s#v+fS)a$b$cQ)c$dQ*Y$xS*b${*WQ*q%OQ*r%QQ*|%]Q*}%^Q+R%bQ.g<aQ.h<cQ.j<gQ.k<iQ.l<kQ/Y)wQ/b*PQ/d*RQ/f*TQ/q*^S/v*d/hQ0^*tQ0_*ul0p+c,Q.a1a1i3Z5x6|8f9V:S:f:};VQ1]+}Q3^<tQ3_<vQ3`<yS3u<^<_Q3y.zS4S/_4UQ4^/rQ4_/sQ4c/uQ4s0YQ4u0[Q4{0gQ4|0hQ4}0iQ5h1^Q7R<}Q7S=PQ7T=RQ7U=TQ7Z<bQ7[<dQ7^<hQ7_<jQ7`<lQ7f4VQ7m4aQ7p4fQ7z4wQ7}5RQ8P5UQ9]<zQ9^<uQ9_<wQ9i7lQ9q7vQ9v7|Q9w8QQ:h=OQ:i=QQ:j=SQ:k=UQ:l9eQ:q9nQ:u9tQ;W=XQ;]:tQ;h;^Q;k=YQ=b=pQ=n=xQ=o=yQ=z=|R={=}Q*z%[Q.i<eR7]<fnpOXst!Z#d%l&p&r&s&u,n,s2S2VQ!fPS#fZ#oQ&z!`W'f!o*f0V4qQ'}#SQ)O#{Q)p$nS,g&i&lQ,l&mQ,y&yS-O'R/iQ-b'`Q.s(|Q/V)qQ0m+YQ0s+dQ2O,kQ2q-dQ3X.bQ4O/QQ4y0dQ5v1jQ6X1zQ6Y1{Q6^1}Q6`2PQ6e2XQ7P3[Q7c3{Q8h5yQ8t6ZQ8u6[Q8w6_Q9Z7QQ:T8iR:_8x#[cOPXZst!Z!`!o#d#o#{%l&i&l&m&p&r&s&u&y'R'`(|*f+Y+d,k,n,s-d.b/i0V0d1j1z1{1}2P2S2V2X3[4q5y6Z6[6_7Q8i8xQ#YWQ#eYQ%puQ%rvS%tw!gS(Q#W(TQ(W#ZQ(r#uQ(w#xQ)P$OQ)Q$PQ)R$QQ)S$RQ)T$SQ)U$TQ)V$UQ)W$VQ)X$WQ)Y$XQ)[$ZQ)^$_Q)`$aQ)e$eW)o$n)q/Q3{Q+a%sQ+u&QS-U'V2hQ-s'pS-x(R-zQ-}(ZQ.P(bQ.n(vQ.q(xQ.u;vQ.w;yQ.x;zQ.y;}Q/]){Q0j+UQ2c-PQ2f-SQ2v-lQ2}.QQ3c.oQ3h<OQ3i<PQ3j<QQ3k<RQ3l<SQ3m<TQ3n<UQ3o<VQ3p<WQ3q<XQ3r<YQ3s.vQ3t<]Q3w<`Q3x<mQ4P<ZQ5O0lQ5Y0|Q6k<pQ6q2xQ6v3OQ7V3dQ7W<qQ7a<sQ7b<{Q8`5mQ8|6iQ9Q6rQ9[<|Q9b=VQ9c=WQ:c9SQ:y9}Q;R:aQ;x#SR=g=sR#[WR'X!el!tQ!r!v!y!z'^'j'k'l-`-p1g5q5sS'T!e-WU*g$|*X*lS-T'U']S0O*h*nQ0W*oQ2m-^Q4m0UR4r0XR(y#xQ!fQT-_'^-`]!qQ!r'^-`1g5qQ#p]R'g;wR)d$dY!uQ'^-`1g5qQ'i!rS's!v!yS'u!z5sS-o'j'kQ-q'lR2{-pT#kZ%dS#jZ%dS%jm,jU(e#h#i#lS.T(f(gQ.X(hQ0n+ZQ3Q.UU3R.V.W.YS6x3S3TR9T6yd#^W#W#Z%g(R([*W+W.O/hr#gZm#h#i#l%d(f(g(h+Z.U.V.W.Y3S3T6yS*Z$x*_Q/o*[Q1|,jQ2d-QQ4W/kQ6g2[Q7i4XQ8{6hT=_'V+XV#aW%g*WU#`W%g*WS(S#W([U(X#Z+W/hS-V'V+XT-y(R.OV'[!e%h*XQ$lfR)v$qT)k$l)lR3}/PT*]$x*_T*e${*WQ0q+cQ1_,QQ3V.aQ5j1aQ5u1iQ6}3ZQ8g5xQ9W6|Q:Q8fQ:d9VQ:|:SQ;U:fQ;`:}R;c;VnqOXst!Z#d%l&p&r&s&u,n,s2S2VQ&j!VR,c&gtmOXst!U!V!Z#d%l&g&p&r&s&u,n,s2S2VR,j&mT%km,jR1c,SR,b&eQ&T|R+z&UR+p&OT&n!W&qT&o!W&qT2U,s2V",
  nodeNames: "\u26A0 ArithOp ArithOp ?. JSXStartTag LineComment BlockComment Script Hashbang ExportDeclaration export Star as VariableName String Escape from ; default FunctionDeclaration async function VariableDefinition > < TypeParamList in out const TypeDefinition extends ThisType this LiteralType ArithOp Number BooleanLiteral TemplateType InterpolationEnd Interpolation InterpolationStart NullType null VoidType void TypeofType typeof MemberExpression . PropertyName [ TemplateString Escape Interpolation super RegExp ] ArrayExpression Spread , } { ObjectExpression Property async get set PropertyDefinition Block : NewTarget new NewExpression ) ( ArgList UnaryExpression delete LogicOp BitOp YieldExpression yield AwaitExpression await ParenthesizedExpression ClassExpression class ClassBody MethodDeclaration Decorator @ MemberExpression PrivatePropertyName CallExpression TypeArgList CompareOp < declare Privacy static abstract override PrivatePropertyDefinition PropertyDeclaration readonly accessor Optional TypeAnnotation Equals StaticBlock FunctionExpression ArrowFunction ParamList ParamList ArrayPattern ObjectPattern PatternProperty Privacy readonly Arrow MemberExpression BinaryExpression ArithOp ArithOp ArithOp ArithOp BitOp CompareOp instanceof satisfies CompareOp BitOp BitOp BitOp LogicOp LogicOp ConditionalExpression LogicOp LogicOp AssignmentExpression UpdateOp PostfixExpression CallExpression InstantiationExpression TaggedTemplateExpression DynamicImport import ImportMeta JSXElement JSXSelfCloseEndTag JSXSelfClosingTag JSXIdentifier JSXBuiltin JSXIdentifier JSXNamespacedName JSXMemberExpression JSXSpreadAttribute JSXAttribute JSXAttributeValue JSXEscape JSXEndTag JSXOpenTag JSXFragmentTag JSXText JSXEscape JSXStartCloseTag JSXCloseTag PrefixCast < ArrowFunction TypeParamList SequenceExpression InstantiationExpression KeyofType keyof UniqueType unique ImportType InferredType infer TypeName ParenthesizedType FunctionSignature ParamList NewSignature IndexedType TupleType Label ArrayType ReadonlyType ObjectType MethodType PropertyType IndexSignature PropertyDefinition CallSignature TypePredicate asserts is NewSignature new UnionType LogicOp IntersectionType LogicOp ConditionalType ParameterizedType ClassDeclaration abstract implements type VariableDeclaration let var using TypeAliasDeclaration InterfaceDeclaration interface EnumDeclaration enum EnumBody NamespaceDeclaration namespace module AmbientDeclaration declare GlobalDeclaration global ClassDeclaration ClassBody AmbientFunctionDeclaration ExportGroup VariableName VariableName ImportDeclaration ImportGroup ForStatement for ForSpec ForInSpec ForOfSpec of WhileStatement while WithStatement with DoStatement do IfStatement if else SwitchStatement switch SwitchBody CaseLabel case DefaultLabel TryStatement try CatchClause catch FinallyClause finally ReturnStatement return ThrowStatement throw BreakStatement break ContinueStatement continue DebuggerStatement debugger LabeledStatement ExpressionStatement SingleExpression SingleClassItem",
  maxTerm: 379,
  context: trackNewline,
  nodeProps: [
    ["isolate", -8, 5, 6, 14, 37, 39, 51, 53, 55, ""],
    ["group", -26, 9, 17, 19, 68, 207, 211, 215, 216, 218, 221, 224, 234, 236, 242, 244, 246, 248, 251, 257, 263, 265, 267, 269, 271, 273, 274, "Statement", -34, 13, 14, 32, 35, 36, 42, 51, 54, 55, 57, 62, 70, 72, 76, 80, 82, 84, 85, 110, 111, 120, 121, 136, 139, 141, 142, 143, 144, 145, 147, 148, 167, 169, 171, "Expression", -23, 31, 33, 37, 41, 43, 45, 173, 175, 177, 178, 180, 181, 182, 184, 185, 186, 188, 189, 190, 201, 203, 205, 206, "Type", -3, 88, 103, 109, "ClassItem"],
    ["openedBy", 23, "<", 38, "InterpolationStart", 56, "[", 60, "{", 73, "(", 160, "JSXStartCloseTag"],
    ["closedBy", -2, 24, 168, ">", 40, "InterpolationEnd", 50, "]", 61, "}", 74, ")", 165, "JSXEndTag"]
  ],
  propSources: [jsHighlight],
  skippedNodes: [0, 5, 6, 277],
  repeatNodeCount: 37,
  tokenData: "$Fq07[R!bOX%ZXY+gYZ-yZ[+g[]%Z]^.c^p%Zpq+gqr/mrs3cst:_tuEruvJSvwLkwx! Yxy!'iyz!(sz{!)}{|!,q|}!.O}!O!,q!O!P!/Y!P!Q!9j!Q!R#:O!R![#<_![!]#I_!]!^#Jk!^!_#Ku!_!`$![!`!a$$v!a!b$*T!b!c$,r!c!}Er!}#O$-|#O#P$/W#P#Q$4o#Q#R$5y#R#SEr#S#T$7W#T#o$8b#o#p$<r#p#q$=h#q#r$>x#r#s$@U#s$f%Z$f$g+g$g#BYEr#BY#BZ$A`#BZ$ISEr$IS$I_$A`$I_$I|Er$I|$I}$Dk$I}$JO$Dk$JO$JTEr$JT$JU$A`$JU$KVEr$KV$KW$A`$KW&FUEr&FU&FV$A`&FV;'SEr;'S;=`I|<%l?HTEr?HT?HU$A`?HUOEr(n%d_$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&j&hT$i&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c&j&zP;=`<%l&c'|'U]$i&j(Y!bOY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}!b(SU(Y!bOY'}Zw'}x#O'}#P;'S'};'S;=`(f<%lO'}!b(iP;=`<%l'}'|(oP;=`<%l&}'[(y]$i&j(VpOY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(rp)wU(VpOY)rZr)rs#O)r#P;'S)r;'S;=`*Z<%lO)rp*^P;=`<%l)r'[*dP;=`<%l(r#S*nX(Vp(Y!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g#S+^P;=`<%l*g(n+dP;=`<%l%Z07[+rq$i&j(Vp(Y!b'{0/lOX%ZXY+gYZ&cZ[+g[p%Zpq+gqr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p$f%Z$f$g+g$g#BY%Z#BY#BZ+g#BZ$IS%Z$IS$I_+g$I_$JT%Z$JT$JU+g$JU$KV%Z$KV$KW+g$KW&FU%Z&FU&FV+g&FV;'S%Z;'S;=`+a<%l?HT%Z?HT?HU+g?HUO%Z07[.ST(W#S$i&j'|0/lO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c07[.n_$i&j(Vp(Y!b'|0/lOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z)3p/x`$i&j!p),Q(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`0z!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KW1V`#v(Ch$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`2X!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KW2d_#v(Ch$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'At3l_(U':f$i&j(Y!bOY4kYZ5qZr4krs7nsw4kwx5qx!^4k!^!_8p!_#O4k#O#P5q#P#o4k#o#p8p#p;'S4k;'S;=`:X<%lO4k(^4r_$i&j(Y!bOY4kYZ5qZr4krs7nsw4kwx5qx!^4k!^!_8p!_#O4k#O#P5q#P#o4k#o#p8p#p;'S4k;'S;=`:X<%lO4k&z5vX$i&jOr5qrs6cs!^5q!^!_6y!_#o5q#o#p6y#p;'S5q;'S;=`7h<%lO5q&z6jT$d`$i&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c`6|TOr6yrs7]s;'S6y;'S;=`7b<%lO6y`7bO$d``7eP;=`<%l6y&z7kP;=`<%l5q(^7w]$d`$i&j(Y!bOY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}!r8uZ(Y!bOY8pYZ6yZr8prs9hsw8pwx6yx#O8p#O#P6y#P;'S8p;'S;=`:R<%lO8p!r9oU$d`(Y!bOY'}Zw'}x#O'}#P;'S'};'S;=`(f<%lO'}!r:UP;=`<%l8p(^:[P;=`<%l4k%9[:hh$i&j(Vp(Y!bOY%ZYZ&cZq%Zqr<Srs&}st%ZtuCruw%Zwx(rx!^%Z!^!_*g!_!c%Z!c!}Cr!}#O%Z#O#P&c#P#R%Z#R#SCr#S#T%Z#T#oCr#o#p*g#p$g%Z$g;'SCr;'S;=`El<%lOCr(r<__WS$i&j(Vp(Y!bOY<SYZ&cZr<Srs=^sw<Swx@nx!^<S!^!_Bm!_#O<S#O#P>`#P#o<S#o#pBm#p;'S<S;'S;=`Cl<%lO<S(Q=g]WS$i&j(Y!bOY=^YZ&cZw=^wx>`x!^=^!^!_?q!_#O=^#O#P>`#P#o=^#o#p?q#p;'S=^;'S;=`@h<%lO=^&n>gXWS$i&jOY>`YZ&cZ!^>`!^!_?S!_#o>`#o#p?S#p;'S>`;'S;=`?k<%lO>`S?XSWSOY?SZ;'S?S;'S;=`?e<%lO?SS?hP;=`<%l?S&n?nP;=`<%l>`!f?xWWS(Y!bOY?qZw?qwx?Sx#O?q#O#P?S#P;'S?q;'S;=`@b<%lO?q!f@eP;=`<%l?q(Q@kP;=`<%l=^'`@w]WS$i&j(VpOY@nYZ&cZr@nrs>`s!^@n!^!_Ap!_#O@n#O#P>`#P#o@n#o#pAp#p;'S@n;'S;=`Bg<%lO@ntAwWWS(VpOYApZrAprs?Ss#OAp#O#P?S#P;'SAp;'S;=`Ba<%lOAptBdP;=`<%lAp'`BjP;=`<%l@n#WBvYWS(Vp(Y!bOYBmZrBmrs?qswBmwxApx#OBm#O#P?S#P;'SBm;'S;=`Cf<%lOBm#WCiP;=`<%lBm(rCoP;=`<%l<S%9[C}i$i&j(n%1l(Vp(Y!bOY%ZYZ&cZr%Zrs&}st%ZtuCruw%Zwx(rx!Q%Z!Q![Cr![!^%Z!^!_*g!_!c%Z!c!}Cr!}#O%Z#O#P&c#P#R%Z#R#SCr#S#T%Z#T#oCr#o#p*g#p$g%Z$g;'SCr;'S;=`El<%lOCr%9[EoP;=`<%lCr07[FRk$i&j(Vp(Y!b$]#t(S,2j(d$I[OY%ZYZ&cZr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$g%Z$g;'SEr;'S;=`I|<%lOEr+dHRk$i&j(Vp(Y!b$]#tOY%ZYZ&cZr%Zrs&}st%ZtuGvuw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Gv![!^%Z!^!_*g!_!c%Z!c!}Gv!}#O%Z#O#P&c#P#R%Z#R#SGv#S#T%Z#T#oGv#o#p*g#p$g%Z$g;'SGv;'S;=`Iv<%lOGv+dIyP;=`<%lGv07[JPP;=`<%lEr(KWJ_`$i&j(Vp(Y!b#p(ChOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KWKl_$i&j$Q(Ch(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z,#xLva(y+JY$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sv%ZvwM{wx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KWNW`$i&j#z(Ch(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'At! c_(X';W$i&j(VpOY!!bYZ!#hZr!!brs!#hsw!!bwx!$xx!^!!b!^!_!%z!_#O!!b#O#P!#h#P#o!!b#o#p!%z#p;'S!!b;'S;=`!'c<%lO!!b'l!!i_$i&j(VpOY!!bYZ!#hZr!!brs!#hsw!!bwx!$xx!^!!b!^!_!%z!_#O!!b#O#P!#h#P#o!!b#o#p!%z#p;'S!!b;'S;=`!'c<%lO!!b&z!#mX$i&jOw!#hwx6cx!^!#h!^!_!$Y!_#o!#h#o#p!$Y#p;'S!#h;'S;=`!$r<%lO!#h`!$]TOw!$Ywx7]x;'S!$Y;'S;=`!$l<%lO!$Y`!$oP;=`<%l!$Y&z!$uP;=`<%l!#h'l!%R]$d`$i&j(VpOY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(r!Q!&PZ(VpOY!%zYZ!$YZr!%zrs!$Ysw!%zwx!&rx#O!%z#O#P!$Y#P;'S!%z;'S;=`!']<%lO!%z!Q!&yU$d`(VpOY)rZr)rs#O)r#P;'S)r;'S;=`*Z<%lO)r!Q!'`P;=`<%l!%z'l!'fP;=`<%l!!b/5|!'t_!l/.^$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z#&U!)O_!k!Lf$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z-!n!*[b$i&j(Vp(Y!b(T%&f#q(ChOY%ZYZ&cZr%Zrs&}sw%Zwx(rxz%Zz{!+d{!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KW!+o`$i&j(Vp(Y!b#n(ChOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z+;x!,|`$i&j(Vp(Y!br+4YOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z,$U!.Z_!]+Jf$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z07[!/ec$i&j(Vp(Y!b!Q.2^OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!0p!P!Q%Z!Q![!3Y![!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z#%|!0ya$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!2O!P!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z#%|!2Z_![!L^$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad!3eg$i&j(Vp(Y!bs'9tOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!3Y![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S!3Y#S#X%Z#X#Y!4|#Y#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad!5Vg$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx{%Z{|!6n|}%Z}!O!6n!O!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad!6wc$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad!8_c$i&j(Vp(Y!bs'9tOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z07[!9uf$i&j(Vp(Y!b#o(ChOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Lcxz!;Zz{#-}{!P!;Z!P!Q#/d!Q!^!;Z!^!_#(i!_!`#7S!`!a#8i!a!}!;Z!}#O#,f#O#P!Dy#P#o!;Z#o#p#(i#p;'S!;Z;'S;=`#-w<%lO!;Z?O!;fb$i&j(Vp(Y!b!X7`OY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Lcx!P!;Z!P!Q#&`!Q!^!;Z!^!_#(i!_!}!;Z!}#O#,f#O#P!Dy#P#o!;Z#o#p#(i#p;'S!;Z;'S;=`#-w<%lO!;Z>^!<w`$i&j(Y!b!X7`OY!<nYZ&cZw!<nwx!=yx!P!<n!P!Q!Eq!Q!^!<n!^!_!Gr!_!}!<n!}#O!KS#O#P!Dy#P#o!<n#o#p!Gr#p;'S!<n;'S;=`!L]<%lO!<n<z!>Q^$i&j!X7`OY!=yYZ&cZ!P!=y!P!Q!>|!Q!^!=y!^!_!@c!_!}!=y!}#O!CW#O#P!Dy#P#o!=y#o#p!@c#p;'S!=y;'S;=`!Ek<%lO!=y<z!?Td$i&j!X7`O!^&c!_#W&c#W#X!>|#X#Z&c#Z#[!>|#[#]&c#]#^!>|#^#a&c#a#b!>|#b#g&c#g#h!>|#h#i&c#i#j!>|#j#k!>|#k#m&c#m#n!>|#n#o&c#p;'S&c;'S;=`&w<%lO&c7`!@hX!X7`OY!@cZ!P!@c!P!Q!AT!Q!}!@c!}#O!Ar#O#P!Bq#P;'S!@c;'S;=`!CQ<%lO!@c7`!AYW!X7`#W#X!AT#Z#[!AT#]#^!AT#a#b!AT#g#h!AT#i#j!AT#j#k!AT#m#n!AT7`!AuVOY!ArZ#O!Ar#O#P!B[#P#Q!@c#Q;'S!Ar;'S;=`!Bk<%lO!Ar7`!B_SOY!ArZ;'S!Ar;'S;=`!Bk<%lO!Ar7`!BnP;=`<%l!Ar7`!BtSOY!@cZ;'S!@c;'S;=`!CQ<%lO!@c7`!CTP;=`<%l!@c<z!C][$i&jOY!CWYZ&cZ!^!CW!^!_!Ar!_#O!CW#O#P!DR#P#Q!=y#Q#o!CW#o#p!Ar#p;'S!CW;'S;=`!Ds<%lO!CW<z!DWX$i&jOY!CWYZ&cZ!^!CW!^!_!Ar!_#o!CW#o#p!Ar#p;'S!CW;'S;=`!Ds<%lO!CW<z!DvP;=`<%l!CW<z!EOX$i&jOY!=yYZ&cZ!^!=y!^!_!@c!_#o!=y#o#p!@c#p;'S!=y;'S;=`!Ek<%lO!=y<z!EnP;=`<%l!=y>^!Ezl$i&j(Y!b!X7`OY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#W&}#W#X!Eq#X#Z&}#Z#[!Eq#[#]&}#]#^!Eq#^#a&}#a#b!Eq#b#g&}#g#h!Eq#h#i&}#i#j!Eq#j#k!Eq#k#m&}#m#n!Eq#n#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}8r!GyZ(Y!b!X7`OY!GrZw!Grwx!@cx!P!Gr!P!Q!Hl!Q!}!Gr!}#O!JU#O#P!Bq#P;'S!Gr;'S;=`!J|<%lO!Gr8r!Hse(Y!b!X7`OY'}Zw'}x#O'}#P#W'}#W#X!Hl#X#Z'}#Z#[!Hl#[#]'}#]#^!Hl#^#a'}#a#b!Hl#b#g'}#g#h!Hl#h#i'}#i#j!Hl#j#k!Hl#k#m'}#m#n!Hl#n;'S'};'S;=`(f<%lO'}8r!JZX(Y!bOY!JUZw!JUwx!Arx#O!JU#O#P!B[#P#Q!Gr#Q;'S!JU;'S;=`!Jv<%lO!JU8r!JyP;=`<%l!JU8r!KPP;=`<%l!Gr>^!KZ^$i&j(Y!bOY!KSYZ&cZw!KSwx!CWx!^!KS!^!_!JU!_#O!KS#O#P!DR#P#Q!<n#Q#o!KS#o#p!JU#p;'S!KS;'S;=`!LV<%lO!KS>^!LYP;=`<%l!KS>^!L`P;=`<%l!<n=l!Ll`$i&j(Vp!X7`OY!LcYZ&cZr!Lcrs!=ys!P!Lc!P!Q!Mn!Q!^!Lc!^!_# o!_!}!Lc!}#O#%P#O#P!Dy#P#o!Lc#o#p# o#p;'S!Lc;'S;=`#&Y<%lO!Lc=l!Mwl$i&j(Vp!X7`OY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#W(r#W#X!Mn#X#Z(r#Z#[!Mn#[#](r#]#^!Mn#^#a(r#a#b!Mn#b#g(r#g#h!Mn#h#i(r#i#j!Mn#j#k!Mn#k#m(r#m#n!Mn#n#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(r8Q# vZ(Vp!X7`OY# oZr# ors!@cs!P# o!P!Q#!i!Q!}# o!}#O#$R#O#P!Bq#P;'S# o;'S;=`#$y<%lO# o8Q#!pe(Vp!X7`OY)rZr)rs#O)r#P#W)r#W#X#!i#X#Z)r#Z#[#!i#[#])r#]#^#!i#^#a)r#a#b#!i#b#g)r#g#h#!i#h#i)r#i#j#!i#j#k#!i#k#m)r#m#n#!i#n;'S)r;'S;=`*Z<%lO)r8Q#$WX(VpOY#$RZr#$Rrs!Ars#O#$R#O#P!B[#P#Q# o#Q;'S#$R;'S;=`#$s<%lO#$R8Q#$vP;=`<%l#$R8Q#$|P;=`<%l# o=l#%W^$i&j(VpOY#%PYZ&cZr#%Prs!CWs!^#%P!^!_#$R!_#O#%P#O#P!DR#P#Q!Lc#Q#o#%P#o#p#$R#p;'S#%P;'S;=`#&S<%lO#%P=l#&VP;=`<%l#%P=l#&]P;=`<%l!Lc?O#&kn$i&j(Vp(Y!b!X7`OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#W%Z#W#X#&`#X#Z%Z#Z#[#&`#[#]%Z#]#^#&`#^#a%Z#a#b#&`#b#g%Z#g#h#&`#h#i%Z#i#j#&`#j#k#&`#k#m%Z#m#n#&`#n#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z9d#(r](Vp(Y!b!X7`OY#(iZr#(irs!Grsw#(iwx# ox!P#(i!P!Q#)k!Q!}#(i!}#O#+`#O#P!Bq#P;'S#(i;'S;=`#,`<%lO#(i9d#)th(Vp(Y!b!X7`OY*gZr*grs'}sw*gwx)rx#O*g#P#W*g#W#X#)k#X#Z*g#Z#[#)k#[#]*g#]#^#)k#^#a*g#a#b#)k#b#g*g#g#h#)k#h#i*g#i#j#)k#j#k#)k#k#m*g#m#n#)k#n;'S*g;'S;=`+Z<%lO*g9d#+gZ(Vp(Y!bOY#+`Zr#+`rs!JUsw#+`wx#$Rx#O#+`#O#P!B[#P#Q#(i#Q;'S#+`;'S;=`#,Y<%lO#+`9d#,]P;=`<%l#+`9d#,cP;=`<%l#(i?O#,o`$i&j(Vp(Y!bOY#,fYZ&cZr#,frs!KSsw#,fwx#%Px!^#,f!^!_#+`!_#O#,f#O#P!DR#P#Q!;Z#Q#o#,f#o#p#+`#p;'S#,f;'S;=`#-q<%lO#,f?O#-tP;=`<%l#,f?O#-zP;=`<%l!;Z07[#.[b$i&j(Vp(Y!b'}0/l!X7`OY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Lcx!P!;Z!P!Q#&`!Q!^!;Z!^!_#(i!_!}!;Z!}#O#,f#O#P!Dy#P#o!;Z#o#p#(i#p;'S!;Z;'S;=`#-w<%lO!;Z07[#/o_$i&j(Vp(Y!bT0/lOY#/dYZ&cZr#/drs#0nsw#/dwx#4Ox!^#/d!^!_#5}!_#O#/d#O#P#1p#P#o#/d#o#p#5}#p;'S#/d;'S;=`#6|<%lO#/d06j#0w]$i&j(Y!bT0/lOY#0nYZ&cZw#0nwx#1px!^#0n!^!_#3R!_#O#0n#O#P#1p#P#o#0n#o#p#3R#p;'S#0n;'S;=`#3x<%lO#0n05W#1wX$i&jT0/lOY#1pYZ&cZ!^#1p!^!_#2d!_#o#1p#o#p#2d#p;'S#1p;'S;=`#2{<%lO#1p0/l#2iST0/lOY#2dZ;'S#2d;'S;=`#2u<%lO#2d0/l#2xP;=`<%l#2d05W#3OP;=`<%l#1p01O#3YW(Y!bT0/lOY#3RZw#3Rwx#2dx#O#3R#O#P#2d#P;'S#3R;'S;=`#3r<%lO#3R01O#3uP;=`<%l#3R06j#3{P;=`<%l#0n05x#4X]$i&j(VpT0/lOY#4OYZ&cZr#4Ors#1ps!^#4O!^!_#5Q!_#O#4O#O#P#1p#P#o#4O#o#p#5Q#p;'S#4O;'S;=`#5w<%lO#4O00^#5XW(VpT0/lOY#5QZr#5Qrs#2ds#O#5Q#O#P#2d#P;'S#5Q;'S;=`#5q<%lO#5Q00^#5tP;=`<%l#5Q05x#5zP;=`<%l#4O01p#6WY(Vp(Y!bT0/lOY#5}Zr#5}rs#3Rsw#5}wx#5Qx#O#5}#O#P#2d#P;'S#5};'S;=`#6v<%lO#5}01p#6yP;=`<%l#5}07[#7PP;=`<%l#/d)3h#7ab$i&j$Q(Ch(Vp(Y!b!X7`OY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Lcx!P!;Z!P!Q#&`!Q!^!;Z!^!_#(i!_!}!;Z!}#O#,f#O#P!Dy#P#o!;Z#o#p#(i#p;'S!;Z;'S;=`#-w<%lO!;ZAt#8vb$Z#t$i&j(Vp(Y!b!X7`OY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Lcx!P!;Z!P!Q#&`!Q!^!;Z!^!_#(i!_!}!;Z!}#O#,f#O#P!Dy#P#o!;Z#o#p#(i#p;'S!;Z;'S;=`#-w<%lO!;Z'Ad#:Zp$i&j(Vp(Y!bs'9tOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!3Y!P!Q%Z!Q![#<_![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S#<_#S#U%Z#U#V#?i#V#X%Z#X#Y!4|#Y#b%Z#b#c#>_#c#d#Bq#d#l%Z#l#m#Es#m#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad#<jk$i&j(Vp(Y!bs'9tOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!3Y!P!Q%Z!Q![#<_![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S#<_#S#X%Z#X#Y!4|#Y#b%Z#b#c#>_#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad#>j_$i&j(Vp(Y!bs'9tOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad#?rd$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!R#AQ!R!S#AQ!S!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#AQ#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad#A]f$i&j(Vp(Y!bs'9tOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!R#AQ!R!S#AQ!S!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#AQ#S#b%Z#b#c#>_#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad#Bzc$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!Y#DV!Y!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#DV#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad#Dbe$i&j(Vp(Y!bs'9tOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!Y#DV!Y!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#DV#S#b%Z#b#c#>_#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad#E|g$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![#Ge![!^%Z!^!_*g!_!c%Z!c!i#Ge!i#O%Z#O#P&c#P#R%Z#R#S#Ge#S#T%Z#T#Z#Ge#Z#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'Ad#Gpi$i&j(Vp(Y!bs'9tOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![#Ge![!^%Z!^!_*g!_!c%Z!c!i#Ge!i#O%Z#O#P&c#P#R%Z#R#S#Ge#S#T%Z#T#Z#Ge#Z#b%Z#b#c#>_#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z*)x#Il_!g$b$i&j$O)Lv(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z)[#Jv_al$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z04f#LS^h#)`#R-<U(Vp(Y!b$n7`OY*gZr*grs'}sw*gwx)rx!P*g!P!Q#MO!Q!^*g!^!_#Mt!_!`$ f!`#O*g#P;'S*g;'S;=`+Z<%lO*g(n#MXX$k&j(Vp(Y!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g(El#M}Z#r(Ch(Vp(Y!bOY*gZr*grs'}sw*gwx)rx!_*g!_!`#Np!`#O*g#P;'S*g;'S;=`+Z<%lO*g(El#NyX$Q(Ch(Vp(Y!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g(El$ oX#s(Ch(Vp(Y!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g*)x$!ga#`*!Y$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`0z!`!a$#l!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(K[$#w_#k(Cl$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z*)x$%Vag!*r#s(Ch$f#|$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`$&[!`!a$'f!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KW$&g_#s(Ch$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KW$'qa#r(Ch$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`!a$(v!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KW$)R`#r(Ch$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(Kd$*`a(q(Ct$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!a%Z!a!b$+e!b#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KW$+p`$i&j#{(Ch(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#`$,}_!|$Ip$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z04f$.X_!S0,v$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(n$/]Z$i&jO!^$0O!^!_$0f!_#i$0O#i#j$0k#j#l$0O#l#m$2^#m#o$0O#o#p$0f#p;'S$0O;'S;=`$4i<%lO$0O(n$0VT_#S$i&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c#S$0kO_#S(n$0p[$i&jO!Q&c!Q![$1f![!^&c!_!c&c!c!i$1f!i#T&c#T#Z$1f#Z#o&c#o#p$3|#p;'S&c;'S;=`&w<%lO&c(n$1kZ$i&jO!Q&c!Q![$2^![!^&c!_!c&c!c!i$2^!i#T&c#T#Z$2^#Z#o&c#p;'S&c;'S;=`&w<%lO&c(n$2cZ$i&jO!Q&c!Q![$3U![!^&c!_!c&c!c!i$3U!i#T&c#T#Z$3U#Z#o&c#p;'S&c;'S;=`&w<%lO&c(n$3ZZ$i&jO!Q&c!Q![$0O![!^&c!_!c&c!c!i$0O!i#T&c#T#Z$0O#Z#o&c#p;'S&c;'S;=`&w<%lO&c#S$4PR!Q![$4Y!c!i$4Y#T#Z$4Y#S$4]S!Q![$4Y!c!i$4Y#T#Z$4Y#q#r$0f(n$4lP;=`<%l$0O#1[$4z_!Y#)l$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(KW$6U`#x(Ch$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z+;p$7c_$i&j(Vp(Y!b(`+4QOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z07[$8qk$i&j(Vp(Y!b(S,2j$_#t(d$I[OY%ZYZ&cZr%Zrs&}st%Ztu$8buw%Zwx(rx}%Z}!O$:f!O!Q%Z!Q![$8b![!^%Z!^!_*g!_!c%Z!c!}$8b!}#O%Z#O#P&c#P#R%Z#R#S$8b#S#T%Z#T#o$8b#o#p*g#p$g%Z$g;'S$8b;'S;=`$<l<%lO$8b+d$:qk$i&j(Vp(Y!b$_#tOY%ZYZ&cZr%Zrs&}st%Ztu$:fuw%Zwx(rx}%Z}!O$:f!O!Q%Z!Q![$:f![!^%Z!^!_*g!_!c%Z!c!}$:f!}#O%Z#O#P&c#P#R%Z#R#S$:f#S#T%Z#T#o$:f#o#p*g#p$g%Z$g;'S$:f;'S;=`$<f<%lO$:f+d$<iP;=`<%l$:f07[$<oP;=`<%l$8b#Jf$<{X!_#Hb(Vp(Y!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g,#x$=sa(x+JY$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p#q$+e#q;'S%Z;'S;=`+a<%lO%Z)>v$?V_!^(CdvBr$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z?O$@a_!q7`$i&j(Vp(Y!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z07[$Aq|$i&j(Vp(Y!b'{0/l$]#t(S,2j(d$I[OX%ZXY+gYZ&cZ[+g[p%Zpq+gqr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$f%Z$f$g+g$g#BYEr#BY#BZ$A`#BZ$ISEr$IS$I_$A`$I_$JTEr$JT$JU$A`$JU$KVEr$KV$KW$A`$KW&FUEr&FU&FV$A`&FV;'SEr;'S;=`I|<%l?HTEr?HT?HU$A`?HUOEr07[$D|k$i&j(Vp(Y!b'|0/l$]#t(S,2j(d$I[OY%ZYZ&cZr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$g%Z$g;'SEr;'S;=`I|<%lOEr",
  tokenizers: [noSemicolon, noSemicolonType, operatorToken, jsx2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, insertSemicolon, new LocalTokenGroup("$S~RRtu[#O#Pg#S#T#|~_P#o#pb~gOx~~jVO#i!P#i#j!U#j#l!P#l#m!q#m;'S!P;'S;=`#v<%lO!P~!UO!U~~!XS!Q![!e!c!i!e#T#Z!e#o#p#Z~!hR!Q![!q!c!i!q#T#Z!q~!tR!Q![!}!c!i!}#T#Z!}~#QR!Q![!P!c!i!P#T#Z!P~#^R!Q![#g!c!i#g#T#Z#g~#jS!Q![#g!c!i#g#T#Z#g#q#r!P~#yP;=`<%l!P~$RO(b~~", 141, 339), new LocalTokenGroup("j~RQYZXz{^~^O(P~~aP!P!Qd~iO(Q~~", 25, 322)],
  topRules: { "Script": [0, 7], "SingleExpression": [1, 275], "SingleClassItem": [2, 276] },
  dialects: { jsx: 0, ts: 15098 },
  dynamicPrecedences: { "80": 1, "82": 1, "94": 1, "169": 1, "199": 1 },
  specialized: [{ term: 326, get: (value) => spec_identifier[value] || -1 }, { term: 342, get: (value) => spec_word[value] || -1 }, { term: 95, get: (value) => spec_LessThan[value] || -1 }],
  tokenPrec: 15124
});
var snippets = [
  /* @__PURE__ */ snippetCompletion("function ${name}(${params}) {\n	${}\n}", {
    label: "function",
    detail: "definition",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("for (let ${index} = 0; ${index} < ${bound}; ${index}++) {\n	${}\n}", {
    label: "for",
    detail: "loop",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("for (let ${name} of ${collection}) {\n	${}\n}", {
    label: "for",
    detail: "of loop",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("do {\n	${}\n} while (${})", {
    label: "do",
    detail: "loop",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("while (${}) {\n	${}\n}", {
    label: "while",
    detail: "loop",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("try {\n	${}\n} catch (${error}) {\n	${}\n}", {
    label: "try",
    detail: "/ catch block",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("if (${}) {\n	${}\n}", {
    label: "if",
    detail: "block",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("if (${}) {\n	${}\n} else {\n	${}\n}", {
    label: "if",
    detail: "/ else block",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("class ${name} {\n	constructor(${params}) {\n		${}\n	}\n}", {
    label: "class",
    detail: "definition",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion('import {${names}} from "${module}"\n${}', {
    label: "import",
    detail: "named",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion('import ${name} from "${module}"\n${}', {
    label: "import",
    detail: "default",
    type: "keyword"
  })
];
var typescriptSnippets = /* @__PURE__ */ snippets.concat([
  /* @__PURE__ */ snippetCompletion("interface ${name} {\n	${}\n}", {
    label: "interface",
    detail: "definition",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("type ${name} = ${type}", {
    label: "type",
    detail: "definition",
    type: "keyword"
  }),
  /* @__PURE__ */ snippetCompletion("enum ${name} {\n	${}\n}", {
    label: "enum",
    detail: "definition",
    type: "keyword"
  })
]);
var cache = /* @__PURE__ */ new NodeWeakMap();
var ScopeNodes = /* @__PURE__ */ new Set([
  "Script",
  "Block",
  "FunctionExpression",
  "FunctionDeclaration",
  "ArrowFunction",
  "MethodDeclaration",
  "ForStatement"
]);
function defID(type) {
  return (node, def) => {
    let id2 = node.node.getChild("VariableDefinition");
    if (id2)
      def(id2, type);
    return true;
  };
}
var functionContext = ["FunctionDeclaration"];
var gatherCompletions = {
  FunctionDeclaration: /* @__PURE__ */ defID("function"),
  ClassDeclaration: /* @__PURE__ */ defID("class"),
  ClassExpression: () => true,
  EnumDeclaration: /* @__PURE__ */ defID("constant"),
  TypeAliasDeclaration: /* @__PURE__ */ defID("type"),
  NamespaceDeclaration: /* @__PURE__ */ defID("namespace"),
  VariableDefinition(node, def) {
    if (!node.matchContext(functionContext))
      def(node, "variable");
  },
  TypeDefinition(node, def) {
    def(node, "type");
  },
  __proto__: null
};
function getScope(doc, node) {
  let cached = cache.get(node);
  if (cached)
    return cached;
  let completions = [], top = true;
  function def(node2, type) {
    let name = doc.sliceString(node2.from, node2.to);
    completions.push({ label: name, type });
  }
  node.cursor(IterMode.IncludeAnonymous).iterate((node2) => {
    if (top) {
      top = false;
    } else if (node2.name) {
      let gather = gatherCompletions[node2.name];
      if (gather && gather(node2, def) || ScopeNodes.has(node2.name))
        return false;
    } else if (node2.to - node2.from > 8192) {
      for (let c of getScope(doc, node2.node))
        completions.push(c);
      return false;
    }
  });
  cache.set(node, completions);
  return completions;
}
var Identifier = /^[\w$\xa1-\uffff][\w$\d\xa1-\uffff]*$/;
var dontComplete = [
  "TemplateString",
  "String",
  "RegExp",
  "LineComment",
  "BlockComment",
  "VariableDefinition",
  "TypeDefinition",
  "Label",
  "PropertyDefinition",
  "PropertyName",
  "PrivatePropertyDefinition",
  "PrivatePropertyName",
  "JSXText",
  "JSXAttributeValue",
  "JSXOpenTag",
  "JSXCloseTag",
  "JSXSelfClosingTag",
  ".",
  "?."
];
function localCompletionSource(context) {
  let inner = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (dontComplete.indexOf(inner.name) > -1)
    return null;
  let isWord = inner.name == "VariableName" || inner.to - inner.from < 20 && Identifier.test(context.state.sliceDoc(inner.from, inner.to));
  if (!isWord && !context.explicit)
    return null;
  let options = [];
  for (let pos = inner; pos; pos = pos.parent) {
    if (ScopeNodes.has(pos.name))
      options = options.concat(getScope(context.state.doc, pos));
  }
  return {
    options,
    from: isWord ? inner.from : context.pos,
    validFor: Identifier
  };
}
var javascriptLanguage = /* @__PURE__ */ LRLanguage.define({
  name: "javascript",
  parser: /* @__PURE__ */ parser3.configure({
    props: [
      /* @__PURE__ */ indentNodeProp.add({
        IfStatement: /* @__PURE__ */ continuedIndent({ except: /^\s*({|else\b)/ }),
        TryStatement: /* @__PURE__ */ continuedIndent({ except: /^\s*({|catch\b|finally\b)/ }),
        LabeledStatement: flatIndent,
        SwitchBody: (context) => {
          let after = context.textAfter, closed = /^\s*\}/.test(after), isCase = /^\s*(case|default)\b/.test(after);
          return context.baseIndent + (closed ? 0 : isCase ? 1 : 2) * context.unit;
        },
        Block: /* @__PURE__ */ delimitedIndent({ closing: "}" }),
        ArrowFunction: (cx) => cx.baseIndent + cx.unit,
        "TemplateString BlockComment": () => null,
        "Statement Property": /* @__PURE__ */ continuedIndent({ except: /^\s*{/ }),
        JSXElement(context) {
          let closed = /^\s*<\//.test(context.textAfter);
          return context.lineIndent(context.node.from) + (closed ? 0 : context.unit);
        },
        JSXEscape(context) {
          let closed = /\s*\}/.test(context.textAfter);
          return context.lineIndent(context.node.from) + (closed ? 0 : context.unit);
        },
        "JSXOpenTag JSXSelfClosingTag"(context) {
          return context.column(context.node.from) + context.unit;
        }
      }),
      /* @__PURE__ */ foldNodeProp.add({
        "Block ClassBody SwitchBody EnumBody ObjectExpression ArrayExpression ObjectType": foldInside,
        BlockComment(tree) {
          return { from: tree.from + 2, to: tree.to - 2 };
        }
      })
    ]
  }),
  languageData: {
    closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*(?:case |default:|\{|\}|<\/)$/,
    wordChars: "$"
  }
});
var jsxSublanguage = {
  test: (node) => /^JSX/.test(node.name),
  facet: /* @__PURE__ */ defineLanguageFacet({ commentTokens: { block: { open: "{/*", close: "*/}" } } })
};
var typescriptLanguage = /* @__PURE__ */ javascriptLanguage.configure({ dialect: "ts" }, "typescript");
var jsxLanguage = /* @__PURE__ */ javascriptLanguage.configure({
  dialect: "jsx",
  props: [/* @__PURE__ */ sublanguageProp.add((n) => n.isTop ? [jsxSublanguage] : void 0)]
});
var tsxLanguage = /* @__PURE__ */ javascriptLanguage.configure({
  dialect: "jsx ts",
  props: [/* @__PURE__ */ sublanguageProp.add((n) => n.isTop ? [jsxSublanguage] : void 0)]
}, "typescript");
var kwCompletion = (name) => ({ label: name, type: "keyword" });
var keywords = /* @__PURE__ */ "break case const continue default delete export extends false finally in instanceof let new return static super switch this throw true typeof var yield".split(" ").map(kwCompletion);
var typescriptKeywords = /* @__PURE__ */ keywords.concat(/* @__PURE__ */ ["declare", "implements", "private", "protected", "public"].map(kwCompletion));
function javascript(config = {}) {
  let lang = config.jsx ? config.typescript ? tsxLanguage : jsxLanguage : config.typescript ? typescriptLanguage : javascriptLanguage;
  let completions = config.typescript ? typescriptSnippets.concat(typescriptKeywords) : snippets.concat(keywords);
  return new LanguageSupport(lang, [
    javascriptLanguage.data.of({
      autocomplete: ifNotIn(dontComplete, completeFromList(completions))
    }),
    javascriptLanguage.data.of({
      autocomplete: localCompletionSource
    }),
    config.jsx ? autoCloseTags : []
  ]);
}
function findOpenTag(node) {
  for (; ; ) {
    if (node.name == "JSXOpenTag" || node.name == "JSXSelfClosingTag" || node.name == "JSXFragmentTag")
      return node;
    if (node.name == "JSXEscape" || !node.parent)
      return null;
    node = node.parent;
  }
}
function elementName(doc, tree, max = doc.length) {
  for (let ch = tree === null || tree === void 0 ? void 0 : tree.firstChild; ch; ch = ch.nextSibling) {
    if (ch.name == "JSXIdentifier" || ch.name == "JSXBuiltin" || ch.name == "JSXNamespacedName" || ch.name == "JSXMemberExpression")
      return doc.sliceString(ch.from, Math.min(ch.to, max));
  }
  return "";
}
var android = typeof navigator == "object" && /* @__PURE__ */ /Android\b/.test(navigator.userAgent);
var autoCloseTags = /* @__PURE__ */ EditorView.inputHandler.of((view, from, to, text, defaultInsert) => {
  if ((android ? view.composing : view.compositionStarted) || view.state.readOnly || from != to || text != ">" && text != "/" || !javascriptLanguage.isActiveAt(view.state, from, -1))
    return false;
  let base = defaultInsert(), { state } = base;
  let closeTags = state.changeByRange((range) => {
    var _a;
    let { head } = range, around = syntaxTree(state).resolveInner(head - 1, -1), name;
    if (around.name == "JSXStartTag")
      around = around.parent;
    if (state.doc.sliceString(head - 1, head) != text || around.name == "JSXAttributeValue" && around.to > head) ;
    else if (text == ">" && around.name == "JSXFragmentTag") {
      return { range, changes: { from: head, insert: `</>` } };
    } else if (text == "/" && around.name == "JSXStartCloseTag") {
      let empty = around.parent, base2 = empty.parent;
      if (base2 && empty.from == head - 2 && ((name = elementName(state.doc, base2.firstChild, head)) || ((_a = base2.firstChild) === null || _a === void 0 ? void 0 : _a.name) == "JSXFragmentTag")) {
        let insert = `${name}>`;
        return { range: EditorSelection.cursor(head + insert.length, -1), changes: { from: head, insert } };
      }
    } else if (text == ">") {
      let openTag = findOpenTag(around);
      if (openTag && openTag.name == "JSXOpenTag" && !/^\/?>|^<\//.test(state.doc.sliceString(head, head + 2)) && (name = elementName(state.doc, openTag, head)))
        return { range, changes: { from: head, insert: `</${name}>` } };
    }
    return { range };
  });
  if (closeTags.changes.empty)
    return false;
  view.dispatch([
    base,
    state.update(closeTags, { userEvent: "input.complete", scrollIntoView: true })
  ]);
  return true;
});
var Targets = ["_blank", "_self", "_top", "_parent"];
var Charsets = ["ascii", "utf-8", "utf-16", "latin1", "latin1"];
var Methods = ["get", "post", "put", "delete"];
var Encs = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];
var Bool = ["true", "false"];
var S = {};
var Tags = {
  a: {
    attrs: {
      href: null,
      ping: null,
      type: null,
      media: null,
      target: Targets,
      hreflang: null
    }
  },
  abbr: S,
  address: S,
  area: {
    attrs: {
      alt: null,
      coords: null,
      href: null,
      target: null,
      ping: null,
      media: null,
      hreflang: null,
      type: null,
      shape: ["default", "rect", "circle", "poly"]
    }
  },
  article: S,
  aside: S,
  audio: {
    attrs: {
      src: null,
      mediagroup: null,
      crossorigin: ["anonymous", "use-credentials"],
      preload: ["none", "metadata", "auto"],
      autoplay: ["autoplay"],
      loop: ["loop"],
      controls: ["controls"]
    }
  },
  b: S,
  base: { attrs: { href: null, target: Targets } },
  bdi: S,
  bdo: S,
  blockquote: { attrs: { cite: null } },
  body: S,
  br: S,
  button: {
    attrs: {
      form: null,
      formaction: null,
      name: null,
      value: null,
      autofocus: ["autofocus"],
      disabled: ["autofocus"],
      formenctype: Encs,
      formmethod: Methods,
      formnovalidate: ["novalidate"],
      formtarget: Targets,
      type: ["submit", "reset", "button"]
    }
  },
  canvas: { attrs: { width: null, height: null } },
  caption: S,
  center: S,
  cite: S,
  code: S,
  col: { attrs: { span: null } },
  colgroup: { attrs: { span: null } },
  command: {
    attrs: {
      type: ["command", "checkbox", "radio"],
      label: null,
      icon: null,
      radiogroup: null,
      command: null,
      title: null,
      disabled: ["disabled"],
      checked: ["checked"]
    }
  },
  data: { attrs: { value: null } },
  datagrid: { attrs: { disabled: ["disabled"], multiple: ["multiple"] } },
  datalist: { attrs: { data: null } },
  dd: S,
  del: { attrs: { cite: null, datetime: null } },
  details: { attrs: { open: ["open"] } },
  dfn: S,
  div: S,
  dl: S,
  dt: S,
  em: S,
  embed: { attrs: { src: null, type: null, width: null, height: null } },
  eventsource: { attrs: { src: null } },
  fieldset: { attrs: { disabled: ["disabled"], form: null, name: null } },
  figcaption: S,
  figure: S,
  footer: S,
  form: {
    attrs: {
      action: null,
      name: null,
      "accept-charset": Charsets,
      autocomplete: ["on", "off"],
      enctype: Encs,
      method: Methods,
      novalidate: ["novalidate"],
      target: Targets
    }
  },
  h1: S,
  h2: S,
  h3: S,
  h4: S,
  h5: S,
  h6: S,
  head: {
    children: ["title", "base", "link", "style", "meta", "script", "noscript", "command"]
  },
  header: S,
  hgroup: S,
  hr: S,
  html: {
    attrs: { manifest: null }
  },
  i: S,
  iframe: {
    attrs: {
      src: null,
      srcdoc: null,
      name: null,
      width: null,
      height: null,
      sandbox: ["allow-top-navigation", "allow-same-origin", "allow-forms", "allow-scripts"],
      seamless: ["seamless"]
    }
  },
  img: {
    attrs: {
      alt: null,
      src: null,
      ismap: null,
      usemap: null,
      width: null,
      height: null,
      crossorigin: ["anonymous", "use-credentials"]
    }
  },
  input: {
    attrs: {
      alt: null,
      dirname: null,
      form: null,
      formaction: null,
      height: null,
      list: null,
      max: null,
      maxlength: null,
      min: null,
      name: null,
      pattern: null,
      placeholder: null,
      size: null,
      src: null,
      step: null,
      value: null,
      width: null,
      accept: ["audio/*", "video/*", "image/*"],
      autocomplete: ["on", "off"],
      autofocus: ["autofocus"],
      checked: ["checked"],
      disabled: ["disabled"],
      formenctype: Encs,
      formmethod: Methods,
      formnovalidate: ["novalidate"],
      formtarget: Targets,
      multiple: ["multiple"],
      readonly: ["readonly"],
      required: ["required"],
      type: [
        "hidden",
        "text",
        "search",
        "tel",
        "url",
        "email",
        "password",
        "datetime",
        "date",
        "month",
        "week",
        "time",
        "datetime-local",
        "number",
        "range",
        "color",
        "checkbox",
        "radio",
        "file",
        "submit",
        "image",
        "reset",
        "button"
      ]
    }
  },
  ins: { attrs: { cite: null, datetime: null } },
  kbd: S,
  keygen: {
    attrs: {
      challenge: null,
      form: null,
      name: null,
      autofocus: ["autofocus"],
      disabled: ["disabled"],
      keytype: ["RSA"]
    }
  },
  label: { attrs: { for: null, form: null } },
  legend: S,
  li: { attrs: { value: null } },
  link: {
    attrs: {
      href: null,
      type: null,
      hreflang: null,
      media: null,
      sizes: ["all", "16x16", "16x16 32x32", "16x16 32x32 64x64"]
    }
  },
  map: { attrs: { name: null } },
  mark: S,
  menu: { attrs: { label: null, type: ["list", "context", "toolbar"] } },
  meta: {
    attrs: {
      content: null,
      charset: Charsets,
      name: ["viewport", "application-name", "author", "description", "generator", "keywords"],
      "http-equiv": ["content-language", "content-type", "default-style", "refresh"]
    }
  },
  meter: { attrs: { value: null, min: null, low: null, high: null, max: null, optimum: null } },
  nav: S,
  noscript: S,
  object: {
    attrs: {
      data: null,
      type: null,
      name: null,
      usemap: null,
      form: null,
      width: null,
      height: null,
      typemustmatch: ["typemustmatch"]
    }
  },
  ol: {
    attrs: { reversed: ["reversed"], start: null, type: ["1", "a", "A", "i", "I"] },
    children: ["li", "script", "template", "ul", "ol"]
  },
  optgroup: { attrs: { disabled: ["disabled"], label: null } },
  option: { attrs: { disabled: ["disabled"], label: null, selected: ["selected"], value: null } },
  output: { attrs: { for: null, form: null, name: null } },
  p: S,
  param: { attrs: { name: null, value: null } },
  pre: S,
  progress: { attrs: { value: null, max: null } },
  q: { attrs: { cite: null } },
  rp: S,
  rt: S,
  ruby: S,
  samp: S,
  script: {
    attrs: {
      type: ["text/javascript"],
      src: null,
      async: ["async"],
      defer: ["defer"],
      charset: Charsets
    }
  },
  section: S,
  select: {
    attrs: {
      form: null,
      name: null,
      size: null,
      autofocus: ["autofocus"],
      disabled: ["disabled"],
      multiple: ["multiple"]
    }
  },
  slot: { attrs: { name: null } },
  small: S,
  source: { attrs: { src: null, type: null, media: null } },
  span: S,
  strong: S,
  style: {
    attrs: {
      type: ["text/css"],
      media: null,
      scoped: null
    }
  },
  sub: S,
  summary: S,
  sup: S,
  table: S,
  tbody: S,
  td: { attrs: { colspan: null, rowspan: null, headers: null } },
  template: S,
  textarea: {
    attrs: {
      dirname: null,
      form: null,
      maxlength: null,
      name: null,
      placeholder: null,
      rows: null,
      cols: null,
      autofocus: ["autofocus"],
      disabled: ["disabled"],
      readonly: ["readonly"],
      required: ["required"],
      wrap: ["soft", "hard"]
    }
  },
  tfoot: S,
  th: { attrs: { colspan: null, rowspan: null, headers: null, scope: ["row", "col", "rowgroup", "colgroup"] } },
  thead: S,
  time: { attrs: { datetime: null } },
  title: S,
  tr: S,
  track: {
    attrs: {
      src: null,
      label: null,
      default: null,
      kind: ["subtitles", "captions", "descriptions", "chapters", "metadata"],
      srclang: null
    }
  },
  ul: { children: ["li", "script", "template", "ul", "ol"] },
  var: S,
  video: {
    attrs: {
      src: null,
      poster: null,
      width: null,
      height: null,
      crossorigin: ["anonymous", "use-credentials"],
      preload: ["auto", "metadata", "none"],
      autoplay: ["autoplay"],
      mediagroup: ["movie"],
      muted: ["muted"],
      controls: ["controls"]
    }
  },
  wbr: S
};
var GlobalAttrs = {
  accesskey: null,
  class: null,
  contenteditable: Bool,
  contextmenu: null,
  dir: ["ltr", "rtl", "auto"],
  draggable: ["true", "false", "auto"],
  dropzone: ["copy", "move", "link", "string:", "file:"],
  hidden: ["hidden"],
  id: null,
  inert: ["inert"],
  itemid: null,
  itemprop: null,
  itemref: null,
  itemscope: ["itemscope"],
  itemtype: null,
  lang: ["ar", "bn", "de", "en-GB", "en-US", "es", "fr", "hi", "id", "ja", "pa", "pt", "ru", "tr", "zh"],
  spellcheck: Bool,
  autocorrect: Bool,
  autocapitalize: Bool,
  style: null,
  tabindex: null,
  title: null,
  translate: ["yes", "no"],
  rel: ["stylesheet", "alternate", "author", "bookmark", "help", "license", "next", "nofollow", "noreferrer", "prefetch", "prev", "search", "tag"],
  role: /* @__PURE__ */ "alert application article banner button cell checkbox complementary contentinfo dialog document feed figure form grid gridcell heading img list listbox listitem main navigation region row rowgroup search switch tab table tabpanel textbox timer".split(" "),
  "aria-activedescendant": null,
  "aria-atomic": Bool,
  "aria-autocomplete": ["inline", "list", "both", "none"],
  "aria-busy": Bool,
  "aria-checked": ["true", "false", "mixed", "undefined"],
  "aria-controls": null,
  "aria-describedby": null,
  "aria-disabled": Bool,
  "aria-dropeffect": null,
  "aria-expanded": ["true", "false", "undefined"],
  "aria-flowto": null,
  "aria-grabbed": ["true", "false", "undefined"],
  "aria-haspopup": Bool,
  "aria-hidden": Bool,
  "aria-invalid": ["true", "false", "grammar", "spelling"],
  "aria-label": null,
  "aria-labelledby": null,
  "aria-level": null,
  "aria-live": ["off", "polite", "assertive"],
  "aria-multiline": Bool,
  "aria-multiselectable": Bool,
  "aria-owns": null,
  "aria-posinset": null,
  "aria-pressed": ["true", "false", "mixed", "undefined"],
  "aria-readonly": Bool,
  "aria-relevant": null,
  "aria-required": Bool,
  "aria-selected": ["true", "false", "undefined"],
  "aria-setsize": null,
  "aria-sort": ["ascending", "descending", "none", "other"],
  "aria-valuemax": null,
  "aria-valuemin": null,
  "aria-valuenow": null,
  "aria-valuetext": null
};
var eventAttributes = /* @__PURE__ */ "beforeunload copy cut dragstart dragover dragleave dragenter dragend drag paste focus blur change click load mousedown mouseenter mouseleave mouseup keydown keyup resize scroll unload".split(" ").map((n) => "on" + n);
for (let a of eventAttributes)
  GlobalAttrs[a] = null;
var Schema = class {
  constructor(extraTags, extraAttrs) {
    this.tags = Object.assign(Object.assign({}, Tags), extraTags);
    this.globalAttrs = Object.assign(Object.assign({}, GlobalAttrs), extraAttrs);
    this.allTags = Object.keys(this.tags);
    this.globalAttrNames = Object.keys(this.globalAttrs);
  }
};
Schema.default = /* @__PURE__ */ new Schema();
function elementName2(doc, tree, max = doc.length) {
  if (!tree)
    return "";
  let tag = tree.firstChild;
  let name = tag && tag.getChild("TagName");
  return name ? doc.sliceString(name.from, Math.min(name.to, max)) : "";
}
function findParentElement(tree, skip = false) {
  for (; tree; tree = tree.parent)
    if (tree.name == "Element") {
      if (skip)
        skip = false;
      else
        return tree;
    }
  return null;
}
function allowedChildren(doc, tree, schema) {
  let parentInfo = schema.tags[elementName2(doc, findParentElement(tree))];
  return (parentInfo === null || parentInfo === void 0 ? void 0 : parentInfo.children) || schema.allTags;
}
function openTags(doc, tree) {
  let open = [];
  for (let parent = findParentElement(tree); parent && !parent.type.isTop; parent = findParentElement(parent.parent)) {
    let tagName = elementName2(doc, parent);
    if (tagName && parent.lastChild.name == "CloseTag")
      break;
    if (tagName && open.indexOf(tagName) < 0 && (tree.name == "EndTag" || tree.from >= parent.firstChild.to))
      open.push(tagName);
  }
  return open;
}
var identifier3 = /^[:\-\.\w\u00b7-\uffff]*$/;
function completeTag(state, schema, tree, from, to) {
  let end = /\s*>/.test(state.sliceDoc(to, to + 5)) ? "" : ">";
  let parent = findParentElement(tree, true);
  return {
    from,
    to,
    options: allowedChildren(state.doc, parent, schema).map((tagName) => ({ label: tagName, type: "type" })).concat(openTags(state.doc, tree).map((tag, i) => ({
      label: "/" + tag,
      apply: "/" + tag + end,
      type: "type",
      boost: 99 - i
    }))),
    validFor: /^\/?[:\-\.\w\u00b7-\uffff]*$/
  };
}
function completeCloseTag(state, tree, from, to) {
  let end = /\s*>/.test(state.sliceDoc(to, to + 5)) ? "" : ">";
  return {
    from,
    to,
    options: openTags(state.doc, tree).map((tag, i) => ({ label: tag, apply: tag + end, type: "type", boost: 99 - i })),
    validFor: identifier3
  };
}
function completeStartTag(state, schema, tree, pos) {
  let options = [], level = 0;
  for (let tagName of allowedChildren(state.doc, tree, schema))
    options.push({ label: "<" + tagName, type: "type" });
  for (let open of openTags(state.doc, tree))
    options.push({ label: "</" + open + ">", type: "type", boost: 99 - level++ });
  return { from: pos, to: pos, options, validFor: /^<\/?[:\-\.\w\u00b7-\uffff]*$/ };
}
function completeAttrName(state, schema, tree, from, to) {
  let elt = findParentElement(tree), info = elt ? schema.tags[elementName2(state.doc, elt)] : null;
  let localAttrs = info && info.attrs ? Object.keys(info.attrs) : [];
  let names = info && info.globalAttrs === false ? localAttrs : localAttrs.length ? localAttrs.concat(schema.globalAttrNames) : schema.globalAttrNames;
  return {
    from,
    to,
    options: names.map((attrName) => ({ label: attrName, type: "property" })),
    validFor: identifier3
  };
}
function completeAttrValue(state, schema, tree, from, to) {
  var _a;
  let nameNode = (_a = tree.parent) === null || _a === void 0 ? void 0 : _a.getChild("AttributeName");
  let options = [], token = void 0;
  if (nameNode) {
    let attrName = state.sliceDoc(nameNode.from, nameNode.to);
    let attrs = schema.globalAttrs[attrName];
    if (!attrs) {
      let elt = findParentElement(tree), info = elt ? schema.tags[elementName2(state.doc, elt)] : null;
      attrs = (info === null || info === void 0 ? void 0 : info.attrs) && info.attrs[attrName];
    }
    if (attrs) {
      let base = state.sliceDoc(from, to).toLowerCase(), quoteStart = '"', quoteEnd = '"';
      if (/^['"]/.test(base)) {
        token = base[0] == '"' ? /^[^"]*$/ : /^[^']*$/;
        quoteStart = "";
        quoteEnd = state.sliceDoc(to, to + 1) == base[0] ? "" : base[0];
        base = base.slice(1);
        from++;
      } else {
        token = /^[^\s<>='"]*$/;
      }
      for (let value of attrs)
        options.push({ label: value, apply: quoteStart + value + quoteEnd, type: "constant" });
    }
  }
  return { from, to, options, validFor: token };
}
function htmlCompletionFor(schema, context) {
  let { state, pos } = context, tree = syntaxTree(state).resolveInner(pos, -1), around = tree.resolve(pos);
  for (let scan = pos, before; around == tree && (before = tree.childBefore(scan)); ) {
    let last = before.lastChild;
    if (!last || !last.type.isError || last.from < last.to)
      break;
    around = tree = before;
    scan = last.from;
  }
  if (tree.name == "TagName") {
    return tree.parent && /CloseTag$/.test(tree.parent.name) ? completeCloseTag(state, tree, tree.from, pos) : completeTag(state, schema, tree, tree.from, pos);
  } else if (tree.name == "StartTag") {
    return completeTag(state, schema, tree, pos, pos);
  } else if (tree.name == "StartCloseTag" || tree.name == "IncompleteCloseTag") {
    return completeCloseTag(state, tree, pos, pos);
  } else if (tree.name == "OpenTag" || tree.name == "SelfClosingTag" || tree.name == "AttributeName") {
    return completeAttrName(state, schema, tree, tree.name == "AttributeName" ? tree.from : pos, pos);
  } else if (tree.name == "Is" || tree.name == "AttributeValue" || tree.name == "UnquotedAttributeValue") {
    return completeAttrValue(state, schema, tree, tree.name == "Is" ? pos : tree.from, pos);
  } else if (context.explicit && (around.name == "Element" || around.name == "Text" || around.name == "Document")) {
    return completeStartTag(state, schema, tree, pos);
  } else {
    return null;
  }
}
function htmlCompletionSource(context) {
  return htmlCompletionFor(Schema.default, context);
}
function htmlCompletionSourceWith(config) {
  let { extraTags, extraGlobalAttributes: extraAttrs } = config;
  let schema = extraAttrs || extraTags ? new Schema(extraTags, extraAttrs) : Schema.default;
  return (context) => htmlCompletionFor(schema, context);
}
var jsonParser = /* @__PURE__ */ javascriptLanguage.parser.configure({ top: "SingleExpression" });
var defaultNesting = [
  {
    tag: "script",
    attrs: (attrs) => attrs.type == "text/typescript" || attrs.lang == "ts",
    parser: typescriptLanguage.parser
  },
  {
    tag: "script",
    attrs: (attrs) => attrs.type == "text/babel" || attrs.type == "text/jsx",
    parser: jsxLanguage.parser
  },
  {
    tag: "script",
    attrs: (attrs) => attrs.type == "text/typescript-jsx",
    parser: tsxLanguage.parser
  },
  {
    tag: "script",
    attrs(attrs) {
      return /^(importmap|speculationrules|application\/(.+\+)?json)$/i.test(attrs.type);
    },
    parser: jsonParser
  },
  {
    tag: "script",
    attrs(attrs) {
      return !attrs.type || /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^module$|^$/i.test(attrs.type);
    },
    parser: javascriptLanguage.parser
  },
  {
    tag: "style",
    attrs(attrs) {
      return (!attrs.lang || attrs.lang == "css") && (!attrs.type || /^(text\/)?(x-)?(stylesheet|css)$/i.test(attrs.type));
    },
    parser: cssLanguage.parser
  }
];
var defaultAttrs = /* @__PURE__ */ [
  {
    name: "style",
    parser: /* @__PURE__ */ cssLanguage.parser.configure({ top: "Styles" })
  }
].concat(/* @__PURE__ */ eventAttributes.map((name) => ({ name, parser: javascriptLanguage.parser })));
var htmlPlain = /* @__PURE__ */ LRLanguage.define({
  name: "html",
  parser: /* @__PURE__ */ parser.configure({
    props: [
      /* @__PURE__ */ indentNodeProp.add({
        Element(context) {
          let after = /^(\s*)(<\/)?/.exec(context.textAfter);
          if (context.node.to <= context.pos + after[0].length)
            return context.continue();
          return context.lineIndent(context.node.from) + (after[2] ? 0 : context.unit);
        },
        "OpenTag CloseTag SelfClosingTag"(context) {
          return context.column(context.node.from) + context.unit;
        },
        Document(context) {
          if (context.pos + /\s*/.exec(context.textAfter)[0].length < context.node.to)
            return context.continue();
          let endElt = null, close;
          for (let cur = context.node; ; ) {
            let last = cur.lastChild;
            if (!last || last.name != "Element" || last.to != cur.to)
              break;
            endElt = cur = last;
          }
          if (endElt && !((close = endElt.lastChild) && (close.name == "CloseTag" || close.name == "SelfClosingTag")))
            return context.lineIndent(endElt.from) + context.unit;
          return null;
        }
      }),
      /* @__PURE__ */ foldNodeProp.add({
        Element(node) {
          let first = node.firstChild, last = node.lastChild;
          if (!first || first.name != "OpenTag")
            return null;
          return { from: first.to, to: last.name == "CloseTag" ? last.from : node.to };
        }
      }),
      /* @__PURE__ */ bracketMatchingHandle.add({
        "OpenTag CloseTag": (node) => node.getChild("TagName")
      })
    ]
  }),
  languageData: {
    commentTokens: { block: { open: "<!--", close: "-->" } },
    indentOnInput: /^\s*<\/\w+\W$/,
    wordChars: "-._"
  }
});
var htmlLanguage = /* @__PURE__ */ htmlPlain.configure({
  wrap: /* @__PURE__ */ configureNesting(defaultNesting, defaultAttrs)
});
function html(config = {}) {
  let dialect = "", wrap;
  if (config.matchClosingTags === false)
    dialect = "noMatch";
  if (config.selfClosingTags === true)
    dialect = (dialect ? dialect + " " : "") + "selfClosing";
  if (config.nestedLanguages && config.nestedLanguages.length || config.nestedAttributes && config.nestedAttributes.length)
    wrap = configureNesting((config.nestedLanguages || []).concat(defaultNesting), (config.nestedAttributes || []).concat(defaultAttrs));
  let lang = wrap ? htmlPlain.configure({ wrap, dialect }) : dialect ? htmlLanguage.configure({ dialect }) : htmlLanguage;
  return new LanguageSupport(lang, [
    htmlLanguage.data.of({ autocomplete: htmlCompletionSourceWith(config) }),
    config.autoCloseTags !== false ? autoCloseTags2 : [],
    javascript().support,
    css().support
  ]);
}
var selfClosers2 = /* @__PURE__ */ new Set(/* @__PURE__ */ "area base br col command embed frame hr img input keygen link meta param source track wbr menuitem".split(" "));
var autoCloseTags2 = /* @__PURE__ */ EditorView.inputHandler.of((view, from, to, text, insertTransaction) => {
  if (view.composing || view.state.readOnly || from != to || text != ">" && text != "/" || !htmlLanguage.isActiveAt(view.state, from, -1))
    return false;
  let base = insertTransaction(), { state } = base;
  let closeTags = state.changeByRange((range) => {
    var _a, _b, _c;
    let didType = state.doc.sliceString(range.from - 1, range.to) == text;
    let { head } = range, after = syntaxTree(state).resolveInner(head, -1), name;
    if (didType && text == ">" && after.name == "EndTag") {
      let tag = after.parent;
      if (((_b = (_a = tag.parent) === null || _a === void 0 ? void 0 : _a.lastChild) === null || _b === void 0 ? void 0 : _b.name) != "CloseTag" && (name = elementName2(state.doc, tag.parent, head)) && !selfClosers2.has(name)) {
        let to2 = head + (state.doc.sliceString(head, head + 1) === ">" ? 1 : 0);
        let insert = `</${name}>`;
        return { range, changes: { from: head, to: to2, insert } };
      }
    } else if (didType && text == "/" && after.name == "IncompleteCloseTag") {
      let tag = after.parent;
      if (after.from == head - 2 && ((_c = tag.lastChild) === null || _c === void 0 ? void 0 : _c.name) != "CloseTag" && (name = elementName2(state.doc, tag, head)) && !selfClosers2.has(name)) {
        let to2 = head + (state.doc.sliceString(head, head + 1) === ">" ? 1 : 0);
        let insert = `${name}>`;
        return {
          range: EditorSelection.cursor(head + insert.length, -1),
          changes: { from: head, to: to2, insert }
        };
      }
    }
    return { range };
  });
  if (closeTags.changes.empty)
    return false;
  view.dispatch([
    base,
    state.update(closeTags, {
      userEvent: "input.complete",
      scrollIntoView: true
    })
  ]);
  return true;
});

// node_modules/@codemirror/lang-markdown/dist/index.js
var data = /* @__PURE__ */ defineLanguageFacet({ commentTokens: { block: { open: "<!--", close: "-->" } } });
var headingProp = /* @__PURE__ */ new NodeProp();
var commonmark = /* @__PURE__ */ parser$1.configure({
  props: [
    /* @__PURE__ */ foldNodeProp.add((type) => {
      return !type.is("Block") || type.is("Document") || isHeading(type) != null || isList(type) ? void 0 : (tree, state) => ({ from: state.doc.lineAt(tree.from).to, to: tree.to });
    }),
    /* @__PURE__ */ headingProp.add(isHeading),
    /* @__PURE__ */ indentNodeProp.add({
      Document: () => null
    }),
    /* @__PURE__ */ languageDataProp.add({
      Document: data
    })
  ]
});
function isHeading(type) {
  let match = /^(?:ATX|Setext)Heading(\d)$/.exec(type.name);
  return match ? +match[1] : void 0;
}
function isList(type) {
  return type.name == "OrderedList" || type.name == "BulletList";
}
function findSectionEnd(headerNode, level) {
  let last = headerNode;
  for (; ; ) {
    let next = last.nextSibling, heading;
    if (!next || (heading = isHeading(next.type)) != null && heading <= level)
      break;
    last = next;
  }
  return last.to;
}
var headerIndent = /* @__PURE__ */ foldService.of((state, start, end) => {
  for (let node = syntaxTree(state).resolveInner(end, -1); node; node = node.parent) {
    if (node.from < start)
      break;
    let heading = node.type.prop(headingProp);
    if (heading == null)
      continue;
    let upto = findSectionEnd(node, heading);
    if (upto > end)
      return { from: end, to: upto };
  }
  return null;
});
function mkLang(parser5) {
  return new Language(data, parser5, [headerIndent], "markdown");
}
var commonmarkLanguage = /* @__PURE__ */ mkLang(commonmark);
var extended = /* @__PURE__ */ commonmark.configure([GFM, Subscript, Superscript, Emoji, {
  props: [
    /* @__PURE__ */ foldNodeProp.add({
      Table: (tree, state) => ({ from: state.doc.lineAt(tree.from).to, to: tree.to })
    })
  ]
}]);
var markdownLanguage = /* @__PURE__ */ mkLang(extended);
function getCodeParser(languages3, defaultLanguage) {
  return (info) => {
    if (info && languages3) {
      let found = null;
      info = /\S*/.exec(info)[0];
      if (typeof languages3 == "function")
        found = languages3(info);
      else
        found = LanguageDescription.matchLanguageName(languages3, info, true);
      if (found instanceof LanguageDescription)
        return found.support ? found.support.language.parser : ParseContext.getSkippingParser(found.load());
      else if (found)
        return found.parser;
    }
    return defaultLanguage ? defaultLanguage.parser : null;
  };
}
var Context = class {
  constructor(node, from, to, spaceBefore, spaceAfter, type, item) {
    this.node = node;
    this.from = from;
    this.to = to;
    this.spaceBefore = spaceBefore;
    this.spaceAfter = spaceAfter;
    this.type = type;
    this.item = item;
  }
  blank(maxWidth, trailing = true) {
    let result = this.spaceBefore + (this.node.name == "Blockquote" ? ">" : "");
    if (maxWidth != null) {
      while (result.length < maxWidth)
        result += " ";
      return result;
    } else {
      for (let i = this.to - this.from - result.length - this.spaceAfter.length; i > 0; i--)
        result += " ";
      return result + (trailing ? this.spaceAfter : "");
    }
  }
  marker(doc, add) {
    let number = this.node.name == "OrderedList" ? String(+itemNumber(this.item, doc)[2] + add) : "";
    return this.spaceBefore + number + this.type + this.spaceAfter;
  }
};
function getContext(node, doc) {
  let nodes = [], context = [];
  for (let cur = node; cur; cur = cur.parent) {
    if (cur.name == "FencedCode")
      return context;
    if (cur.name == "ListItem" || cur.name == "Blockquote")
      nodes.push(cur);
  }
  for (let i = nodes.length - 1; i >= 0; i--) {
    let node2 = nodes[i], match;
    let line = doc.lineAt(node2.from), startPos = node2.from - line.from;
    if (node2.name == "Blockquote" && (match = /^ *>( ?)/.exec(line.text.slice(startPos)))) {
      context.push(new Context(node2, startPos, startPos + match[0].length, "", match[1], ">", null));
    } else if (node2.name == "ListItem" && node2.parent.name == "OrderedList" && (match = /^( *)\d+([.)])( *)/.exec(line.text.slice(startPos)))) {
      let after = match[3], len = match[0].length;
      if (after.length >= 4) {
        after = after.slice(0, after.length - 4);
        len -= 4;
      }
      context.push(new Context(node2.parent, startPos, startPos + len, match[1], after, match[2], node2));
    } else if (node2.name == "ListItem" && node2.parent.name == "BulletList" && (match = /^( *)([-+*])( {1,4}\[[ xX]\])?( +)/.exec(line.text.slice(startPos)))) {
      let after = match[4], len = match[0].length;
      if (after.length > 4) {
        after = after.slice(0, after.length - 4);
        len -= 4;
      }
      let type = match[2];
      if (match[3])
        type += match[3].replace(/[xX]/, " ");
      context.push(new Context(node2.parent, startPos, startPos + len, match[1], after, type, node2));
    }
  }
  return context;
}
function itemNumber(item, doc) {
  return /^(\s*)(\d+)(?=[.)])/.exec(doc.sliceString(item.from, item.from + 10));
}
function renumberList(after, doc, changes, offset = 0) {
  for (let prev = -1, node = after; ; ) {
    if (node.name == "ListItem") {
      let m = itemNumber(node, doc);
      let number = +m[2];
      if (prev >= 0) {
        if (number != prev + 1)
          return;
        changes.push({ from: node.from + m[1].length, to: node.from + m[0].length, insert: String(prev + 2 + offset) });
      }
      prev = number;
    }
    let next = node.nextSibling;
    if (!next)
      break;
    node = next;
  }
}
function normalizeIndent(content, state) {
  let blank = /^[ \t]*/.exec(content)[0].length;
  if (!blank || state.facet(indentUnit) != "	")
    return content;
  let col = countColumn(content, 4, blank);
  let space3 = "";
  for (let i = col; i > 0; ) {
    if (i >= 4) {
      space3 += "	";
      i -= 4;
    } else {
      space3 += " ";
      i--;
    }
  }
  return space3 + content.slice(blank);
}
var insertNewlineContinueMarkup = ({ state, dispatch }) => {
  let tree = syntaxTree(state), { doc } = state;
  let dont = null, changes = state.changeByRange((range) => {
    if (!range.empty || !markdownLanguage.isActiveAt(state, range.from, 0))
      return dont = { range };
    let pos = range.from, line = doc.lineAt(pos);
    let context = getContext(tree.resolveInner(pos, -1), doc);
    while (context.length && context[context.length - 1].from > pos - line.from)
      context.pop();
    if (!context.length)
      return dont = { range };
    let inner = context[context.length - 1];
    if (inner.to - inner.spaceAfter.length > pos - line.from)
      return dont = { range };
    let emptyLine = pos >= inner.to - inner.spaceAfter.length && !/\S/.test(line.text.slice(inner.to));
    if (inner.item && emptyLine) {
      let first = inner.node.firstChild, second = inner.node.getChild("ListItem", "ListItem");
      if (first.to >= pos || second && second.to < pos || line.from > 0 && !/[^\s>]/.test(doc.lineAt(line.from - 1).text)) {
        let next = context.length > 1 ? context[context.length - 2] : null;
        let delTo, insert2 = "";
        if (next && next.item) {
          delTo = line.from + next.from;
          insert2 = next.marker(doc, 1);
        } else {
          delTo = line.from + (next ? next.to : 0);
        }
        let changes3 = [{ from: delTo, to: pos, insert: insert2 }];
        if (inner.node.name == "OrderedList")
          renumberList(inner.item, doc, changes3, -2);
        if (next && next.node.name == "OrderedList")
          renumberList(next.item, doc, changes3);
        return { range: EditorSelection.cursor(delTo + insert2.length), changes: changes3 };
      } else {
        let insert2 = blankLine(context, state, line);
        return {
          range: EditorSelection.cursor(pos + insert2.length + 1),
          changes: { from: line.from, insert: insert2 + state.lineBreak }
        };
      }
    }
    if (inner.node.name == "Blockquote" && emptyLine && line.from) {
      let prevLine = doc.lineAt(line.from - 1), quoted = />\s*$/.exec(prevLine.text);
      if (quoted && quoted.index == inner.from) {
        let changes3 = state.changes([
          { from: prevLine.from + quoted.index, to: prevLine.to },
          { from: line.from + inner.from, to: line.to }
        ]);
        return { range: range.map(changes3), changes: changes3 };
      }
    }
    let changes2 = [];
    if (inner.node.name == "OrderedList")
      renumberList(inner.item, doc, changes2);
    let continued = inner.item && inner.item.from < line.from;
    let insert = "";
    if (!continued || /^[\s\d.)\-+*>]*/.exec(line.text)[0].length >= inner.to) {
      for (let i = 0, e = context.length - 1; i <= e; i++) {
        insert += i == e && !continued ? context[i].marker(doc, 1) : context[i].blank(i < e ? countColumn(line.text, 4, context[i + 1].from) - insert.length : null);
      }
    }
    let from = pos;
    while (from > line.from && /\s/.test(line.text.charAt(from - line.from - 1)))
      from--;
    insert = normalizeIndent(insert, state);
    if (nonTightList(inner.node, state.doc))
      insert = blankLine(context, state, line) + state.lineBreak + insert;
    changes2.push({ from, to: pos, insert: state.lineBreak + insert });
    return { range: EditorSelection.cursor(from + insert.length + 1), changes: changes2 };
  });
  if (dont)
    return false;
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
  return true;
};
function isMark(node) {
  return node.name == "QuoteMark" || node.name == "ListMark";
}
function nonTightList(node, doc) {
  if (node.name != "OrderedList" && node.name != "BulletList")
    return false;
  let first = node.firstChild, second = node.getChild("ListItem", "ListItem");
  if (!second)
    return false;
  let line1 = doc.lineAt(first.to), line2 = doc.lineAt(second.from);
  let empty = /^[\s>]*$/.test(line1.text);
  return line1.number + (empty ? 0 : 1) < line2.number;
}
function blankLine(context, state, line) {
  let insert = "";
  for (let i = 0, e = context.length - 2; i <= e; i++) {
    insert += context[i].blank(i < e ? countColumn(line.text, 4, Math.min(line.text.length, context[i + 1].from)) - insert.length : null, i < e);
  }
  return normalizeIndent(insert, state);
}
function contextNodeForDelete(tree, pos) {
  let node = tree.resolveInner(pos, -1), scan = pos;
  if (isMark(node)) {
    scan = node.from;
    node = node.parent;
  }
  for (let prev; prev = node.childBefore(scan); ) {
    if (isMark(prev)) {
      scan = prev.from;
    } else if (prev.name == "OrderedList" || prev.name == "BulletList") {
      node = prev.lastChild;
      scan = node.to;
    } else {
      break;
    }
  }
  return node;
}
var deleteMarkupBackward = ({ state, dispatch }) => {
  let tree = syntaxTree(state);
  let dont = null, changes = state.changeByRange((range) => {
    let pos = range.from, { doc } = state;
    if (range.empty && markdownLanguage.isActiveAt(state, range.from)) {
      let line = doc.lineAt(pos);
      let context = getContext(contextNodeForDelete(tree, pos), doc);
      if (context.length) {
        let inner = context[context.length - 1];
        let spaceEnd = inner.to - inner.spaceAfter.length + (inner.spaceAfter ? 1 : 0);
        if (pos - line.from > spaceEnd && !/\S/.test(line.text.slice(spaceEnd, pos - line.from)))
          return {
            range: EditorSelection.cursor(line.from + spaceEnd),
            changes: { from: line.from + spaceEnd, to: pos }
          };
        if (pos - line.from == spaceEnd && // Only apply this if we're on the line that has the
        // construct's syntax, or there's only indentation in the
        // target range
        (!inner.item || line.from <= inner.item.from || !/\S/.test(line.text.slice(0, inner.to)))) {
          let start = line.from + inner.from;
          if (inner.item && inner.node.from < inner.item.from && /\S/.test(line.text.slice(inner.from, inner.to))) {
            let insert = inner.blank(countColumn(line.text, 4, inner.to) - countColumn(line.text, 4, inner.from));
            if (start == line.from)
              insert = normalizeIndent(insert, state);
            return {
              range: EditorSelection.cursor(start + insert.length),
              changes: { from: start, to: line.from + inner.to, insert }
            };
          }
          if (start < pos)
            return { range: EditorSelection.cursor(start), changes: { from: start, to: pos } };
        }
      }
    }
    return dont = { range };
  });
  if (dont)
    return false;
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: "delete" }));
  return true;
};
var markdownKeymap = [
  { key: "Enter", run: insertNewlineContinueMarkup },
  { key: "Backspace", run: deleteMarkupBackward }
];
var htmlNoMatch = /* @__PURE__ */ html({ matchClosingTags: false });
function markdown(config = {}) {
  let { codeLanguages, defaultCodeLanguage, addKeymap = true, base: { parser: parser5 } = commonmarkLanguage, completeHTMLTags = true, htmlTagLanguage = htmlNoMatch } = config;
  if (!(parser5 instanceof MarkdownParser))
    throw new RangeError("Base parser provided to `markdown` should be a Markdown parser");
  let extensions = config.extensions ? [config.extensions] : [];
  let support = [htmlTagLanguage.support], defaultCode;
  if (defaultCodeLanguage instanceof LanguageSupport) {
    support.push(defaultCodeLanguage.support);
    defaultCode = defaultCodeLanguage.language;
  } else if (defaultCodeLanguage) {
    defaultCode = defaultCodeLanguage;
  }
  let codeParser = codeLanguages || defaultCode ? getCodeParser(codeLanguages, defaultCode) : void 0;
  extensions.push(parseCode({ codeParser, htmlParser: htmlTagLanguage.language.parser }));
  if (addKeymap)
    support.push(Prec.high(keymap.of(markdownKeymap)));
  let lang = mkLang(parser5.configure(extensions));
  if (completeHTMLTags)
    support.push(lang.data.of({ autocomplete: htmlTagCompletion }));
  return new LanguageSupport(lang, support);
}
function htmlTagCompletion(context) {
  let { state, pos } = context, m = /<[:\-\.\w\u00b7-\uffff]*$/.exec(state.sliceDoc(pos - 25, pos));
  if (!m)
    return null;
  let tree = syntaxTree(state).resolveInner(pos, -1);
  while (tree && !tree.type.isTop) {
    if (tree.name == "CodeBlock" || tree.name == "FencedCode" || tree.name == "ProcessingInstructionBlock" || tree.name == "CommentBlock" || tree.name == "Link" || tree.name == "Image")
      return null;
    tree = tree.parent;
  }
  return {
    from: pos - m[0].length,
    to: pos,
    options: htmlTagCompletions(),
    validFor: /^<[:\-\.\w\u00b7-\uffff]*$/
  };
}
var _tagCompletions = null;
function htmlTagCompletions() {
  if (_tagCompletions)
    return _tagCompletions;
  let result = htmlCompletionSource(new CompletionContext(EditorState.create({ extensions: htmlNoMatch }), 0, true));
  return _tagCompletions = result ? result.options : [];
}
var setMarkdownSyntaxMode = StateEffect.define();
StateField.define({
  create() {
    return "live";
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setMarkdownSyntaxMode)) {
        return effect.value;
      }
    }
    return value;
  },
  provide(field) {
    return EditorView.contentAttributes.from(field, (mode) => ({
      "data-markdown-mode": mode
    }));
  }
});

// src/app/obsidian-editor/utils/formatting/linkAndListFormatting.ts
var isListItem = (lineText) => {
  return /^\s*([-*+]|\d+\.)\s/.test(lineText);
};
var isBlockquote = (lineText) => {
  return /^\s*>/.test(lineText);
};

// src/app/obsidian-editor/extensions/AtomicIndents.ts
var NBSP2 = "\xA0";
var INDENT_UNIT2 = NBSP2.repeat(4);
var AtomicIndentPluginValue = class {
  /**
   * Creates a new instance of the atomic indent plugin
   * @param view - The CodeMirror editor view
   */
  constructor(view) {
    this.atomicRanges = this.buildAtomicRanges(view);
  }
  /**
   * Updates the atomic ranges when the document or viewport changes
   * @param update - The view update object
   */
  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.atomicRanges = this.buildAtomicRanges(update.view);
    }
  }
  /**
   * Builds the set of atomic ranges based on the current document content
   * @param view - The CodeMirror editor view
   * @returns A RangeSet containing all atomic indent ranges
   */
  buildAtomicRanges(view) {
    const builder = new RangeSetBuilder();
    for (const { from, to } of view.visibleRanges) {
      let pos = from;
      while (pos <= to) {
        const line = view.state.doc.lineAt(pos);
        const lineText = line.text;
        let searchPosInLine = 0;
        while ((searchPosInLine = lineText.indexOf(INDENT_UNIT2, searchPosInLine)) !== -1) {
          const matchStart = line.from + searchPosInLine;
          const matchEnd = matchStart + INDENT_UNIT2.length;
          if (matchStart < to && matchEnd > from) {
            builder.add(matchStart, matchEnd, Decoration.mark({
              class: "cm-atomic-indent"
            }));
          }
          searchPosInLine = searchPosInLine + INDENT_UNIT2.length;
          if (searchPosInLine >= line.length) break;
        }
        if (isListItem(lineText)) {
          const leadingSpacesMatch = lineText.match(/^(\s+)/);
          if (leadingSpacesMatch && leadingSpacesMatch[1]) {
            const spaces2 = leadingSpacesMatch[1];
            for (let i = 0; i < spaces2.length; i += 4) {
              const chunkSize = Math.min(4, spaces2.length - i);
              if (chunkSize === 4) {
                builder.add(
                  line.from + i,
                  line.from + i + 4,
                  Decoration.mark({
                    class: "cm-atomic-indent cm-list-indent"
                  })
                );
              }
            }
          }
        }
        if (isBlockquote(lineText)) {
          const blockquoteMatches = lineText.matchAll(/>\s*/g);
          for (const match of blockquoteMatches) {
            if (match.index !== void 0) {
              const matchPos = line.from + match.index;
              const matchLen = match[0].length;
              builder.add(
                matchPos,
                matchPos + matchLen,
                Decoration.mark({
                  class: "cm-atomic-indent cm-blockquote-indent"
                })
              );
            }
          }
        }
        pos = line.to + 1;
      }
    }
    const result = builder.finish();
    return result;
  }
};
var atomicIndentPlugin = ViewPlugin.fromClass(AtomicIndentPluginValue);
var atomicRangesFacetProvider = EditorView.atomicRanges.of((view) => {
  const pluginValue = view.plugin(atomicIndentPlugin);
  if (pluginValue) {
    return pluginValue.atomicRanges || RangeSet.empty;
  }
  return RangeSet.empty;
});
var atomicIndentsStyle = EditorView.baseTheme({
  ".cm-atomic-indent": {
    caretColor: "transparent"
  },
  ".cm-list-indent": {
    backgroundColor: "rgba(0, 0, 0, 0.03)"
  },
  ".cm-blockquote-indent": {
    backgroundColor: "rgba(0, 0, 0, 0.03)"
  }
});
var atomicIndents = [
  atomicIndentPlugin,
  atomicRangesFacetProvider,
  atomicIndentsStyle
];

// src/app/obsidian-editor/extensions/markdown-syntax/rules/utils.ts
function isCursorNearRange(cursorPositions, rangeFrom, rangeTo, proximity = 0) {
  for (const cursor of cursorPositions) {
    if (cursor >= rangeFrom - proximity && cursor <= rangeTo + proximity) {
      return true;
    }
  }
  return false;
}

// src/app/obsidian-editor/extensions/markdown-syntax/rules/headingDecorator.ts
var HeadingDecorator = class {
  constructor() {
    this.headingRegex = /^(#{1,6})\s(.*)$/gm;
  }
  process(context) {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    let match;
    const localRegex = new RegExp(this.headingRegex.source, "gm");
    while ((match = localRegex.exec(docText)) !== null) {
      const matchStartIndexInSlice = match.index;
      const lineStartInDoc = textSliceFrom + matchStartIndexInSlice;
      if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === "\\") {
        continue;
      }
      const hashMarks = match[1];
      const headingTextContent = match[2];
      const hashCount = hashMarks.length;
      const hashStartInDoc = lineStartInDoc;
      const hashEndInDoc = hashStartInDoc + hashCount;
      const spaceAfterHashInDoc = hashEndInDoc + 1;
      const lineEndInDoc = lineStartInDoc + match[0].length;
      const headingTextStartInDoc = spaceAfterHashInDoc;
      const headingTextEndInDoc = lineEndInDoc;
      const isNearSyntax = isCursorNearRange(cursorPositions, hashStartInDoc, spaceAfterHashInDoc);
      const syntaxClass = isNearSyntax ? "markdown-syntax-active" : "markdown-syntax-dim";
      if (decorations) {
        decorations.push({
          from: hashStartInDoc,
          to: spaceAfterHashInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
        if (headingTextContent.trim().length > 0) {
          decorations.push({
            from: headingTextStartInDoc,
            to: headingTextEndInDoc,
            decoration: Decoration.mark({ class: `markdown-heading-${hashCount}` })
          });
        }
      } else {
        builder.add(hashStartInDoc, spaceAfterHashInDoc, Decoration.mark({ class: syntaxClass }));
        if (headingTextContent.trim().length > 0) {
          builder.add(
            headingTextStartInDoc,
            headingTextEndInDoc,
            Decoration.mark({ class: `markdown-heading-${hashCount}` })
          );
        }
      }
    }
  }
};

// src/app/obsidian-editor/extensions/markdown-syntax/rules/baseDecorator.ts
var BaseDecorator = class {
  /**
   * Check if a position is within any HTML edit region
   * @param pos - The position to check
   * @param htmlEditRegions - Array of HTML edit regions
   * @returns True if the position is within any HTML edit region
   */
  isWithinHtmlEditRegion(pos, htmlEditRegions) {
    if (!htmlEditRegions || !htmlEditRegions.length) return false;
    for (const region of htmlEditRegions) {
      if (pos >= region.from && pos < region.to) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check if a range overlaps with any HTML edit region
   * @param from - Start position
   * @param to - End position
   * @param htmlEditRegions - Array of HTML edit regions
   * @returns True if the range overlaps with any HTML edit region
   */
  rangeOverlapsHtmlEditRegion(from, to, htmlEditRegions) {
    if (!htmlEditRegions || !htmlEditRegions.length) return false;
    for (const region of htmlEditRegions) {
      if (from < region.to && to > region.from) {
        return true;
      }
    }
    return false;
  }
};

// src/app/obsidian-editor/extensions/markdown-syntax/rules/boldDecorator.ts
var BoldDecorator = class extends BaseDecorator {
  constructor() {
    super(...arguments);
    /**
     * Regular expression to match bold text
     * Matches **bold text** or __bold text__
     */
    this.regex = /(\*\*|__)([^\s*_]|[^\s*_].*?[^\s*_])\1/g;
  }
  /**
   * Process the document and add decorations for bold text
   * @param context - Context containing document state and decoration builder
   */
  process(context) {
    const { docText, textSliceFrom, decorations, htmlEditRegions } = context;
    let match;
    while ((match = this.regex.exec(docText)) !== null) {
      const matchFrom = textSliceFrom + match.index;
      const matchTo = textSliceFrom + match.index + match[0].length;
      if (this.rangeOverlapsHtmlEditRegion(matchFrom, matchTo, htmlEditRegions)) {
        continue;
      }
      const startMarkerFrom = matchFrom;
      const startMarkerTo = startMarkerFrom + match[1].length;
      const contentFrom = startMarkerTo;
      const contentTo = matchTo - match[1].length;
      const endMarkerFrom = contentTo;
      const endMarkerTo = matchTo;
      decorations.push({
        from: startMarkerFrom,
        to: startMarkerTo,
        decoration: Decoration.mark({ class: "cm-formatting-strong" })
      });
      decorations.push({
        from: endMarkerFrom,
        to: endMarkerTo,
        decoration: Decoration.mark({ class: "cm-formatting-strong" })
      });
      decorations.push({
        from: contentFrom,
        to: contentTo,
        decoration: Decoration.mark({ class: "cm-strong" })
      });
    }
  }
};
var ItalicDecorator = class {
  constructor() {
    // Regex for *italic* and _italic_
    // It avoids matching parts of **bold** or __bold__ by ensuring the characters immediately
    // outside the single markers are not the same marker character.
    // It also ensures the content is not empty, e.g. ** or __
    this.italicPatterns = [
      // Matches *italic* but not **bold** or ***italicbold*** components directly
      { marker: "*", regex: /(?<!\*\*|\*)(?:^|[^\*])\*(?!\s|\*\*)([^\*\n]+?)(?<!\s)\*(?!\*)/g },
      // Matches _italic_ but not __bold__ or ___italicbold___ components directly
      { marker: "_", regex: /(?<!__|_)(?:^|[^_])_(?!\s|__)([^_\n]+?)(?<!\s)_(?!_)/g }
    ];
  }
  process(context) {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    this.italicPatterns.forEach((patternInfo) => {
      const marker = patternInfo.marker;
      const markerLen = marker.length;
      const localRegex = new RegExp(patternInfo.regex.source, "g");
      let match;
      while ((match = localRegex.exec(docText)) !== null) {
        let fullMatchText = match[0];
        let contentText = match[1];
        let matchStartIndexInSlice = match.index;
        if (fullMatchText.startsWith(marker) === false && fullMatchText.length > contentText.length + 2) {
          matchStartIndexInSlice += fullMatchText.indexOf(marker + contentText + marker);
          fullMatchText = marker + contentText + marker;
        }
        if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === "\\") {
          continue;
        }
        const charBeforeOpenMarker = matchStartIndexInSlice > 0 ? docText.charAt(matchStartIndexInSlice - 1) : " ";
        const charAfterCloseMarker = matchStartIndexInSlice + fullMatchText.length < docText.length ? docText.charAt(matchStartIndexInSlice + fullMatchText.length) : " ";
        const wordCharRegex = /[a-zA-Z0-9]/;
        if (wordCharRegex.test(charBeforeOpenMarker) && wordCharRegex.test(charAfterCloseMarker)) {
          if (docText.charAt(matchStartIndexInSlice + markerLen) !== " " && docText.charAt(matchStartIndexInSlice + fullMatchText.length - markerLen - 1) !== " ") ;
        }
        const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
        const fullMatchEndInDoc = fullMatchStartInDoc + fullMatchText.length;
        const openMarkerStartInDoc = fullMatchStartInDoc;
        const openMarkerEndInDoc = openMarkerStartInDoc + markerLen;
        const contentStartInDoc = openMarkerEndInDoc;
        const contentEndInDoc = fullMatchEndInDoc - markerLen;
        const closeMarkerStartInDoc = contentEndInDoc;
        const closeMarkerEndInDoc = fullMatchEndInDoc;
        if (contentStartInDoc >= contentEndInDoc) {
          continue;
        }
        const isNearSyntax = isCursorNearRange(cursorPositions, openMarkerStartInDoc, closeMarkerEndInDoc);
        const syntaxClass = isNearSyntax ? "markdown-syntax-active" : "markdown-syntax-dim";
        if (decorations) {
          decorations.push({
            from: openMarkerStartInDoc,
            to: openMarkerEndInDoc,
            decoration: Decoration.mark({ class: syntaxClass })
          });
          decorations.push({
            from: contentStartInDoc,
            to: contentEndInDoc,
            decoration: Decoration.mark({ class: "markdown-italic-active" })
          });
          decorations.push({
            from: closeMarkerStartInDoc,
            to: closeMarkerEndInDoc,
            decoration: Decoration.mark({ class: syntaxClass })
          });
        } else {
          builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
          builder.add(contentStartInDoc, contentEndInDoc, Decoration.mark({ class: "markdown-italic-active" }));
          builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        }
      }
    });
  }
};
var StrikethroughDecorator = class {
  constructor() {
    // Improved regex for ~~strikethrough~~ with proper boundary conditions
    this.strikethroughRegex = /(?<!\\|~)(~~)(?!\s|~)([^~\n]+?)(?<!\s)(~~)(?!~)/g;
  }
  process(context) {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    const localRegex = new RegExp(this.strikethroughRegex.source, "g");
    let match;
    const markerLen = 2;
    while ((match = localRegex.exec(docText)) !== null) {
      const matchStartIndexInSlice = match.index;
      const fullMatchText = match[0];
      if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === "\\") {
        continue;
      }
      const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
      const fullMatchEndInDoc = fullMatchStartInDoc + fullMatchText.length;
      const openMarkerStartInDoc = fullMatchStartInDoc;
      const openMarkerEndInDoc = openMarkerStartInDoc + markerLen;
      const contentStartInDoc = openMarkerEndInDoc;
      const contentEndInDoc = fullMatchEndInDoc - markerLen;
      const closeMarkerStartInDoc = contentEndInDoc;
      const closeMarkerEndInDoc = fullMatchEndInDoc;
      if (contentStartInDoc >= contentEndInDoc) {
        continue;
      }
      const isNearSyntax = isCursorNearRange(cursorPositions, openMarkerStartInDoc, closeMarkerEndInDoc);
      const syntaxClass = isNearSyntax ? "markdown-syntax-active" : "markdown-syntax-dim";
      const contentClass = "markdown-strikethrough-active";
      if (decorations) {
        decorations.push({
          from: openMarkerStartInDoc,
          to: openMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
        decorations.push({
          from: contentStartInDoc,
          to: contentEndInDoc,
          decoration: Decoration.mark({ class: contentClass })
        });
        decorations.push({
          from: closeMarkerStartInDoc,
          to: closeMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
      } else {
        builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        builder.add(contentStartInDoc, contentEndInDoc, Decoration.mark({ class: contentClass }));
        builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
      }
    }
  }
};
var CodeDecorator = class {
  constructor() {
    // Regex for `code`
    // It looks for non-greedy content between single backticks.
    // It also tries to avoid matching parts of code blocks (```) by not allowing backticks right next to the content ones,
    // though full code block handling is typically a separate, more complex parser.
    this.codeRegex = /(?<!\\)(?<!`)`(?=\S)([^`\n]+?)(?<=\S)`(?!`)/g;
  }
  process(context) {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    const localRegex = new RegExp(this.codeRegex.source, "g");
    let match;
    const markerLen = 1;
    try {
      while ((match = localRegex.exec(docText)) !== null) {
        const matchStartIndexInSlice = match.index;
        const fullMatchText = match[0];
        if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === "\\") {
          continue;
        }
        const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
        const fullMatchEndInDoc = fullMatchStartInDoc + fullMatchText.length;
        const openMarkerStartInDoc = fullMatchStartInDoc;
        const openMarkerEndInDoc = openMarkerStartInDoc + markerLen;
        const contentStartInDoc = openMarkerEndInDoc;
        const contentEndInDoc = fullMatchEndInDoc - markerLen;
        const closeMarkerStartInDoc = contentEndInDoc;
        const closeMarkerEndInDoc = fullMatchEndInDoc;
        if (contentStartInDoc >= contentEndInDoc) {
          continue;
        }
        const isNearSyntax = isCursorNearRange(cursorPositions, openMarkerStartInDoc, closeMarkerEndInDoc);
        const syntaxClass = isNearSyntax ? "markdown-syntax-active" : "markdown-syntax-dim";
        if (decorations) {
          decorations.push({
            from: openMarkerStartInDoc,
            to: openMarkerEndInDoc,
            decoration: Decoration.mark({ class: syntaxClass })
          });
          decorations.push({
            from: contentStartInDoc,
            to: contentEndInDoc,
            decoration: Decoration.mark({ class: "markdown-code-active" })
          });
          decorations.push({
            from: closeMarkerStartInDoc,
            to: closeMarkerEndInDoc,
            decoration: Decoration.mark({ class: syntaxClass })
          });
        } else {
          builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
          builder.add(contentStartInDoc, contentEndInDoc, Decoration.mark({ class: "markdown-code-active" }));
          builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        }
      }
    } catch (error) {
      console.error("Error processing code syntax:", error);
    }
  }
  // End of process method
};
var HighlightDecorator = class {
  constructor() {
    // Regex for ==highlight== with proper boundary conditions
    this.highlightRegex = /(?<![\\=])(==)(?!\s|=)([^=\n]+?)(?<!\s)(==)(?!=)/g;
  }
  process(context) {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    const localRegex = new RegExp(this.highlightRegex.source, "g");
    let match;
    const markerLen = 2;
    while ((match = localRegex.exec(docText)) !== null) {
      const matchStartIndexInSlice = match.index;
      const fullMatchText = match[0];
      if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === "\\") {
        continue;
      }
      const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
      const fullMatchEndInDoc = fullMatchStartInDoc + fullMatchText.length;
      const openMarkerStartInDoc = fullMatchStartInDoc;
      const openMarkerEndInDoc = openMarkerStartInDoc + markerLen;
      const contentStartInDoc = openMarkerEndInDoc;
      const contentEndInDoc = fullMatchEndInDoc - markerLen;
      const closeMarkerStartInDoc = contentEndInDoc;
      const closeMarkerEndInDoc = fullMatchEndInDoc;
      if (contentStartInDoc >= contentEndInDoc) {
        continue;
      }
      const isNearSyntax = isCursorNearRange(cursorPositions, openMarkerStartInDoc, closeMarkerEndInDoc);
      const syntaxClass = isNearSyntax ? "markdown-syntax-active" : "markdown-syntax-dim";
      const contentClass = "markdown-highlight-active";
      if (decorations) {
        decorations.push({
          from: openMarkerStartInDoc,
          to: openMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
        decorations.push({
          from: contentStartInDoc,
          to: contentEndInDoc,
          decoration: Decoration.mark({ class: contentClass })
        });
        decorations.push({
          from: closeMarkerStartInDoc,
          to: closeMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
      } else {
        builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        builder.add(contentStartInDoc, contentEndInDoc, Decoration.mark({ class: contentClass }));
        builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
      }
    }
  }
};
var OldBoldDecorator = class {
  constructor() {
    // Regex for __bold__ (old style markdown)
    this.oldBoldRegex = /(?<!_)_{2}(?!\s)([^_]+?)(?<!\s)_{2}(?!_)/g;
  }
  process(context) {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    const markerLen = 2;
    const localRegex = new RegExp(this.oldBoldRegex.source, "g");
    let match;
    while ((match = localRegex.exec(docText)) !== null) {
      const matchStartIndexInSlice = match.index;
      const fullMatchText = match[0];
      if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === "\\") {
        continue;
      }
      const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
      const fullMatchEndInDoc = fullMatchStartInDoc + fullMatchText.length;
      const openMarkerStartInDoc = fullMatchStartInDoc;
      const openMarkerEndInDoc = openMarkerStartInDoc + markerLen;
      const contentStartInDoc = openMarkerEndInDoc;
      const contentEndInDoc = fullMatchEndInDoc - markerLen;
      const closeMarkerStartInDoc = contentEndInDoc;
      const closeMarkerEndInDoc = fullMatchEndInDoc;
      const isNearSyntax = isCursorNearRange(cursorPositions, openMarkerStartInDoc, closeMarkerEndInDoc);
      const syntaxClass = isNearSyntax ? "markdown-syntax-active" : "markdown-syntax-dim";
      if (decorations) {
        decorations.push({
          from: openMarkerStartInDoc,
          to: openMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
        if (contentStartInDoc < contentEndInDoc) {
          decorations.push({
            from: contentStartInDoc,
            to: contentEndInDoc,
            decoration: Decoration.mark({
              class: isNearSyntax ? "markdown-bold-active" : "markdown-old-syntax-red"
            })
          });
        }
        decorations.push({
          from: closeMarkerStartInDoc,
          to: closeMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
      } else {
        builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        if (contentStartInDoc < contentEndInDoc) {
          builder.add(
            contentStartInDoc,
            contentEndInDoc,
            Decoration.mark({
              class: isNearSyntax ? "markdown-bold-active" : "markdown-old-syntax-red"
            })
          );
        }
        builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
      }
    }
  }
};
var OldItalicDecorator = class {
  constructor() {
    // Regex for *italic* (old style markdown)
    this.oldItalicRegex = /(?<!\*\*|\*)(?:^|[^\*])\*(?!\s|\*\*)([^\*\n]+?)(?<!\s)\*(?!\*)/g;
  }
  process(context) {
    const { builder, docText, textSliceFrom, cursorPositions, decorations } = context;
    const markerLen = 1;
    const localRegex = new RegExp(this.oldItalicRegex.source, "g");
    let match;
    while ((match = localRegex.exec(docText)) !== null) {
      let fullMatchText = match[0];
      let contentText = match[1];
      let matchStartIndexInSlice = match.index;
      if (fullMatchText.startsWith("*") === false && fullMatchText.length > contentText.length + 2) {
        matchStartIndexInSlice += fullMatchText.indexOf("*" + contentText + "*");
        fullMatchText = "*" + contentText + "*";
      }
      if (matchStartIndexInSlice > 0 && docText.charAt(matchStartIndexInSlice - 1) === "\\") {
        continue;
      }
      const charBeforeOpenMarker = matchStartIndexInSlice > 0 ? docText.charAt(matchStartIndexInSlice - 1) : " ";
      const charAfterCloseMarker = matchStartIndexInSlice + fullMatchText.length < docText.length ? docText.charAt(matchStartIndexInSlice + fullMatchText.length) : " ";
      const wordCharRegex = /[a-zA-Z0-9]/;
      if (wordCharRegex.test(charBeforeOpenMarker) && wordCharRegex.test(charAfterCloseMarker)) {
        if (docText.charAt(matchStartIndexInSlice + markerLen) !== " " && docText.charAt(matchStartIndexInSlice + fullMatchText.length - markerLen - 1) !== " ") {
          continue;
        }
      }
      const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
      const fullMatchEndInDoc = fullMatchStartInDoc + fullMatchText.length;
      const openMarkerStartInDoc = fullMatchStartInDoc;
      const openMarkerEndInDoc = openMarkerStartInDoc + markerLen;
      const contentStartInDoc = openMarkerEndInDoc;
      const contentEndInDoc = fullMatchEndInDoc - markerLen;
      const closeMarkerStartInDoc = contentEndInDoc;
      const closeMarkerEndInDoc = fullMatchEndInDoc;
      if (contentStartInDoc >= contentEndInDoc) {
        continue;
      }
      const isNearSyntax = isCursorNearRange(cursorPositions, openMarkerStartInDoc, closeMarkerEndInDoc);
      const syntaxClass = isNearSyntax ? "markdown-syntax-active" : "markdown-syntax-dim";
      if (decorations) {
        decorations.push({
          from: openMarkerStartInDoc,
          to: openMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
        decorations.push({
          from: contentStartInDoc,
          to: contentEndInDoc,
          decoration: Decoration.mark({
            class: isNearSyntax ? "markdown-italic-active" : "markdown-old-syntax-red"
          })
        });
        decorations.push({
          from: closeMarkerStartInDoc,
          to: closeMarkerEndInDoc,
          decoration: Decoration.mark({ class: syntaxClass })
        });
      } else {
        builder.add(openMarkerStartInDoc, openMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
        builder.add(
          contentStartInDoc,
          contentEndInDoc,
          Decoration.mark({
            class: isNearSyntax ? "markdown-italic-active" : "markdown-old-syntax-red"
          })
        );
        builder.add(closeMarkerStartInDoc, closeMarkerEndInDoc, Decoration.mark({ class: syntaxClass }));
      }
    }
  }
};
var ListDecorator = class {
  constructor() {
    // Regex to match list items at the beginning of a line
    // Captures the specific marker used (-, +, *) or (1., 2., etc.)
    this.listItemRegex = /^(\s*)([-+*]|\d+\.)(\s+)(.*)$/gm;
  }
  process(context) {
    const { builder, docText, textSliceFrom, cursorPositions } = context;
    const extContext = context;
    extContext.decorations || [];
    this.processListItems(context, this.listItemRegex);
  }
  processListItems(context, regex) {
    const { builder, docText, textSliceFrom, cursorPositions } = context;
    const extContext = context;
    const decorations = extContext.decorations || [];
    const htmlRegions = extContext.htmlEditRegions || [];
    const localRegex = new RegExp(regex.source, "gm");
    let match;
    while ((match = localRegex.exec(docText)) !== null) {
      const [fullMatch, leadingWhitespace, marker, spacesAfterMarker, content] = match;
      const isNumberedList = /^\d+\.$/.test(marker);
      const matchStartIndexInSlice = match.index;
      const fullMatchStartInDoc = textSliceFrom + matchStartIndexInSlice;
      const markerStartInDoc = fullMatchStartInDoc + leadingWhitespace.length;
      const markerEndInDoc = markerStartInDoc + marker.length;
      const isInsideHtml2 = htmlRegions.some(
        (region) => markerStartInDoc >= region.from && markerEndInDoc <= region.to
      );
      if (isInsideHtml2) {
        continue;
      }
      const isAdjacentToMarker = cursorPositions.some(
        (cursor) => cursor === markerStartInDoc || cursor === markerEndInDoc
      );
      if (isNumberedList) {
        const decoration = Decoration.mark({ class: isAdjacentToMarker ? "markdown-syntax-active" : "markdown-list-dim" });
        if (decorations) {
          decorations.push({
            from: markerStartInDoc,
            to: markerEndInDoc,
            decoration
          });
        } else {
          builder.add(markerStartInDoc, markerEndInDoc, decoration);
        }
      } else if (isAdjacentToMarker) {
        const decoration = Decoration.mark({ class: "markdown-syntax-active" });
        if (decorations) {
          decorations.push({
            from: markerStartInDoc,
            to: markerEndInDoc,
            decoration
          });
        } else {
          builder.add(markerStartInDoc, markerEndInDoc, decoration);
        }
      } else {
        if (decorations) {
          decorations.push({
            from: markerStartInDoc,
            to: markerEndInDoc,
            decoration: Decoration.replace({
              widget: new ListBulletWidget(marker),
              class: "markdown-list-dim"
            })
          });
        } else {
          builder.add(markerStartInDoc, markerEndInDoc, Decoration.replace({
            widget: new ListBulletWidget(marker),
            class: "markdown-list-dim"
          }));
        }
      }
    }
  }
};
var ListBulletWidget = class extends WidgetType {
  constructor(originalMarker = "\u2022", isOrdered = false) {
    super();
    this.originalMarker = originalMarker;
    this.isOrdered = isOrdered;
  }
  eq(other) {
    return other.originalMarker === this.originalMarker && other.isOrdered === this.isOrdered;
  }
  toDOM() {
    const span = document.createElement("span");
    span.textContent = "\u2022";
    span.className = "markdown-list-dim";
    return span;
  }
  ignoreEvent() {
    return false;
  }
};
function createCopyButton(textToCopy) {
  const button = document.createElement("button");
  button.className = "cm-indent-copy-button";
  button.innerHTML = "<span>Copy</span>";
  button.title = "Copy code block";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = button.innerHTML;
      button.innerHTML = "<span>Copied!</span>";
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 1500);
    }).catch((err) => {
      console.error("Failed to copy text: ", err);
    });
  });
  return button;
}
var CodeBlockWidget = class extends WidgetType {
  constructor(codeLines, language, fullBlockRawText) {
    super();
    this.codeLines = codeLines;
    this.language = language;
    this.fullBlockRawText = fullBlockRawText;
  }
  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-preview-indent-block cm-fenced-code-block-preview";
    const preElement = document.createElement("pre");
    preElement.className = "cm-preview-indent-text";
    const codeElement = document.createElement("code");
    if (this.language) {
      codeElement.className = `language-${this.language.toLowerCase()}`;
    }
    codeElement.textContent = this.codeLines.join("\n");
    preElement.appendChild(codeElement);
    container.appendChild(preElement);
    container.appendChild(createCopyButton(this.fullBlockRawText));
    return container;
  }
  ignoreEvent(event) {
    if (event.type === "click" && event.target.closest(".cm-indent-copy-button")) {
      return false;
    }
    return true;
  }
};
var FencedCodeBlockDecorator = class {
  process(context) {
    const { state, docText, textSliceFrom, decorations, currentMode } = context;
    if (!decorations) {
      return;
    }
    const lines = docText.split("\n");
    if (currentMode === "preview") {
      let i = 0;
      while (i < lines.length) {
        const lineText = lines[i];
        const fenceMatch = lineText.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
        if (fenceMatch) {
          const leadingWhitespace = fenceMatch[1];
          const fenceType = fenceMatch[2];
          const langSpecifierRaw = fenceMatch[3].trim();
          const language = langSpecifierRaw.split(/\s+/)[0] || null;
          const blockStartLineIndex = i;
          let currentPosInSliceOffset = 0;
          for (let k = 0; k < blockStartLineIndex; k++) {
            currentPosInSliceOffset += lines[k].length + 1;
          }
          const blockStartPosInDoc = textSliceFrom + currentPosInSliceOffset;
          let currentBlockRawLines = [lineText];
          let codeContentLines = [];
          i++;
          let blockEndLineIndex = -1;
          while (i < lines.length) {
            const currentLineText = lines[i];
            currentBlockRawLines.push(currentLineText);
            const closingFenceMatch = currentLineText.match(/^(\s*)(`{3,}|~{3,})\s*$/);
            if (closingFenceMatch && closingFenceMatch[1] === leadingWhitespace && closingFenceMatch[2] === fenceType) {
              blockEndLineIndex = i;
              currentPosInSliceOffset = 0;
              for (let k = 0; k <= blockEndLineIndex; k++) {
                currentPosInSliceOffset += lines[k].length + 1;
              }
              let blockEndPosInDoc = textSliceFrom + currentPosInSliceOffset;
              if (blockEndLineIndex === lines.length - 1 && !docText.endsWith("\n")) {
                blockEndPosInDoc = textSliceFrom + currentPosInSliceOffset - 1;
              }
              const fullBlockRawText = currentBlockRawLines.join("\n");
              const widget = new CodeBlockWidget(codeContentLines, language, fullBlockRawText);
              decorations.push({
                from: blockStartPosInDoc,
                to: blockEndPosInDoc,
                decoration: Decoration.replace({ widget, block: true })
              });
              break;
            } else {
              if (leadingWhitespace.length > 0 && currentLineText.startsWith(leadingWhitespace)) {
                codeContentLines.push(currentLineText.substring(leadingWhitespace.length));
              } else if (leadingWhitespace.length === 0) {
                codeContentLines.push(currentLineText);
              } else {
                codeContentLines.push(currentLineText);
              }
            }
            i++;
          }
        }
        i++;
      }
    } else if (currentMode === "live") {
      let lineStartIndexInSlice = 0;
      for (let i = 0; i < lines.length; ) {
        const lineText = lines[i];
        const currentLineActualStartInDoc = textSliceFrom + lineStartIndexInSlice;
        currentLineActualStartInDoc + lineText.length;
        const fenceMatch = lineText.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
        if (fenceMatch) {
          const leadingWhitespace = fenceMatch[1];
          const fenceType = fenceMatch[2];
          const langSpecifierRaw = fenceMatch[3].trim();
          decorations.push({
            from: currentLineActualStartInDoc,
            to: currentLineActualStartInDoc,
            // For Decoration.line
            decoration: Decoration.line({ attributes: { class: "cm-live-fenced-code-fence-line" } })
          });
          if (langSpecifierRaw) {
            const langSpecOffsetInLine = leadingWhitespace.length + fenceType.length;
            decorations.push({
              from: currentLineActualStartInDoc + langSpecOffsetInLine,
              to: currentLineActualStartInDoc + langSpecOffsetInLine + langSpecifierRaw.length,
              decoration: Decoration.mark({ class: "cm-live-fenced-code-lang" })
            });
          }
          let nextLineStartInSliceForInnerLoop = lineStartIndexInSlice + lineText.length + 1;
          let foundClosingFence = false;
          for (let j = i + 1; j < lines.length; j++) {
            const innerLineText = lines[j];
            const innerLineActualStartInDoc = textSliceFrom + nextLineStartInSliceForInnerLoop;
            innerLineActualStartInDoc + innerLineText.length;
            const closingFenceMatch = innerLineText.match(/^(\s*)(`{3,}|~{3,})\s*$/);
            if (closingFenceMatch && closingFenceMatch[1] === leadingWhitespace && closingFenceMatch[2] === fenceType) {
              decorations.push({
                from: innerLineActualStartInDoc,
                to: innerLineActualStartInDoc,
                // For Decoration.line
                decoration: Decoration.line({ attributes: { class: "cm-live-fenced-code-fence-line" } })
              });
              lineStartIndexInSlice = nextLineStartInSliceForInnerLoop + innerLineText.length + 1;
              i = j + 1;
              foundClosingFence = true;
              break;
            } else {
              decorations.push({
                from: innerLineActualStartInDoc,
                to: innerLineActualStartInDoc,
                // For Decoration.line, 'to' is same as 'from'
                decoration: Decoration.line({
                  attributes: { class: "cm-live-fenced-code-content-line" },
                  atomic: true
                  // Prevent other Markdown rules from processing inside
                })
              });
              nextLineStartInSliceForInnerLoop += innerLineText.length + 1;
            }
          }
          if (!foundClosingFence) {
            lineStartIndexInSlice = nextLineStartInSliceForInnerLoop;
            i = lines.length;
          }
          continue;
        }
        lineStartIndexInSlice += lineText.length + 1;
        i++;
      }
    }
  }
};
var VerticalBarWidget = class extends WidgetType {
  toDOM() {
    const bar = document.createElement("span");
    bar.className = "cm-blockquote-bar";
    return bar;
  }
  ignoreEvent() {
    return true;
  }
};
var BlockquoteBarWidget = class extends WidgetType {
  constructor(level) {
    super();
    this.level = level;
  }
  toDOM() {
    const span = document.createElement("span");
    for (let i = 0; i < this.level; i++) {
      const bar = document.createElement("span");
      bar.className = "cm-blockquote-bar";
      span.appendChild(bar);
    }
    return span;
  }
  ignoreEvent() {
    return true;
  }
};
var BlockquoteDecorator = class {
  process(context) {
    const { docText, textSliceFrom, decorations, currentMode, cursorPositions, view } = context;
    if (!decorations) return;
    const lines = docText.split("\n");
    if (currentMode === "preview") {
      let charPos = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const match = lineText.match(/^(\s*)((?:>\s*)+)(.*)$/);
        if (match && lineText.length > 0) {
          const markerStr = String(match[2]);
          const barCount = (markerStr.match(/>/g) || []).length;
          const lineStartInDoc = charPos;
          const markerStart = lineStartInDoc + match[1].length;
          decorations.push({
            from: markerStart,
            to: markerStart + markerStr.length,
            decoration: Decoration.replace({ widget: new BlockquoteBarWidget(barCount) })
          });
        }
        charPos += lineText.length + 1;
      }
    } else {
      let charPos = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const match = lineText.match(/^(\s*)((?:>\s*)+)(.*)$/);
        if (match && lineText.length > 0) {
          const markerStr = String(match[2]);
          const level = (markerStr.match(/>/g) || []).length;
          const lineStartInDoc = charPos;
          const lineEndInDoc = charPos + lineText.length;
          const isActive = cursorPositions.some((pos) => pos >= lineStartInDoc && pos <= lineEndInDoc);
          if (!isActive && level > 0) {
            const markerStart = lineStartInDoc + match[1].length;
            for (let k = 0; k < markerStr.length; k++) {
              if (markerStr[k] === ">") {
                decorations.push({
                  from: markerStart + k,
                  to: markerStart + k + 1,
                  decoration: Decoration.replace({ widget: new VerticalBarWidget() })
                });
              }
            }
          }
        }
        charPos += lineText.length + 1;
      }
    }
  }
};
var markdownSyntaxHider = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }
    update(update) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    buildDecorations(view) {
      const decorationsArray = [];
      const doc = view.state.doc;
      const fullText = doc.toString();
      const cursorPositions = [];
      for (const range of view.state.selection.ranges) {
        cursorPositions.push(range.head);
        if (range.head !== range.anchor) {
          cursorPositions.push(range.anchor);
        }
      }
      this.findHeadingDecorations(decorationsArray, 0, fullText, cursorPositions);
      this.findBoldDecorations(decorationsArray, 0, fullText, cursorPositions);
      this.findItalicDecorations(decorationsArray, 0, fullText, cursorPositions);
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, "~~", "~~", "markdown-strikethrough-active");
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, "==", "==", "markdown-highlight-active");
      this.findFormattingDecorations(decorationsArray, 0, fullText, cursorPositions, "`", "`", "markdown-code-active");
      decorationsArray.sort((a, b) => {
        if (a.from !== b.from) return a.from - b.from;
        return a.to - b.to;
      });
      const builder = new RangeSetBuilder();
      for (const { from, to, decoration } of decorationsArray) {
        if (from < to) {
          builder.add(from, to, decoration);
        }
      }
      return builder.finish();
    }
    // Find heading decorations (# Heading)
    findHeadingDecorations(decorations, start, text, cursorPositions) {
      const headingRegex = /^(#{1,6})\s(.*)$/gm;
      let match;
      while ((match = headingRegex.exec(text)) !== null) {
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === "\\") {
          continue;
        }
        const lineStart = start + matchStart;
        const hashMarks = match[1];
        const hashCount = hashMarks.length;
        const hashStart = lineStart;
        const hashEnd = hashStart + hashCount;
        const spaceEnd = hashEnd + 1;
        const lineEnd = lineStart + match[0].length;
        let isCursorNearHash = false;
        for (const cursor of cursorPositions) {
          if (cursor >= hashStart - 1 && cursor <= spaceEnd + 1) {
            isCursorNearHash = true;
            break;
          }
        }
        decorations.push({
          from: spaceEnd,
          to: lineEnd,
          decoration: Decoration.mark({ class: `markdown-heading-${hashCount}` })
        });
        if (isCursorNearHash) {
          decorations.push({
            from: hashStart,
            to: hashEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
          decorations.push({
            from: hashEnd,
            to: spaceEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
        } else {
          decorations.push({
            from: hashStart,
            to: hashEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
          decorations.push({
            from: hashEnd,
            to: spaceEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
        }
      }
    }
    // Find bold text formatting (**bold** or __bold__)
    findBoldDecorations(decorations, start, text, cursorPositions) {
      const boldPattern = /\*\*(.*?)\*\*/g;
      const escapeChar = "\\";
      let match;
      while ((match = boldPattern.exec(text)) !== null) {
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === escapeChar) {
          continue;
        }
        const fullMatch = match[0];
        match[1];
        const fullStart = start + matchStart;
        const fullEnd = fullStart + fullMatch.length;
        const openStart = fullStart;
        const openEnd = fullStart + 2;
        const contentStart = openEnd;
        const contentEnd = fullEnd - 2;
        const closeStart = contentEnd;
        const closeEnd = fullEnd;
        let isCursorNearBold = false;
        for (const cursor of cursorPositions) {
          if (cursor >= openStart - 1 && cursor <= closeEnd + 1) {
            isCursorNearBold = true;
            break;
          }
        }
        decorations.push({
          from: contentStart,
          to: contentEnd,
          decoration: Decoration.mark({ class: "markdown-bold-active" })
        });
        if (isCursorNearBold) {
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
        } else {
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
        }
      }
      const boldUnderscorePattern = /__(.*?)__/g;
      while ((match = boldUnderscorePattern.exec(text)) !== null) {
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === escapeChar) {
          continue;
        }
        const fullMatch = match[0];
        match[1];
        const fullStart = start + matchStart;
        const fullEnd = fullStart + fullMatch.length;
        const openStart = fullStart;
        const openEnd = fullStart + 2;
        const contentStart = openEnd;
        const contentEnd = fullEnd - 2;
        const closeStart = contentEnd;
        const closeEnd = fullEnd;
        let isCursorNearBold = false;
        for (const cursor of cursorPositions) {
          if (cursor >= openStart - 1 && cursor <= closeEnd + 1) {
            isCursorNearBold = true;
            break;
          }
        }
        decorations.push({
          from: contentStart,
          to: contentEnd,
          decoration: Decoration.mark({ class: "markdown-bold-active" })
        });
        if (isCursorNearBold) {
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
        } else {
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
        }
      }
    }
    // Find italic text formatting (*italic* or _italic_)
    findItalicDecorations(decorations, start, text, cursorPositions) {
      const italicRegex = /(?<!\*)\*(?!\*)([^\*]+)\*(?!\*)/g;
      const escapeChar = "\\";
      const processedPositions = /* @__PURE__ */ new Set();
      let match;
      while ((match = italicRegex.exec(text)) !== null) {
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === escapeChar) {
          continue;
        }
        if (processedPositions.has(matchStart)) {
          continue;
        }
        processedPositions.add(matchStart);
        const fullMatch = match[0];
        match[1];
        const fullStart = start + matchStart;
        const fullEnd = fullStart + fullMatch.length;
        const openStart = fullStart;
        const openEnd = fullStart + 1;
        const contentStart = openEnd;
        const contentEnd = fullEnd - 1;
        const closeStart = contentEnd;
        const closeEnd = fullEnd;
        let isCursorNearItalic = false;
        for (const cursor of cursorPositions) {
          if (cursor >= openStart - 1 && cursor <= closeEnd + 1) {
            isCursorNearItalic = true;
            break;
          }
        }
        decorations.push({
          from: contentStart,
          to: contentEnd,
          decoration: Decoration.mark({ class: "markdown-italic-active" })
        });
        if (isCursorNearItalic) {
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
        } else {
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
        }
      }
      const italicUnderscoreRegex = /(?<!_)_(?!_)([^_]+)_(?!_)/g;
      while ((match = italicUnderscoreRegex.exec(text)) !== null) {
        const matchStart = match.index;
        if (matchStart > 0 && text.charAt(matchStart - 1) === escapeChar) {
          continue;
        }
        const fullMatch = match[0];
        match[1];
        const fullStart = start + matchStart;
        const fullEnd = fullStart + fullMatch.length;
        const openStart = fullStart;
        const openEnd = fullStart + 1;
        const contentStart = openEnd;
        const contentEnd = fullEnd - 1;
        const closeStart = contentEnd;
        const closeEnd = fullEnd;
        let isCursorNearItalic = false;
        for (const cursor of cursorPositions) {
          if (cursor >= openStart - 1 && cursor <= closeEnd + 1) {
            isCursorNearItalic = true;
            break;
          }
        }
        decorations.push({
          from: contentStart,
          to: contentEnd,
          decoration: Decoration.mark({ class: "markdown-italic-active" })
        });
        if (isCursorNearItalic) {
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-active" })
          });
        } else {
          decorations.push({
            from: openStart,
            to: openEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
          decorations.push({
            from: closeStart,
            to: closeEnd,
            decoration: Decoration.mark({ class: "markdown-syntax-dim" })
          });
        }
      }
    }
    // Generic method for other formatting types (strikethrough, highlight, code)
    findFormattingDecorations(decorations, start, text, cursorPositions, openMarker, closeMarker, styleClass) {
      const escapeChar = "\\";
      const markerLength = openMarker.length;
      const openRegexString = this.escapeRegExp(openMarker);
      const closeRegexString = this.escapeRegExp(closeMarker);
      const pattern = new RegExp(openRegexString + "([\\s\\S]*?)" + closeRegexString, "g");
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const matchStartIndex = match.index;
        if (matchStartIndex > 0 && text.charAt(matchStartIndex - 1) === escapeChar) {
          let backslashCount = 0;
          let currentPos = matchStartIndex - 1;
          while (currentPos >= 0 && text.charAt(currentPos) === escapeChar) {
            backslashCount++;
            currentPos--;
          }
          if (backslashCount % 2 !== 0) {
            continue;
          }
        }
        const fullMatchedText = match[0];
        const contentText = match[1];
        const absoluteMatchStart = start + matchStartIndex;
        const absoluteMatchEnd = absoluteMatchStart + fullMatchedText.length;
        const openMarkerStart = absoluteMatchStart;
        const openMarkerEnd = absoluteMatchStart + markerLength;
        const contentBodyStart = openMarkerEnd;
        const contentBodyEnd = absoluteMatchEnd - markerLength;
        const closeMarkerStart = contentBodyEnd;
        const closeMarkerEnd = absoluteMatchEnd;
        let isCursorClose = false;
        for (const cursorPos of cursorPositions) {
          if (cursorPos >= openMarkerStart - 1 && cursorPos <= closeMarkerEnd + 1) {
            isCursorClose = true;
            break;
          }
        }
        if (contentText && contentText.length > 0) {
          decorations.push({
            from: contentBodyStart,
            to: contentBodyEnd,
            decoration: Decoration.mark({ class: styleClass })
          });
        }
        const markerVisibilityClass = isCursorClose ? "markdown-syntax-active" : "markdown-syntax-dim";
        decorations.push({
          from: openMarkerStart,
          to: openMarkerEnd,
          decoration: Decoration.mark({ class: markerVisibilityClass })
        });
        decorations.push({
          from: closeMarkerStart,
          to: closeMarkerEnd,
          decoration: Decoration.mark({ class: markerVisibilityClass })
        });
      }
    }
    // Helper function to escape special regex characters
    escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  },
  {
    decorations: (v) => v.decorations
  }
);

// src/app/obsidian-editor/extensions/markdown-syntax/index.ts
var syntaxRules = [
  new HeadingDecorator(),
  new BoldDecorator(),
  new ItalicDecorator(),
  new StrikethroughDecorator(),
  new CodeDecorator(),
  new HighlightDecorator(),
  new OldBoldDecorator(),
  new OldItalicDecorator(),
  new ListDecorator(),
  new BlockquoteDecorator(),
  new FencedCodeBlockDecorator()
  // HorizontalRuleDecorator is now a ViewPlugin and managed separately
];
var setMarkdownSyntaxMode2 = StateEffect.define();
function buildLegacyDecorations(state, currentMode, view) {
  const builder = new RangeSetBuilder();
  const allDecorations = [];
  const cursorPositions = [];
  for (const range of state.selection.ranges) {
    cursorPositions.push(range.head);
  }
  const rangesToProcess = [{ from: 0, to: state.doc.length }];
  const htmlRegions = findHtmlRegions(state);
  for (const { from, to } of rangesToProcess) {
    const docTextSlice = state.doc.sliceString(from, to);
    const context = {
      builder,
      docText: docTextSlice,
      textSliceFrom: from,
      cursorPositions,
      state,
      view,
      decorations: allDecorations,
      currentMode,
      htmlEditRegions: htmlRegions
      // Pass HTML regions to avoid processing markdown inside them
    };
    for (const rule of syntaxRules) {
      try {
        if (typeof rule.process === "function") {
          rule.process(context);
        } else {
          console.warn(`Rule ${rule.constructor.name} does not have a process method.`);
        }
      } catch (error) {
        console.error("Error processing legacy rule:", rule.constructor.name, error);
      }
    }
  }
  for (const region of htmlRegions) {
    allDecorations.push({
      from: region.from,
      to: region.to,
      decoration: Decoration.mark({
        class: "cm-plain-text cm-html-content cm-disable-markdown-parsing cm-no-list-rendering",
        attributes: { "data-html-content": "true", "data-no-markdown": "true" }
      })
    });
  }
  const groupedDecorations = /* @__PURE__ */ new Map();
  for (const item of allDecorations) {
    if (!item.decoration.spec.class?.includes("cm-html-content") && isInsideHtml(item.from, item.to, htmlRegions)) {
      continue;
    }
    if (!groupedDecorations.has(item.from)) {
      groupedDecorations.set(item.from, []);
    }
    if (item.decoration) {
      groupedDecorations.get(item.from).push(item);
    } else {
      console.warn("Encountered an item with undefined decoration during legacy build:", item);
    }
  }
  const sortedFromPositions = [...groupedDecorations.keys()].sort((a, b) => a - b);
  for (const fromPos of sortedFromPositions) {
    const group = groupedDecorations.get(fromPos);
    group.sort((a, b) => a.to - b.to);
    for (const item of group) {
      builder.add(item.from, item.to, item.decoration);
    }
  }
  return builder.finish();
}
var markdownSyntaxStateField = StateField.define({
  /**
   * Creates the initial state for the field
   * @param state - The editor state
   * @returns The initial field value
   */
  create(state) {
    const initialMode = "live";
    return {
      decorations: buildLegacyDecorations(state, initialMode, void 0),
      currentMode: initialMode
    };
  },
  /**
   * Updates the field value based on transactions
   * @param value - The current field value
   * @param tr - The transaction to apply
   * @returns The updated field value
   */
  update(value, tr) {
    let newMode = value.currentMode;
    for (const effect of tr.effects) {
      if (effect.is(setMarkdownSyntaxMode2)) {
        newMode = effect.value;
      }
    }
    let modeChangedByEffect = false;
    for (const effect of tr.effects) {
      if (effect.is(setMarkdownSyntaxMode2)) {
        if (newMode !== effect.value) {
          newMode = effect.value;
          modeChangedByEffect = true;
        }
      }
    }
    if (tr.docChanged || tr.selection && !tr.startState.selection.eq(tr.selection) || modeChangedByEffect) {
      return {
        decorations: buildLegacyDecorations(tr.state, newMode, void 0),
        currentMode: newMode
      };
    }
    if (value.currentMode !== newMode) {
      return {
        decorations: buildLegacyDecorations(tr.state, newMode, void 0),
        currentMode: newMode
      };
    }
    return value;
  },
  /**
   * Provides the decorations to the editor view
   */
  provide: (f) => EditorView.decorations.from(f, (value) => value.decorations)
});
var markdownCompartment = new Compartment();
function createMarkdownSyntaxPlugin(options = {}) {
  const { highlightHTML = true } = options;
  const markdownConfig = {
    codeLanguages: languages
  };
  return [
    markdownCompartment.of(markdown(markdownConfig)),
    markdownSyntaxStateField,
    markdownSyntaxHider
  ];
}
function findHtmlRegions(state) {
  const regions = [];
  const tree = syntaxTree(state);
  tree.iterate({
    enter: (node) => {
      if (node.name.includes("HtmlTag") || node.name.includes("HtmlBlock") || node.name.includes("OpenTag") || node.name.includes("CloseTag") || node.name.includes("SelfClosingTag") || node.name.includes("Element")) {
        regions.push({ from: node.from, to: node.to });
      }
    }
  });
  return regions;
}
function isInsideHtml(from, to, htmlRegions) {
  for (const region of htmlRegions) {
    if (from >= region.from && to <= region.to) {
      return true;
    }
  }
  return false;
}

// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/types.ts
var VOID_TAGS = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
var DANGEROUS_TAGS = /* @__PURE__ */ new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "applet",
  "base",
  "form",
  "frame",
  "frameset"
]);

// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/html-widget.ts
var DEBUG = false;
var HtmlPreviewWidget = class extends WidgetType {
  constructor(content, isMultiline = false) {
    super();
    this.content = content;
    this.isMultiline = isMultiline;
  }
  eq(other) {
    return this.content === other.content && this.isMultiline === other.isMultiline;
  }
  /**
   * Renders the HTML content as a DOM element
   */
  toDOM() {
    try {
      if (DEBUG) ;
      const wrapper = document.createElement("div");
      wrapper.className = "cm-html-preview-widget";
      if (this.isMultiline) {
        wrapper.classList.add("cm-html-preview-multiline");
      } else {
        wrapper.classList.add("cm-html-preview-inline");
      }
      const contentContainer = document.createElement("div");
      contentContainer.className = "cm-html-content-container";
      contentContainer.style.cssText = `
        padding: 0;
        background: transparent;
        border-radius: 0;
      `;
      try {
        const securityWarnings = this.checkSecurityIssues(this.content);
        if (securityWarnings.length > 0) {
          securityWarnings.forEach((warning) => {
            const warningElement = document.createElement("div");
            warningElement.className = "cm-html-security-warning";
            warningElement.innerHTML = `\u26A0\uFE0F ${warning}`;
            contentContainer.appendChild(warningElement);
          });
        }
        let htmlToRender = this.content;
        let isBlockElement = false;
        const tagMatch = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)(?:\s*\/?>)/i.exec(this.content);
        if (tagMatch) {
          const tagName = tagMatch[1].toLowerCase();
          isBlockElement = this.isBlockElement(tagName);
        }
        const htmlContainer = document.createElement("div");
        htmlContainer.style.cssText = `
          display: block; 
          width: 100%;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          color: inherit;
        `;
        if (isBlockElement) {
          htmlContainer.style.cssText += "display: block;";
        }
        htmlContainer.innerHTML = this.sanitizeHtml(htmlToRender);
        htmlContainer.querySelectorAll("*").forEach((element) => {
          if (element instanceof HTMLElement) {
            if (!element.hasAttribute("style")) {
              element.style.fontFamily = "inherit";
              element.style.fontSize = "inherit";
              element.style.lineHeight = "inherit";
              element.style.color = "inherit";
            }
            if (this.isBlockElement(element.tagName)) {
              element.style.display = "block";
              element.style.width = "100%";
              element.style.boxSizing = "border-box";
              if (!element.style.marginTop) element.style.marginTop = "0";
              if (!element.style.marginBottom) element.style.marginBottom = "0";
            }
            if (element.tagName === "UL") {
              element.style.listStyleType = "disc";
              element.style.paddingLeft = "2em";
              element.style.marginTop = "0.2em";
              element.style.marginBottom = "0.2em";
            } else if (element.tagName === "OL") {
              element.style.listStyleType = "decimal";
              element.style.paddingLeft = "2em";
              element.style.marginTop = "0.2em";
              element.style.marginBottom = "0.2em";
            } else if (element.tagName === "LI") {
              element.style.display = "list-item";
              element.style.marginTop = "0.1em";
              element.style.marginBottom = "0.1em";
            } else if (element.tagName === "DIV") {
              element.style.width = "100%";
              element.style.boxSizing = "border-box";
              element.style.margin = "0";
              element.style.padding = "0";
            } else if (element.tagName === "P") {
              element.style.marginTop = "0.2em";
              element.style.marginBottom = "0.2em";
            }
          }
        });
        contentContainer.appendChild(htmlContainer);
        this.disableInteractiveElements(htmlContainer);
      } catch (error) {
        console.error("Error rendering HTML:", error);
        const errorDiv = document.createElement("div");
        errorDiv.className = "cm-html-error";
        errorDiv.textContent = `Error rendering HTML: ${error.message || "Unknown error"}`;
        contentContainer.appendChild(errorDiv);
      }
      wrapper.appendChild(contentContainer);
      return wrapper;
    } catch (error) {
      console.error("Fatal error in HTML widget:", error);
      const errorElement = document.createElement("div");
      errorElement.className = "cm-html-error";
      errorElement.textContent = "Error rendering HTML content";
      return errorElement;
    }
  }
  /**
   * Check for potential security issues in HTML content
   */
  checkSecurityIssues(html2) {
    const warnings = [];
    DANGEROUS_TAGS.forEach((tag) => {
      const tagRegex = new RegExp(`<${tag}[\\s>]`, "i");
      if (tagRegex.test(html2)) {
        warnings.push(`${tag.toUpperCase()} tag detected and will be sanitized`);
      }
    });
    if (/\son\w+\s*=/i.test(html2)) {
      warnings.push("Event handlers detected and removed");
    }
    if (/javascript:/i.test(html2)) {
      warnings.push("JavaScript URLs detected and removed");
    }
    return warnings;
  }
  /**
   * Sanitizes HTML to prevent XSS attacks
   */
  sanitizeHtml(html2) {
    let sanitized = html2.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "void:");
    DANGEROUS_TAGS.forEach((tag) => {
      const tagName = tag.toUpperCase();
      const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi");
      sanitized = sanitized.replace(regex, (match, attrs, content) => {
        return `<div class="cm-html-removed-tag">[${tagName} removed]</div>`;
      });
      const selfClosingRegex = new RegExp(`<${tag}([^>]*?)\\s*\\/>`, "gi");
      sanitized = sanitized.replace(
        selfClosingRegex,
        `<div class="cm-html-removed-tag">[${tagName} removed]</div>`
      );
    });
    return sanitized;
  }
  /**
   * Disable interactive elements like links and forms
   */
  disableInteractiveElements(container) {
    try {
      const links = container.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", (e) => e.preventDefault());
        link.style.pointerEvents = "none";
        if (link.hasAttribute("href")) {
          link.setAttribute("data-href", link.getAttribute("href") || "");
          link.removeAttribute("href");
        }
      });
      const forms = container.querySelectorAll("form");
      forms.forEach((form) => {
        form.addEventListener("submit", (e) => e.preventDefault());
        form.setAttribute("onsubmit", "return false;");
      });
      const buttons = container.querySelectorAll('button, input[type="submit"], input[type="button"]');
      buttons.forEach((button) => {
        button.setAttribute("disabled", "disabled");
        button.addEventListener("click", (e) => e.preventDefault());
      });
    } catch (error) {
    }
  }
  /**
   * Try to find the editor view from a DOM element
   */
  getEditorViewFromElement(element) {
    try {
      let current = element;
      while (current) {
        const editorEl = current.closest(".cm-editor");
        if (editorEl) {
          for (const key in editorEl) {
            if (key.startsWith("__")) {
              const value = editorEl[key];
              if (value instanceof EditorView) {
                return value;
              }
            }
          }
          if (editorEl.cmView) {
            return editorEl.cmView;
          }
        }
        current = current.parentElement;
      }
      if (window.CodeMirrorViewRegistry) {
        const registry = window.CodeMirrorViewRegistry;
        for (const view of registry) {
          if (view.dom && view.dom.contains(element)) {
            return view;
          }
        }
      }
    } catch (error) {
      console.error("Error finding editor view:", error);
    }
    return null;
  }
  /**
   * Allow events from the content (like scrolling in a div)
   */
  ignoreEvent() {
    return false;
  }
  /**
   * Check if a tag name represents a block element
   */
  isBlockElement(tagName) {
    const blockElements = [
      "DIV",
      "P",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "ARTICLE",
      "SECTION",
      "HEADER",
      "FOOTER",
      "BLOCKQUOTE",
      "UL",
      "OL",
      "LI",
      "TABLE",
      "TR",
      "HR",
      "PRE",
      "FIGURE"
    ];
    return blockElements.includes(tagName.toUpperCase());
  }
};
var HtmlSyntaxHighlighter = class {
  /**
   * Highlight HTML code with appropriate syntax classes
   */
  static highlight(region) {
    try {
      if (!region.content || region.content.length === 0) {
        return Decoration.none;
      }
      const builder = new RangeSetBuilder();
      builder.add(
        region.from,
        region.to,
        Decoration.mark({
          class: "cm-html-code-mode cm-disable-markdown-parsing cm-plain-text",
          inclusive: true
        })
      );
      this.addHtmlTokens(builder, region.content, region.from);
      return builder.finish();
    } catch (error) {
      console.error("Error in HTML syntax highlighter:", error);
      return Decoration.none;
    }
  }
  /**
   * Add HTML token decorations directly to builder
   */
  static addHtmlTokens(builder, html2, baseOffset) {
    const tagStack = [];
    let currentLevel = 0;
    const tokenRegex = /<\/?([a-zA-Z][a-zA-Z0-9\-_:]*)|\s([a-zA-Z][a-zA-Z0-9\-_:]*)(=(?:(['"]).*?\4|\S+))?|(['"])(.*?)\5|(\/?>)/g;
    let match;
    const tokens = [];
    while ((match = tokenRegex.exec(html2)) !== null) {
      try {
        const [full, tagName, attrName, fullAttr, q1, attrValue, q2, bracket] = match;
        const start = baseOffset + match.index;
        if (tagName) {
          const isClosing = full.startsWith("</");
          const tagStart2 = start;
          const tagEnd = start + (isClosing ? 2 : 1) + tagName.length;
          tokens.push({
            from: tagStart2,
            to: tagStart2 + (isClosing ? 2 : 1),
            class: `cm-html-bracket cm-html-bracket-level-${currentLevel % 6}`
          });
          tokens.push({
            from: tagStart2 + (isClosing ? 2 : 1),
            to: tagEnd,
            class: `cm-html-tag-name cm-html-tag-level-${currentLevel % 6}`
          });
          if (isClosing) {
            for (let i = tagStack.length - 1; i >= 0; i--) {
              if (tagStack[i].name === tagName.toLowerCase()) {
                currentLevel = tagStack[i].level;
                tagStack.splice(i);
                break;
              }
            }
          } else {
            tagStack.push({
              name: tagName.toLowerCase(),
              level: currentLevel
            });
            currentLevel = (currentLevel + 1) % 6;
          }
        } else if (attrName) {
          const attrStart = start + 1;
          const attrEnd = attrStart + attrName.length;
          tokens.push({
            from: attrStart,
            to: attrEnd,
            class: "cm-html-attribute"
          });
          if (fullAttr && fullAttr.includes("=")) {
            const equalsPos = fullAttr.indexOf("=");
            const valueStart = attrStart + attrName.length + 1;
            if (q1) {
              const quoteLen = q1.length;
              tokens.push({
                from: valueStart,
                to: valueStart + fullAttr.length - equalsPos - 1,
                class: "cm-html-attribute-value"
              });
            } else if (fullAttr.length > equalsPos + 1) {
              tokens.push({
                from: valueStart,
                to: valueStart + fullAttr.length - equalsPos - 1,
                class: "cm-html-attribute-value"
              });
            }
          }
        } else if (attrValue !== void 0 && q2) {
          const valueStart = start;
          const valueEnd = start + q2.length + attrValue.length + q2.length;
          tokens.push({
            from: valueStart,
            to: valueEnd,
            class: "cm-html-attribute-value"
          });
        } else if (bracket) {
          const bracketStart = start;
          const bracketEnd = start + bracket.length;
          const isSelfClosing = bracket === "/>" || bracket === ">" && tagStack.length > 0 && VOID_TAGS.has(tagStack[tagStack.length - 1].name);
          tokens.push({
            from: bracketStart,
            to: bracketEnd,
            class: `cm-html-bracket cm-html-bracket-level-${Math.max(0, currentLevel - (isSelfClosing ? 1 : 0)) % 6}`
          });
          if (isSelfClosing && tagStack.length > 0) {
            currentLevel = tagStack[tagStack.length - 1].level;
            tagStack.pop();
          }
        }
      } catch (tokenError) {
        console.warn("Error processing token:", tokenError);
      }
    }
    tokens.sort((a, b) => {
      if (a.from !== b.from) return a.from - b.from;
      return a.to - b.to;
    });
    for (const token of tokens) {
      builder.add(
        token.from,
        token.to,
        Decoration.mark({ class: token.class })
      );
    }
  }
};
function detectHtmlRegions(view) {
  try {
    const regions = [];
    const { state } = view;
    const doc = state.doc;
    const fullText = doc.toString();
    const commentRegions = findHtmlComments(fullText);
    const parsedRegions = parseHtmlHierarchy(fullText, commentRegions);
    for (const region of parsedRegions) {
      try {
        const { from, to, tagName, content, isMultiline, isSelfClosing, openTagEnd, closeTagStart } = region;
        regions.push({
          from,
          to,
          tagName,
          isMultiline,
          content,
          openTagEnd,
          closeTagStart,
          isSelfClosing
        });
      } catch (error) {
        console.error("Error processing HTML region:", error);
      }
    }
    regions.sort((a, b) => a.from - b.from);
    return regions;
  } catch (error) {
    console.error("Error detecting HTML regions:", error);
    return [];
  }
}
function parseHtmlHierarchy(text, commentRegions) {
  const regions = [];
  const tagStack = [];
  const tagRegex = /<\/?\s*([a-zA-Z][a-zA-Z0-9\-_:]*)((?:\s+[a-zA-Z][a-zA-Z0-9\-_:]*(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?)>/g;
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    const [fullMatch, tagName, attributes, selfClosing] = match;
    const position = match.index;
    const matchEnd = position + fullMatch.length;
    const lowerTagName = tagName.toLowerCase();
    if (isPositionInRanges(position, commentRegions)) {
      continue;
    }
    const isClosingTag = fullMatch.startsWith("</");
    const isSelfClosingTag = selfClosing === "/" || VOID_TAGS.has(lowerTagName);
    if (isClosingTag) {
      let foundMatchingTag = false;
      for (let i = tagStack.length - 1; i >= 0; i--) {
        const openTag = tagStack[i];
        if (openTag.tagName.toLowerCase() === lowerTagName) {
          const from = openTag.startIndex;
          const to = matchEnd;
          const content = text.substring(from, to);
          const isMultiline = content.includes("\n");
          regions.push({
            from,
            to,
            tagName: lowerTagName,
            content,
            isMultiline,
            isSelfClosing: false,
            openTagEnd: openTag.openTagEnd,
            closeTagStart: position
          });
          tagStack.splice(i);
          foundMatchingTag = true;
          break;
        }
      }
      if (!foundMatchingTag && VOID_TAGS.has(lowerTagName) === false) ;
    } else if (isSelfClosingTag) {
      regions.push({
        from: position,
        to: matchEnd,
        tagName: lowerTagName,
        content: fullMatch,
        isMultiline: false,
        isSelfClosing: true,
        openTagEnd: matchEnd,
        closeTagStart: matchEnd
      });
    } else {
      tagStack.push({
        tagName: lowerTagName,
        startIndex: position,
        openTagEnd: matchEnd,
        content: fullMatch
      });
    }
  }
  const voidTagRegex = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)>/g;
  voidTagRegex.lastIndex = 0;
  while ((match = voidTagRegex.exec(text)) !== null) {
    const [fullTag, tagName, attributes] = match;
    const lowerTagName = tagName.toLowerCase();
    const position = match.index;
    const tagEnd = position + fullTag.length;
    if (VOID_TAGS.has(lowerTagName) && !regions.some((r) => r.from === position) && !isPositionInRanges(position, commentRegions)) {
      regions.push({
        from: position,
        to: tagEnd,
        tagName: lowerTagName,
        isMultiline: false,
        content: fullTag,
        openTagEnd: tagEnd,
        closeTagStart: tagEnd,
        isSelfClosing: true
      });
    }
  }
  return regions;
}
function isPositionInRanges(position, ranges) {
  return ranges.some((range) => position >= range.from && position < range.to);
}
function findHtmlComments(text) {
  const comments = [];
  const commentRegex = /<!--[\s\S]*?-->/g;
  let match;
  while ((match = commentRegex.exec(text)) !== null) {
    comments.push({
      from: match.index,
      to: match.index + match[0].length
    });
  }
  return comments;
}
function isCursorNearRegion(view, region) {
  const selection = view.state.selection.main;
  const cursor = selection.head;
  view.state.doc;
  if (cursor > region.from && cursor < region.to) {
    return true;
  }
  if (cursor === region.from || cursor === region.to) {
    return true;
  }
  return false;
}
function isEditorInPreviewMode(view) {
  if (!view.state.facet(EditorView.editable)) {
    return true;
  }
  let element = view.dom;
  while (element) {
    if (element.classList && element.classList.contains("preview-mode")) {
      return true;
    }
    element = element.parentElement;
  }
  return false;
}

// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/decorations.ts
var DEBUG2 = false;
function buildHtmlDecorations(view) {
  try {
    if (DEBUG2) ;
    const regions = detectHtmlRegions(view);
    if (!regions.length) {
      if (DEBUG2) ;
      return Decoration.none;
    }
    if (DEBUG2) ;
    const inPreviewMode = isEditorInPreviewMode(view);
    return buildSmartDecorations(regions, view, inPreviewMode);
  } catch (error) {
    console.error("Error building HTML decorations:", error);
    return Decoration.none;
  }
}
function buildSmartDecorations(regions, view, inPreviewMode) {
  const allDecorations = [];
  const cursorRanges = view.state.selection.ranges;
  const editModeRegions = /* @__PURE__ */ new Set();
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    for (const range of cursorRanges) {
      if (isCursorNearRegion(view, region)) {
        editModeRegions.add(i);
        break;
      }
    }
  }
  let madeChange = true;
  while (madeChange) {
    madeChange = false;
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      if (editModeRegions.has(i)) {
        for (let j = 0; j < regions.length; j++) {
          if (i !== j && !editModeRegions.has(j)) {
            const nestedRegion = regions[j];
            if (nestedRegion.from >= region.from && nestedRegion.to <= region.to) {
              editModeRegions.add(j);
              madeChange = true;
            }
          }
        }
      } else {
        for (let j = 0; j < regions.length; j++) {
          if (editModeRegions.has(j)) {
            const editModeRegion = regions[j];
            if (editModeRegion.from >= region.from && editModeRegion.to <= region.to) {
              editModeRegions.add(i);
              madeChange = true;
              break;
            }
          }
        }
      }
    }
  }
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    try {
      if (editModeRegions.has(i)) {
        if (DEBUG2) ;
        allDecorations.push({
          from: region.from,
          to: region.to,
          decoration: Decoration.mark({
            class: "cm-plain-text-marker cm-disable-markdown-parsing cm-html-code-mode cm-no-list-rendering cm-no-markdown",
            inclusiveStart: true,
            inclusiveEnd: true,
            attributes: {
              "data-html-content": "true",
              "data-no-markdown": "true",
              "data-no-list": "true"
            }
          })
        });
        const syntaxDecorationSet = HtmlSyntaxHighlighter.highlight(region);
        const syntaxDecorations = [];
        syntaxDecorationSet.between(region.from, region.to, (from, to, deco) => {
          syntaxDecorations.push({
            from,
            to,
            decoration: deco
          });
        });
        if (syntaxDecorations.length > 0) {
          allDecorations.push(...syntaxDecorations);
        }
      } else {
        if (DEBUG2) ;
        let htmlContent = region.content;
        const tagMatch = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)>([\s\S]*?)<\/\1>/i.exec(region.content);
        if (tagMatch) {
          const tagName = tagMatch[1].toLowerCase();
          const attributes = tagMatch[2] || "";
          const innerContent = tagMatch[3] || "";
          if (tagName === "div" || tagName === "span") {
            const styleMatch = /style\s*=\s*(['"])(.*?)\1/i.exec(attributes);
            const styleValue = styleMatch ? styleMatch[2] : "";
            if (styleValue) {
              htmlContent = `<div style="${styleValue}">${innerContent}</div>`;
            } else {
              htmlContent = innerContent;
            }
          }
        }
        let overlapsEditMode = false;
        for (const editIndex of editModeRegions) {
          const editRegion = regions[editIndex];
          if (region.from >= editRegion.from && region.from < editRegion.to || region.to > editRegion.from && region.to <= editRegion.to || region.from <= editRegion.from && region.to >= editRegion.to) {
            overlapsEditMode = true;
            break;
          }
        }
        if (!overlapsEditMode) {
          allDecorations.push({
            from: region.from,
            to: region.to,
            decoration: Decoration.replace({
              widget: new HtmlPreviewWidget(htmlContent, region.isMultiline)
            })
          });
        }
      }
    } catch (error) {
      console.error("Error processing region:", error, region);
    }
  }
  const builder = new RangeSetBuilder();
  try {
    const positionMap = /* @__PURE__ */ new Map();
    for (const deco of allDecorations) {
      if (deco.from < deco.to) {
        if (!positionMap.has(deco.from)) {
          positionMap.set(deco.from, []);
        }
        positionMap.get(deco.from).push(deco);
      }
    }
    const positions = Array.from(positionMap.keys()).sort((a, b) => a - b);
    for (const pos of positions) {
      const decos = positionMap.get(pos);
      decos.sort((a, b) => {
        const aIsWidget = a.decoration.spec.widget !== void 0;
        const bIsWidget = b.decoration.spec.widget !== void 0;
        if (aIsWidget !== bIsWidget) {
          return aIsWidget ? -1 : 1;
        }
        if (!aIsWidget && !bIsWidget) {
          const aInclusive = a.decoration.spec.inclusiveStart === true;
          const bInclusive = b.decoration.spec.inclusiveStart === true;
          if (aInclusive !== bInclusive) {
            return aInclusive ? -1 : 1;
          }
        }
        return a.to - b.to;
      });
      for (const deco of decos) {
        try {
          builder.add(deco.from, deco.to, deco.decoration);
        } catch (e) {
          if (DEBUG2) ;
        }
      }
    }
    return builder.finish();
  } catch (error) {
    console.error("Critical error in decoration building:", error);
    return Decoration.none;
  }
}

// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/cssVarStyles.ts
function addCssVarHtmlStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cm-html-decorator-styles")) {
    const oldStyles = document.getElementById("cm-html-decorator-styles");
    if (oldStyles && oldStyles.parentNode) {
      oldStyles.parentNode.removeChild(oldStyles);
    }
  }
  console.log("Adding HTML decorator styles with CSS variables");
  const style = document.createElement("style");
  style.id = "cm-html-decorator-styles";
  style.textContent = `
    /* Editor container - ensure it can display overflow */
    .cm-editor {
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* HTML decoration using CSS variables - Light Theme */
    .cm-html-preview {
      position: relative;
      background-color: var(--light-html-preview-bg, #f8f8f8);
      border: 1px solid var(--light-html-preview-border, #e0e0e0);
      border-radius: 4px;
      padding: 12px;
      margin: 4px 0;
      box-shadow: var(--light-html-preview-shadow, 0 1px 3px rgba(0,0,0,0.1));
      min-height: 20px;
      max-width: 100%;
      width: calc(100% - 16px);
      display: block;
      visibility: visible !important;
      color: var(--light-html-content-color, #333333);
      z-index: 9999;
    }
    
    /* HTML preview label */
    .cm-html-preview-label {
      position: absolute;
      top: -10px;
      left: 8px;
      background: var(--light-html-label-bg, #e3e3e3);
      color: var(--light-html-label-color, #333333);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      z-index: 10000;
    }
    
    /* HTML content container */
    .cm-html-content {
      background: var(--light-html-content-bg, #ffffff);
      padding: 8px;
      border-radius: 3px;
      color: var(--light-html-content-color, #333333);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      line-height: 1.5;
      min-height: 10px;
    }
    
    /* HTML code syntax highlighting */
    .cm-editor .cm-html-code-mode {
      color: var(--light-html-content-color, #333333) !important;
      font-family: monospace !important;
      background-color: transparent !important;
      border-radius: 0 !important;
    }
    
    .cm-editor .cm-html-tag-name {
      color: var(--light-html-tag-color, #d73a49) !important;
      font-weight: 600 !important;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important;
    }
    
    .cm-editor .cm-html-attribute {
      color: var(--light-html-attribute-color, #e36209) !important;
      font-style: normal !important;
    }
    
    .cm-editor .cm-html-attribute-value {
      color: var(--light-html-attribute-value-color, #22863a) !important;
      font-style: normal !important;
    }
    
    .cm-editor .cm-html-bracket {
      color: var(--light-html-bracket-color, #909090) !important;
      font-weight: normal !important;
      opacity: 1 !important;
    }
    
    /* Dark theme styles */
    .dark .cm-html-preview {
      background-color: var(--dark-html-preview-bg, #282828);
      border: 1px solid var(--dark-html-preview-border, #444444);
      box-shadow: var(--dark-html-preview-shadow, 0 1px 3px rgba(0,0,0,0.3));
      color: var(--dark-html-content-color, #e0e0e0);
    }
    
    .dark .cm-html-preview-label {
      background: var(--dark-html-label-bg, #4a4a4a);
      color: var(--dark-html-label-color, #e0e0e0);
    }
    
    .dark .cm-html-content {
      background: var(--dark-html-content-bg, #333333);
      color: var(--dark-html-content-color, #e0e0e0);
    }
    
    .dark .cm-editor .cm-html-tag-name {
      color: var(--dark-html-tag-color, #f97583) !important;
    }
    
    .dark .cm-editor .cm-html-attribute {
      color: var(--dark-html-attribute-color, #ffab70) !important;
    }
    
    .dark .cm-editor .cm-html-attribute-value {
      color: var(--dark-html-attribute-value-color, #85e89d) !important;
    }
    
    .dark .cm-editor .cm-html-bracket {
      color: var(--dark-html-bracket-color, #a0a0a0) !important;
    }
    
    /* Force visibility of HTML elements inside the preview */
    .cm-html-preview * {
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Block element defaults */
    .cm-html-preview div,
    .cm-html-preview p,
    .cm-html-preview h1,
    .cm-html-preview h2,
    .cm-html-preview h3,
    .cm-html-preview h4,
    .cm-html-preview h5,
    .cm-html-preview h6,
    .cm-html-preview ul,
    .cm-html-preview ol {
      display: block !important;
      margin: 0.4em 0 !important;
    }
    
    /* Heading styles */
    .cm-html-preview h1,
    .cm-html-preview h2,
    .cm-html-preview h3,
    .cm-html-preview h4,
    .cm-html-preview h5,
    .cm-html-preview h6 {
      font-weight: 600 !important;
      color: var(--light-html-heading-color, #333333) !important;
    }
    
    .dark .cm-html-preview h1,
    .dark .cm-html-preview h2,
    .dark .cm-html-preview h3,
    .dark .cm-html-preview h4,
    .dark .cm-html-preview h5,
    .dark .cm-html-preview h6 {
      color: var(--dark-html-heading-color, #e0e0e0) !important;
    }
    
    .cm-html-preview h1 { font-size: 1.4em !important; }
    .cm-html-preview h2 { font-size: 1.2em !important; }
    .cm-html-preview h3 { font-size: 1.1em !important; }
    
    /* Debug info */
    .cm-html-debug-info {
      position: absolute;
      bottom: -12px;
      right: 4px;
      font-size: 8px;
      color: var(--light-html-debug-color, #999999);
      background: rgba(255,255,255,0.7);
      padding: 1px 3px;
      border-radius: 2px;
    }
    
    .dark .cm-html-debug-info {
      color: var(--dark-html-debug-color, #777777);
      background: rgba(0,0,0,0.3);
    }
    
    /* Editorial indicator when in edit mode */
    .cm-editing-html {
      position: relative;
    }
    
    .cm-editing-html::before {
      content: "Editing HTML";
      position: absolute;
      top: -16px;
      right: 8px;
      background-color: var(--light-html-edit-label-bg, #f0f0f0);
      color: var(--light-html-edit-label-color, #555555);
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 2px;
      opacity: 0.8;
    }
    
    .dark .cm-editing-html::before {
      background-color: var(--dark-html-edit-label-bg, #3a3a3a);
      color: var(--dark-html-edit-label-color, #bbbbbb);
    }
  `;
  document.head.appendChild(style);
  console.log("HTML decorator styles with CSS variables added to document");
}

// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/styles.ts
function addHtmlStyles() {
  addCssVarHtmlStyles();
}

// src/app/obsidian-editor/extensions/markdown-syntax/html-decorator/index.ts
var HtmlDecoratorPlugin = class {
  constructor(view) {
    this.enabled = true;
    this.debug = false;
    this.updateScheduled = false;
    this.isDestroyed = false;
    this.lastSelectionHead = -1;
    this.htmlRegions = [];
    this.view = view;
    addHtmlStyles();
    if (view.state.selection.ranges.length > 0) {
      this.lastSelectionHead = view.state.selection.main.head;
    }
    setTimeout(() => {
      this.updateDecorations();
    }, 100);
    if (this.debug) console.log("HtmlDecorator plugin initialized");
  }
  /**
   * Update the view - rebuild decorations when editor changes
   */
  update(update) {
    if (!this.enabled || this.isDestroyed) return;
    const contentChanged = update.docChanged;
    const selectionChanged = update.selectionSet;
    let cursorMoved = false;
    if (selectionChanged && update.state.selection.ranges.length > 0) {
      const newHead = update.state.selection.main.head;
      cursorMoved = newHead !== this.lastSelectionHead;
      this.lastSelectionHead = newHead;
    }
    let htmlContentChanged = false;
    if (contentChanged) {
      update.changes.iterChanges((fromA, toA, fromB, toB) => {
        if (htmlContentChanged) return;
        for (const region of this.htmlRegions) {
          if (fromA <= region.to && toA >= region.from) {
            htmlContentChanged = true;
            break;
          }
        }
        if (!htmlContentChanged) {
          const changedText = update.state.doc.sliceString(fromB, toB);
          htmlContentChanged = changedText.includes("<") && changedText.includes(">");
        }
      });
    }
    if (cursorMoved) {
      const currentPosition = update.state.selection.main.head;
      const cursorInHtmlRegion = this.htmlRegions.some(
        (region) => currentPosition >= region.from && currentPosition <= region.to
      );
      if (!cursorInHtmlRegion) {
        this.htmlRegions.some(
          (region) => currentPosition === region.from || currentPosition === region.to
        );
      }
    }
    if (contentChanged && htmlContentChanged || cursorMoved) {
      const reason = contentChanged ? "HTML content change" : "cursor movement";
      if (this.debug) console.log(`HtmlDecorator: Scheduling update due to ${reason}`);
      if (!this.updateScheduled) {
        this.updateScheduled = true;
        setTimeout(() => {
          this.updateDecorations();
          this.updateScheduled = false;
        }, 0);
      }
    }
  }
  /**
   * Update decorations using the measure/notify pattern
   */
  updateDecorations() {
    if (this.isDestroyed) return;
    try {
      if (this.debug) console.log("Updating HTML decorations");
      const decorations = buildHtmlDecorations(this.view);
      this.updateHtmlRegions();
      this.view.dispatch({
        effects: setHtmlDecorations.of(decorations)
      });
    } catch (error) {
      console.error("Error updating HTML decorations:", error);
    }
  }
  /**
   * Update the cached list of HTML regions
   */
  updateHtmlRegions() {
    try {
      const { state } = this.view;
      const doc = state.doc;
      const fullText = doc.toString();
      const regions = [];
      const htmlRegex = /<([a-zA-Z][a-zA-Z0-9\-_:]*)([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
      let match;
      while ((match = htmlRegex.exec(fullText)) !== null) {
        regions.push({
          from: match.index,
          to: match.index + match[0].length
        });
      }
      this.htmlRegions = regions;
    } catch (error) {
      console.error("Error updating HTML regions cache:", error);
    }
  }
  /**
   * Clean up resources when plugin is removed
   */
  destroy() {
    this.updateScheduled = false;
    this.isDestroyed = true;
    if (this.debug) console.log("HtmlDecorator plugin destroyed");
  }
};
var setHtmlDecorations = StateEffect.define();
var htmlDecorationsField = StateField.define({
  create: () => Decoration.none,
  update: (decorations, tr) => {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setHtmlDecorations)) {
        decorations = effect.value;
      }
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field)
});
function htmlDecorator() {
  return [
    htmlDecorationsField,
    ViewPlugin.define((view) => new HtmlDecoratorPlugin(view))
  ];
}
function createMarkdownPasteHandler() {
  return Prec.highest(EditorView.domEventHandlers({
    paste(event, view) {
      console.log("[MarkdownPasteHandler] Paste event triggered.");
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        console.log("[MarkdownPasteHandler] No clipboard data found.");
        return false;
      }
      let pastedText = clipboardData.getData("text/plain");
      console.log("[MarkdownPasteHandler] Original pastedText:", JSON.stringify(pastedText));
      if (!pastedText) {
        console.log("[MarkdownPasteHandler] No plain text in clipboard.");
        return false;
      }
      let textToConvert = pastedText.replace(/__([\s\S]+?)__/g, "**$1**");
      console.log("[MarkdownPasteHandler] After __ -> ** conversion:", JSON.stringify(textToConvert));
      const htmlOutput = marked.parseInline(textToConvert, { gfm: true });
      console.log("[MarkdownPasteHandler] Inline HTML output from marked:", JSON.stringify(htmlOutput));
      let convertedText = htmlOutput;
      convertedText = convertedText.replace(/\\<em>/g, "<em>");
      convertedText = convertedText.replace(/\\<\/em>/g, "</em>");
      convertedText = convertedText.replace(/\\<strong>/g, "<strong>");
      convertedText = convertedText.replace(/\\<\/strong>/g, "</strong>");
      convertedText = convertedText.replace(/<em><strong>([\s\S]+?)<\/strong><\/em>/g, "_**$1**_");
      convertedText = convertedText.replace(/<strong><em>([\s\S]+?)<\/em><\/strong>/g, "**_$1_**");
      convertedText = convertedText.replace(/<strong>([\s\S]+?)<\/strong>/g, "**$1**");
      convertedText = convertedText.replace(/<em>([\s\S]+?)<\/em>/g, "_$1_");
      const tempElement = document.createElement("textarea");
      tempElement.innerHTML = convertedText;
      convertedText = tempElement.value.trim();
      console.log("[MarkdownPasteHandler] Final convertedText after HTML to Markdown style:", JSON.stringify(convertedText));
      if (convertedText !== pastedText) {
        console.log("[MarkdownPasteHandler] Text was modified. Dispatching transaction.");
        view.dispatch(view.state.replaceSelection(convertedText));
        return true;
      }
      console.log("[MarkdownPasteHandler] Text was not modified by conversion. Allowing default paste.");
      return false;
    }
  }));
}
var markdownPasteHandler = createMarkdownPasteHandler();
function createLezerSafetyPlugin() {
  return ViewPlugin.define(() => {
    console.log("Initializing Lezer safety plugin");
    return {
      update(update) {
        try {
          const view = update.view;
          if (view && view.plugin && view.dispatch) {
            const viewPlugins = view._plugins || view.state.facet({ name: "plugins" });
            if (viewPlugins && Array.isArray(viewPlugins)) {
              viewPlugins.forEach((plugin) => {
                if (plugin && plugin.extension && plugin.extension.parser) {
                  const parser5 = plugin.extension.parser;
                  const originalHasChild = parser5.hasChild;
                  if (typeof originalHasChild === "function") {
                    parser5.hasChild = function safeHasChild(type, node, predicate) {
                      if (!node || !node.children) {
                        console.warn("SafeHasChild: node or node.children is undefined");
                        return false;
                      }
                      try {
                        return originalHasChild(type, node, predicate);
                      } catch (e) {
                        console.warn("SafeHasChild: caught error", e);
                        return false;
                      }
                    };
                    console.log("Successfully patched parser.hasChild");
                  }
                }
              });
            }
          }
        } catch (error) {
          console.warn("Error applying Lezer safety patches:", error);
        }
      }
    };
  });
}
function createNoMarkdownInHtmlExtension() {
  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    buildDecorations(view) {
      const builder = new RangeSetBuilder();
      for (const { from, to } of view.visibleRanges) {
        const tree = syntaxTree(view.state);
        tree.iterate({
          from,
          to,
          enter: (node) => {
            if (node.name.includes("HtmlBlock") || node.type.name.includes("HtmlTag") || node.type.name.includes("Element")) {
              builder.add(
                node.from,
                node.to,
                Decoration.mark({
                  class: "cm-no-markdown-formatting",
                  attributes: { "data-no-markdown": "true" }
                })
              );
            }
          }
        });
      }
      return builder.finish();
    }
  }, {
    decorations: (v) => v.decorations
  });
}
function toggleBold(selection, doc) {
  const changes = [];
  const newSelections = [];
  for (const range of selection.ranges) {
    if (range.empty) {
      const from = range.from;
      changes.push({ from, to: from, insert: "**Bold text**" });
      newSelections.push(EditorSelection.range(from + 2, from + 10));
      continue;
    }
    const text = doc.slice(range.from, range.to);
    const isBold = text.startsWith("**") && text.endsWith("**");
    if (isBold) {
      const innerText = text.slice(2, -2);
      changes.push({ from: range.from, to: range.to, insert: innerText });
      newSelections.push(EditorSelection.range(range.from, range.from + innerText.length));
    } else {
      changes.push({ from: range.from, to: range.to, insert: `**${text}**` });
      newSelections.push(EditorSelection.range(range.from, range.to + 4));
    }
  }
  return {
    changes,
    selection: EditorSelection.create(newSelections)
  };
}
function toggleItalic(selection, doc) {
  const changes = [];
  const newSelections = [];
  for (const range of selection.ranges) {
    if (range.empty) {
      const from = range.from;
      changes.push({ from, to: from, insert: "*Italic text*" });
      newSelections.push(EditorSelection.range(from + 1, from + 12));
      continue;
    }
    const text = doc.slice(range.from, range.to);
    const isItalic = text.startsWith("*") && text.endsWith("*") && !text.startsWith("**");
    if (isItalic) {
      const innerText = text.slice(1, -1);
      changes.push({ from: range.from, to: range.to, insert: innerText });
      newSelections.push(EditorSelection.range(range.from, range.from + innerText.length));
    } else {
      changes.push({ from: range.from, to: range.to, insert: `*${text}*` });
      newSelections.push(EditorSelection.range(range.from, range.to + 2));
    }
  }
  return {
    changes,
    selection: EditorSelection.create(newSelections)
  };
}
function toggleHeading(selection, doc, level) {
  level = Math.max(1, Math.min(6, level));
  const changes = [];
  const newSelections = [];
  const prefix = "#".repeat(level) + " ";
  for (const range of selection.ranges) {
    const line = getLineAt(doc, range.from);
    const hasHeading = line.text.trimStart().startsWith(prefix);
    if (hasHeading) {
      const headingStart = line.from + line.text.indexOf(prefix);
      changes.push({ from: headingStart, to: headingStart + prefix.length, insert: "" });
      newSelections.push(EditorSelection.range(range.from - prefix.length, range.to - prefix.length));
    } else {
      const existingHeadingMatch = line.text.trimStart().match(/^(#{1,6})\s/);
      if (existingHeadingMatch) {
        const existingPrefix = existingHeadingMatch[0];
        const headingStart = line.from + line.text.indexOf(existingPrefix);
        changes.push({ from: headingStart, to: headingStart + existingPrefix.length, insert: prefix });
        const diff = prefix.length - existingPrefix.length;
        newSelections.push(EditorSelection.range(range.from + diff, range.to + diff));
      } else {
        changes.push({ from: line.from, to: line.from, insert: prefix });
        newSelections.push(EditorSelection.range(range.from + prefix.length, range.to + prefix.length));
      }
    }
  }
  return {
    changes,
    selection: EditorSelection.create(newSelections)
  };
}
function getLineAt(doc, pos) {
  let lineStart = pos;
  let lineEnd = pos;
  while (lineStart > 0 && doc[lineStart - 1] !== "\n") {
    lineStart--;
  }
  while (lineEnd < doc.length && doc[lineEnd] !== "\n") {
    lineEnd++;
  }
  return {
    from: lineStart,
    to: lineEnd,
    text: doc.slice(lineStart, lineEnd)
  };
}

// src/app/obsidian-editor/utils/formatting/index.ts
function insertBold(view) {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  for (const range of state.selection.ranges) {
    if (range.empty) {
      changes.push({
        from: range.from,
        to: range.from,
        insert: "****"
      });
      selections.push(EditorSelection.cursor(range.from + 2));
    } else {
      const selectedText = state.doc.sliceString(range.from, range.to);
      const newText = `**${selectedText}**`;
      changes.push({
        from: range.from,
        to: range.to,
        insert: newText
      });
      selections.push(EditorSelection.range(range.from, range.from + newText.length));
    }
  }
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}
function insertItalic(view) {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  for (const range of state.selection.ranges) {
    if (range.empty) {
      changes.push({
        from: range.from,
        to: range.from,
        insert: "**"
      });
      selections.push(EditorSelection.cursor(range.from + 1));
    } else {
      const selectedText = state.doc.sliceString(range.from, range.to);
      const newText = `*${selectedText}*`;
      changes.push({
        from: range.from,
        to: range.to,
        insert: newText
      });
      selections.push(EditorSelection.range(range.from, range.from + newText.length));
    }
  }
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}
function insertCode(view) {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  for (const range of state.selection.ranges) {
    if (range.empty) {
      changes.push({
        from: range.from,
        to: range.from,
        insert: "``"
      });
      selections.push(EditorSelection.cursor(range.from + 1));
    } else {
      const selectedText = state.doc.sliceString(range.from, range.to);
      const newText = `\`${selectedText}\``;
      changes.push({
        from: range.from,
        to: range.to,
        insert: newText
      });
      selections.push(EditorSelection.range(range.from, range.from + newText.length));
    }
  }
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}
function insertHeading(view, level = 1) {
  const { state, dispatch } = view;
  const validLevel = Math.max(1, Math.min(6, level));
  const prefix = "#".repeat(validLevel) + " ";
  const changes = [];
  const selections = [];
  for (const range of state.selection.ranges) {
    const line = state.doc.lineAt(range.from);
    const lineContent = line.text;
    const existingHeadingMatch = lineContent.match(/^(#{1,6})\s/);
    if (existingHeadingMatch) {
      changes.push({
        from: line.from,
        to: line.from + existingHeadingMatch[0].length,
        insert: prefix
      });
    } else {
      changes.push({
        from: line.from,
        to: line.from,
        insert: prefix
      });
    }
    const contentOffset = range.from - line.from;
    const newPos = line.from + prefix.length + contentOffset;
    selections.push(EditorSelection.cursor(newPos));
  }
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}
function insertLink(view) {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  for (const range of state.selection.ranges) {
    if (range.empty) {
      changes.push({
        from: range.from,
        to: range.from,
        insert: "[](url)"
      });
      selections.push(EditorSelection.cursor(range.from + 1));
    } else {
      const selectedText = state.doc.sliceString(range.from, range.to);
      const newText = `[${selectedText}](url)`;
      changes.push({
        from: range.from,
        to: range.to,
        insert: newText
      });
      const urlPos = range.from + selectedText.length + 3;
      selections.push(EditorSelection.cursor(urlPos));
    }
  }
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}
function indentText(view) {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  const indentSize = 2;
  const indent = " ".repeat(indentSize);
  const processedLines = /* @__PURE__ */ new Set();
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from);
    const endLine = state.doc.lineAt(range.to);
    for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
      if (processedLines.has(lineNum)) continue;
      const line = state.doc.line(lineNum);
      processedLines.add(lineNum);
      changes.push({
        from: line.from,
        to: line.from,
        insert: indent
      });
    }
    const newFrom = range.from + indentSize;
    const newTo = range.to + (endLine.number - startLine.number + 1) * indentSize;
    selections.push(EditorSelection.range(newFrom, newTo));
  }
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}
function unindentText(view) {
  const { state, dispatch } = view;
  const changes = [];
  const selections = [];
  const indentSize = 2;
  const processedLines = /* @__PURE__ */ new Set();
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from);
    const endLine = state.doc.lineAt(range.to);
    let totalIndentRemoved = 0;
    for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
      if (processedLines.has(lineNum)) continue;
      const line = state.doc.line(lineNum);
      processedLines.add(lineNum);
      const lineContent = line.text;
      const leadingSpaces = lineContent.match(/^( +)/);
      if (leadingSpaces) {
        const spacesToRemove = Math.min(leadingSpaces[1].length, indentSize);
        changes.push({
          from: line.from,
          to: line.from + spacesToRemove,
          insert: ""
        });
        if (lineNum === startLine.number) {
          totalIndentRemoved += spacesToRemove;
        }
      }
    }
    const newFrom = Math.max(startLine.from, range.from - totalIndentRemoved);
    let newTo = range.to;
    for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
      const line = state.doc.line(lineNum);
      const lineContent = line.text;
      const leadingSpaces = lineContent.match(/^( +)/);
      if (leadingSpaces) {
        const spacesToRemove = Math.min(leadingSpaces[1].length, indentSize);
        newTo -= spacesToRemove;
      }
    }
    selections.push(EditorSelection.range(newFrom, Math.max(newFrom, newTo)));
  }
  dispatch({
    changes,
    selection: EditorSelection.create(selections)
  });
}
function handleBackspaceIndent(view) {
  const { state, dispatch } = view;
  const indentSize = 2;
  if (!state.selection.ranges.every((range) => range.empty)) {
    return false;
  }
  let handled = false;
  const changes = [];
  const selections = [];
  for (const range of state.selection.ranges) {
    const pos = range.from;
    const line = state.doc.lineAt(pos);
    if (pos > line.from) {
      const textBeforeCursor = line.text.substring(0, pos - line.from);
      if (/^\s+$/.test(textBeforeCursor)) {
        const spacesToRemove = Math.min(textBeforeCursor.length, indentSize);
        changes.push({
          from: pos - spacesToRemove,
          to: pos,
          insert: ""
        });
        selections.push(EditorSelection.cursor(pos - spacesToRemove));
        handled = true;
      }
    }
  }
  if (handled) {
    dispatch({
      changes,
      selection: EditorSelection.create(selections)
    });
    return true;
  }
  return false;
}
function handleEnterListBlockquote(view) {
  const { state, dispatch } = view;
  if (state.selection.ranges.length !== 1 || !state.selection.ranges[0].empty) {
    return false;
  }
  const pos = state.selection.main.from;
  const line = state.doc.lineAt(pos);
  const lineContent = line.text;
  const listMatch = lineContent.match(/^(\s*)([-*+]|\d+\.)\s/);
  const blockquoteMatch = lineContent.match(/^(\s*>\s+)/);
  if (listMatch || blockquoteMatch) {
    const prefix = listMatch ? listMatch[0] : blockquoteMatch[0];
    if (lineContent.trim() === prefix.trim()) {
      dispatch({
        changes: { from: line.from, to: line.to, insert: "" }
      });
      return true;
    } else if (pos === line.to) {
      dispatch({
        changes: { from: pos, to: pos, insert: "\n" + prefix },
        selection: { anchor: pos + 1 + prefix.length }
      });
      return true;
    }
  }
  return false;
}

// src/app/obsidian-editor/utils/editorExtensions.ts
var createCustomHighlightStyle = () => {
  try {
    if (typeof tags !== "object" || tags === null) {
      console.warn("Lezer highlight tags not available, using empty highlight style");
      return [];
    }
    const validStyles = [];
    if (tags.heading1) validStyles.push({ tag: [tags.heading1], fontSize: "1.6em", fontWeight: "bold" });
    if (tags.heading2) validStyles.push({ tag: [tags.heading2], fontSize: "1.4em", fontWeight: "bold" });
    if (tags.heading3) validStyles.push({ tag: [tags.heading3], fontSize: "1.2em", fontWeight: "bold" });
    if (tags.heading4) validStyles.push({ tag: [tags.heading4], fontSize: "1.1em", fontWeight: "bold" });
    if (tags.heading5) validStyles.push({ tag: [tags.heading5], fontSize: "1.1em", fontWeight: "bold", fontStyle: "italic" });
    if (tags.heading6) validStyles.push({ tag: [tags.heading6], fontSize: "1.1em", fontWeight: "bold", fontStyle: "italic" });
    if (tags.strong) validStyles.push({ tag: [tags.strong], fontWeight: "bold" });
    if (tags.emphasis) validStyles.push({ tag: [tags.emphasis], fontStyle: "italic" });
    if (tags.link) validStyles.push({ tag: [tags.link], color: "#2563eb", textDecoration: "underline" });
    if (tags.monospace) validStyles.push({ tag: [tags.monospace], fontFamily: "monospace", fontSize: "0.9em", color: "#10b981" });
    if (validStyles.length > 0) {
      return HighlightStyle.define(validStyles);
    } else {
      console.warn("No valid lezer highlight tags found, using empty highlight style");
      return [];
    }
  } catch (error) {
    console.error("Error creating custom highlight style:", error);
    return [];
  }
};
var createCustomEnterKeymap = () => {
  return Prec.highest(keymap.of([
    {
      key: "Enter",
      run: (view) => handleEnterListBlockquote(view)
    }
  ]));
};
var createMarkdownKeymaps = (onSaveRef) => {
  return keymap.of([
    {
      key: "Backspace",
      run: (view) => {
        return handleBackspaceIndent(view);
      }
    },
    ...defaultKeymap,
    ...historyKeymap,
    {
      key: "Tab",
      run: (view) => {
        indentText(view);
        return true;
      },
      shift: (view) => {
        unindentText(view);
        return true;
      }
    },
    {
      key: "Ctrl-b",
      run: (view) => {
        insertBold(view);
        return true;
      }
    },
    {
      key: "Ctrl-i",
      run: (view) => {
        insertItalic(view);
        return true;
      }
    },
    {
      key: "Ctrl-1",
      run: (view) => {
        insertHeading(view, 1);
        return true;
      }
    },
    {
      key: "Ctrl-2",
      run: (view) => {
        insertHeading(view, 2);
        return true;
      }
    },
    {
      key: "Ctrl-3",
      run: (view) => {
        insertHeading(view, 3);
        return true;
      }
    },
    {
      key: "Ctrl-`",
      run: (view) => {
        insertCode(view);
        return true;
      }
    },
    {
      key: "Ctrl-k",
      run: (view) => {
        insertLink(view);
        return true;
      }
    },
    {
      key: "Ctrl-s",
      run: () => {
        if (onSaveRef.current) onSaveRef.current();
        return true;
      }
    }
  ]);
};
var createEditorStyling = () => {
  return EditorView.theme({
    "&": {
      height: "100%"
    },
    ".cm-content": {
      padding: "1rem",
      fontFamily: "Menlo, Monaco, Courier New, monospace",
      fontSize: "16px",
      lineHeight: "1.6"
    }
  });
};
var createEditorExtensions = (options) => {
  const { editableCompartment, themeExtension} = options;
  const onSaveRef = {
    current: options.onSave || (() => {
    })
  };
  const safeExtensions = [
    themeExtension,
    history(),
    atomicIndents,
    createCustomEnterKeymap(),
    // Add our Lezer safety plugin with highest precedence to run first
    Prec.highest(createLezerSafetyPlugin()),
    // Use our custom markdown plugin instead of the basic markdown extension
    createMarkdownSyntaxPlugin(),
    // Add the markdown syntax hider for hiding syntax
    markdownSyntaxHider,
    // Add the extension to prevent markdown in HTML with high precedence
    Prec.high(createNoMarkdownInHtmlExtension()),
    htmlDecorator(),
    // Add HTML decorator extension for HTML rendering
    markdownPasteHandler,
    highlightActiveLine(),
    highlightActiveLineGutter(),
    EditorView.lineWrapping,
    createMarkdownKeymaps(onSaveRef),
    editableCompartment.of(EditorView.editable.of(true)),
    // Start as editable
    createEditorStyling()
  ];
  try {
    const highlightStyle = createCustomHighlightStyle();
    if (Array.isArray(highlightStyle)) {
      if (highlightStyle.length > 0) {
        safeExtensions.push(...highlightStyle);
      }
    } else {
      safeExtensions.push(syntaxHighlighting(highlightStyle));
    }
  } catch (error) {
    console.error("Error applying syntax highlighting:", error);
  }
  return safeExtensions;
};
var EditorCore = ({
  initialValue,
  readOnly,
  mode,
  onChange,
  onSave,
  onEditorViewCreated
}) => {
  const editorRef = useRef(null);
  const editorViewRef = useRef(null);
  const { theme, mounted } = useTheme();
  const [initializationError, setInitializationError] = useState(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const editableCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  const editorThemeName = getCurrentEditorTheme();
  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
  }, [onChange, onSave]);
  useEffect(() => {
    const handleWheel = (e) => {
      e.stopPropagation();
    };
    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener("wheel", handleWheel, { passive: true });
      return () => {
        editorElement.removeEventListener("wheel", handleWheel);
      };
    }
  }, []);
  const sanitizeInitialValue = (content) => {
    try {
      return content;
    } catch (e) {
      console.warn("Error sanitizing content:", e);
      return content;
    }
  };
  useEffect(() => {
    if (!mounted || !editorRef.current) return;
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
    }
    try {
      const safeInitialValue = sanitizeInitialValue(initialValue);
      const errorHandler = (error) => {
        if (error.message?.includes("CodeMirror") || error.message?.includes("Cannot read properties of undefined")) {
          console.warn("Caught editor initialization error:", error);
          setInitializationError(error.error);
        }
      };
      window.addEventListener("error", errorHandler);
      const themeExtension = getTheme(editorThemeName, theme === "dark" ? "dark" : "light");
      const changeListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          if (update.transactions.some((tr) => tr.isUserEvent("input") || tr.isUserEvent("delete"))) {
            const doc = update.state.doc;
            onChangeRef.current(doc.toString());
          }
        }
      });
      const errorHandlingExtension = EditorView.domEventHandlers({
        error: (event, view2) => {
          console.warn("DOM error event in editor:", event);
          return false;
        }
      });
      const extensions = [
        ...createEditorExtensions({
          markdown: safeInitialValue,
          editableCompartment,
          isDark: theme === "dark",
          themeExtension: themeCompartment.of(themeExtension),
          onSave: () => onSaveRef.current?.()
        }),
        changeListener,
        errorHandlingExtension
      ];
      const view = new EditorView({
        state: EditorState.create({
          doc: safeInitialValue,
          extensions
        }),
        parent: editorRef.current
      });
      editorViewRef.current = view;
      if (onEditorViewCreated) {
        onEditorViewCreated(view);
      }
      return () => {
        window.removeEventListener("error", errorHandler);
        view.destroy();
      };
    } catch (error) {
      console.error("Error initializing CodeMirror:", error);
      setInitializationError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [mounted]);
  useEffect(() => {
    if (editorViewRef.current && themeCompartment && mounted) {
      try {
        const themeExtension = getTheme(editorThemeName, theme === "dark" ? "dark" : "light");
        document.documentElement.setAttribute(
          "data-theme",
          `${editorThemeName}-${theme === "dark" ? "dark" : "light"}`
        );
        editorViewRef.current.dispatch({
          effects: themeCompartment.reconfigure(themeExtension)
        });
        console.log(`Applied editor theme: ${editorThemeName} in ${theme} mode`);
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    }
  }, [theme, themeCompartment, mounted, editorThemeName]);
  useEffect(() => {
    if (editorViewRef.current && mounted) {
      try {
        editorViewRef.current.dispatch({
          effects: [
            setMarkdownSyntaxMode.of(mode)
          ]
        });
        const isEditable = mode === "live" && !readOnly;
        editorViewRef.current.dispatch({
          effects: editableCompartment.reconfigure(EditorView.editable.of(isEditable))
        });
        const editorElement = editorViewRef.current.dom;
        if (editorElement) {
          editorElement.setAttribute("data-markdown-mode", mode);
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-markdown-mode", mode);
            if (mode === "preview") {
              document.documentElement.classList.add("markdown-preview-mode");
              document.documentElement.classList.remove("markdown-live-mode");
            } else {
              document.documentElement.classList.add("markdown-live-mode");
              document.documentElement.classList.remove("markdown-preview-mode");
            }
          }
        }
      } catch (error) {
        console.error("Error updating editor mode:", error);
      }
    }
  }, [mode, readOnly, editableCompartment, mounted]);
  useEffect(() => {
    if (editorViewRef.current && mounted) {
      try {
        const currentContent = editorViewRef.current.state.doc.toString();
        const safeInitialValue = sanitizeInitialValue(initialValue);
        if (currentContent !== safeInitialValue) {
          const prevSelection = editorViewRef.current.state.selection;
          const transaction = editorViewRef.current.state.update({
            changes: { from: 0, to: editorViewRef.current.state.doc.length, insert: safeInitialValue },
            selection: prevSelection
            // Keep cursor position
          });
          editorViewRef.current.dispatch(transaction);
        }
      } catch (error) {
        console.error("Error updating editor content:", error);
      }
    }
  }, [initialValue, mounted]);
  if (initializationError) {
    return /* @__PURE__ */ jsxs("div", { className: "obsidian-editor-error", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "Error initializing editor: ",
        initializationError.message
      ] }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          defaultValue: initialValue,
          onChange: (e) => onChangeRef.current?.(e.target.value),
          readOnly,
          className: "obsidian-editor-fallback"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsx("div", { ref: editorRef, className: "obsidian-editor-core" });
};
var EditorCore_default = EditorCore;
var ThemeSwitcher = ({ onThemeChange }) => {
  const [themeName, setThemeName] = useState("default");
  useEffect(() => {
    setThemeName(getCurrentEditorTheme());
  }, []);
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setThemeName(newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "theme-switcher", children: [
    /* @__PURE__ */ jsxs(
      "select",
      {
        value: themeName,
        onChange: handleThemeChange,
        className: "theme-select",
        "aria-label": "Select editor theme",
        children: [
          /* @__PURE__ */ jsx("option", { value: "default", children: "Default" }),
          /* @__PURE__ */ jsx("option", { value: "vanilla", children: "Vanilla" })
        ]
      }
    ),
    /* @__PURE__ */ jsx("style", { children: `
        .theme-switcher {
          position: relative;
        }
        
        .theme-select {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--hr-color, #dcddde);
          background: var(--background-primary, #ffffff);
          color: var(--text-normal, #2e3338);
          cursor: pointer;
          font-size: 14px;
        }
        
        .dark .theme-select {
          background: var(--background-primary, #2b2b2b);
          color: var(--text-normal, #dcddde);
          border-color: var(--hr-color, #444444);
        }
        ` })
  ] });
};
var ThemeSwitcher_default = ThemeSwitcher;
var EditorToolbar = ({
  editorView,
  mode,
  onModeChange,
  onThemeChange
}) => {
  const applyFormatting = (formatter) => {
    if (!editorView) return;
    const { state, dispatch } = editorView;
    const changes = formatter(state.selection, state.doc.toString());
    if (changes) {
      dispatch({
        changes: changes.changes,
        selection: changes.selection || state.selection,
        scrollIntoView: true
      });
      editorView.focus();
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "obsidian-editor-toolbar", children: [
    /* @__PURE__ */ jsxs("div", { className: "toolbar-left", children: [
      /* @__PURE__ */ jsxs("div", { className: "mode-toggle", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: `mode-button ${mode === "live" ? "active" : ""}`,
            onClick: () => onModeChange("live"),
            "aria-pressed": mode === "live",
            "aria-label": "Edit mode",
            title: "Edit mode",
            children: "Edit"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: `mode-button ${mode === "preview" ? "active" : ""}`,
            onClick: () => onModeChange("preview"),
            "aria-pressed": mode === "preview",
            "aria-label": "Preview mode",
            title: "Preview mode",
            children: "Preview"
          }
        )
      ] }),
      mode === "live" && /* @__PURE__ */ jsxs("div", { className: "format-buttons", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => applyFormatting(toggleBold),
            className: "format-button",
            "aria-label": "Bold",
            title: "Bold (Ctrl+B)",
            children: /* @__PURE__ */ jsx("strong", { children: "B" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => applyFormatting(toggleItalic),
            className: "format-button",
            "aria-label": "Italic",
            title: "Italic (Ctrl+I)",
            children: /* @__PURE__ */ jsx("em", { children: "I" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => applyFormatting((sel, doc) => toggleHeading(sel, doc, 1)),
            className: "format-button",
            "aria-label": "Heading 1",
            title: "Heading 1 (Ctrl+1)",
            children: "H1"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => applyFormatting((sel, doc) => toggleHeading(sel, doc, 2)),
            className: "format-button",
            "aria-label": "Heading 2",
            title: "Heading 2 (Ctrl+2)",
            children: "H2"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => applyFormatting((sel, doc) => toggleHeading(sel, doc, 3)),
            className: "format-button",
            "aria-label": "Heading 3",
            title: "Heading 3 (Ctrl+3)",
            children: "H3"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "toolbar-right", children: /* @__PURE__ */ jsx(ThemeSwitcher_default, { onThemeChange }) }),
    /* @__PURE__ */ jsx("style", { children: `
        .obsidian-editor-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: var(--background-secondary, #f8f8f8);
          border-bottom: 1px solid var(--hr-color, #dcddde);
        }
        
        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .mode-toggle {
          display: flex;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--hr-color, #dcddde);
        }
        
        .mode-button {
          padding: 4px 12px;
          border: none;
          background: var(--background-primary, #ffffff);
          color: var(--text-normal, #2e3338);
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .mode-button.active {
          background: var(--interactive-accent, #7b6cd9);
          color: white;
        }
        
        .format-buttons {
          display: flex;
          gap: 4px;
        }
        
        .format-button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--hr-color, #dcddde);
          border-radius: 4px;
          background: var(--background-primary, #ffffff);
          color: var(--text-normal, #2e3338);
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .format-button:hover {
          background: var(--interactive-hover, #e9e9e9);
        }
        
        .dark .mode-button {
          background: var(--background-primary, #2b2b2b);
          color: var(--text-normal, #dcddde);
        }
        
        .dark .format-button {
          background: var(--background-primary, #2b2b2b);
          color: var(--text-normal, #dcddde);
          border-color: var(--hr-color, #444444);
        }
        
        .dark .format-button:hover {
          background: var(--interactive-hover, #4a4a4a);
        }
        ` })
  ] });
};
var EditorToolbar_default = EditorToolbar;
var CodeMirrorEditor = ({
  initialValue = "",
  readOnly = false,
  onChange,
  onSave
}) => {
  const [editorView, setEditorView] = useState(null);
  const [currentMode, setCurrentMode] = useState("live");
  const { mounted } = useTheme();
  const handleEditorViewCreated = (view) => {
    setEditorView(view);
  };
  const handleModeChange = (mode) => {
    setCurrentMode(mode);
  };
  const handleThemeChange = (themeName) => {
    setEditorTheme(themeName);
  };
  return /* @__PURE__ */ jsx("div", { className: "obsidian-editor-container", children: mounted && /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      EditorToolbar_default,
      {
        editorView,
        mode: currentMode,
        onModeChange: handleModeChange,
        onThemeChange: handleThemeChange
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "obsidian-editor-content", children: /* @__PURE__ */ jsx(
      EditorCore_default,
      {
        initialValue,
        readOnly,
        mode: currentMode,
        onChange,
        onSave,
        onEditorViewCreated: handleEditorViewCreated
      }
    ) })
  ] }) });
};
var CodeMirrorEditor_default = CodeMirrorEditor;
function Editor(props) {
  return /* @__PURE__ */ jsx(CodeMirrorEditor_default, { ...props });
}
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: toggleTheme,
      className: "theme-toggle-button",
      "aria-label": `Switch to ${theme === "light" ? "dark" : "light"} theme`,
      children: [
        theme === "light" ? "\u{1F319}" : "\u2600\uFE0F",
        /* @__PURE__ */ jsx("style", { children: `
        .theme-toggle-button {
          padding: 8px 12px;
          border-radius: 4px;
          background: var(--background-secondary, #f5f5f5);
          border: 1px solid var(--border-color, #e2e2e2);
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          transition: background-color 0.2s ease;
        }
        
        .theme-toggle-button:hover {
          background: var(--background-modifier-hover, #e9e9e9);
        }
        
        .dark .theme-toggle-button {
          background: var(--background-secondary, #2d333b);
          border-color: var(--border-color, #444c56);
        }
        
        .dark .theme-toggle-button:hover {
          background: var(--background-modifier-hover, #444c56);
        }
        ` })
      ]
    }
  );
}

export { CodeMirrorEditor_default as CodeMirrorEditor, Editor, EditorCore_default as EditorCore, EditorToolbar_default as EditorToolbar, ThemeProvider, ThemeSwitcher_default as ThemeSwitcher, ThemeToggle, useTheme };
//# sourceMappingURL=client.mjs.map
//# sourceMappingURL=client.mjs.map