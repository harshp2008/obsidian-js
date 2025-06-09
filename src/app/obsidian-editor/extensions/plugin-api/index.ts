// Core API
export { obsidianPluginAPI } from './ObsidianPluginAPI';
export { pluginManager } from './PluginManager';
export { Plugin } from './Plugin';
export type { PluginManifest } from './Plugin';

// Extension utilities
export * from './ExtensionPoints';

// Example plugins
export { ExamplePlugin, createExamplePlugin } from './ExamplePlugin';
export * from './examples';

// Plugin setup utility
export { setupExamplePlugins } from './setupPlugins';

// Types
export type { Extension } from '@codemirror/state';
export type { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';

// Export HTML decorator to use the fixed version
export { htmlDecorator } from '../markdown-syntax/html-decorator'; 