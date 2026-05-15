import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig, normalizePath } from 'vite';

const repoRoot = resolve(__dirname, '..');
const libSrc = normalizePath(resolve(repoRoot, 'src'));
const playgroundSrc = resolve(__dirname, 'src');

const workspaceAtAlias: Plugin = {
  name: 'workspace-at-alias',
  enforce: 'pre',
  async resolveId(id, importer) {
    if (!id.startsWith('@/')) return;
    const root = importer && normalizePath(importer).includes(libSrc) ? libSrc : playgroundSrc;
    return this.resolve(`${root}/${id.slice(2)}`, importer, { skipSelf: true });
  },
};

export default defineConfig(({ command }) => {
  const dev = command === 'serve';
  const alias: Record<string, string> = dev
    ? { '@geekybones/canvas-kit': resolve(repoRoot, 'src/index.ts') }
    : { '@': playgroundSrc };

  return {
    root: __dirname,
    base: process.env.GITHUB_ACTIONS ? '/canvas-kit/' : '/',
    plugins: [react(), ...(dev ? [workspaceAtAlias] : [])],
    resolve: { alias },
    server: dev ? { fs: { allow: [repoRoot] } } : undefined,
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
  };
});
