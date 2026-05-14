import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: __dirname,
  base: process.env.GITHUB_ACTIONS ? '/canvas-kit/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    minify: true,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/react') ||
            id.includes('/node_modules/react-dom') ||
            id.includes('/node_modules/scheduler')
          ) {
            return 'vendor-react';
          }
          if (id.includes('/node_modules/pixi.js') || id.includes('/node_modules/@pixi/')) {
            return 'vendor-pixi';
          }
          if (id.includes('@geekybones/canvas-kit')) {
            return 'vendor-canvas-kit';
          }
        },
      },
    },
  },
}));
