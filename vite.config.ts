import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const repoRoot = __dirname;
const srcRoot = resolve(repoRoot, 'src');

/** Paths excluded from declaration emit and from Rollup's module graph. */
const buildTestExclude = ['src/**/__tests__/**', 'src/**/*.test.ts', 'src/**/*.spec.ts'];

function manualChunks(id: string): string | undefined {
  const normalized = id.replace(/\\/g, '/');

  // Vendor splits first — stable caching and smaller main entry.
  if (normalized.includes('/node_modules/opentype.js/')) {
    return 'vendor-opentype';
  }
  if (normalized.includes('/node_modules/earcut/')) {
    return 'vendor-earcut';
  }

  return undefined;
}

export default defineConfig({
  resolve: {
    alias: {
      '@': srcRoot,
    },
  },
  build: {
    lib: {
      entry: resolve(srcRoot, 'index.ts'),
      name: 'CanvasKit',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['pixi.js'],
      output: {
        entryFileNames: 'canvas-kit.js',
        chunkFileNames: 'chunks/[name].js',
        manualChunks,
      },
    },
    sourcemap: true,
    minify: true,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: buildTestExclude,
      outDirs: 'dist',
      insertTypesEntry: true,
    }),
  ],
});
