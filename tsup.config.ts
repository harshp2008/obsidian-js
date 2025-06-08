import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts', 'src/client.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react', 'react-dom'],
  sourcemap: true,
  clean: true,
  treeshake: true,
  tsconfig: 'tsconfig.build.json',
  outDir: 'dist',
  splitting: false,
  esbuildOptions(options) {
    options.banner = {
      js: "'use client';"
    };
  },
}); 