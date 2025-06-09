import { pluginRegistry } from './PluginRegistry';
import { createExamplePlugin } from './ExamplePlugin';
import { createWordCountPlugin } from './WordCountPlugin';

// Register all plugins with the registry
pluginRegistry.registerPluginFactory('example-plugin', createExamplePlugin);
pluginRegistry.registerPluginFactory('word-count', createWordCountPlugin);

// Add more plugins here as needed

// Export everything
export * from './PluginRegistry';
export * from './ExamplePlugin';
export * from './WordCountPlugin'; 