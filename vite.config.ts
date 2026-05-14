import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CanvasKit',
      formats: ['es'],
      fileName: () => 'canvas-kit.js',
    },
    rollupOptions: {
      external: ['pixi.js'],
    },
    sourcemap: true,
    minify: true,
  },
  plugins: [
    dts({
      include: ['src'],
      outDir: 'dist',
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
});
