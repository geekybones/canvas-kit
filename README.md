# CanvasKit by <a href="https://geekybones.com" target="_blank" rel="noopener noreferrer">GeekyBones</a>

CanvasKit is a modular, extensible canvas runtime built on [PixiJS v8](https://pixijs.com). Compose only the features you need — elements, history, camera, snap, serialization, and more — through a clean extension system.

## Features

| Feature | Description |
|---|---|
| **Elements** | Rectangle, Circle, Star, Line, Text (raster + vector mesh effects), Image, SVG |
| **History** | Configurable undo/redo with per-operation kind tracking |
| **Interaction** | Selection, multi-select, drag, resize, rotate, copy/paste, keyboard shortcuts, custom handles |
| **Camera** | Pan, zoom (wheel, pinch, keyboard), world↔screen coordinate mapping |
| **Snap** | Grid, object-center, edge, and guide snapping with visual indicator lines |
| **Grid** | Tiled background grid that tracks the camera |
| **Alignment** | 6-mode alignment for single or multi-element selections |
| **Layering** | Z-index management — bring to front/back, step forward/backward, batch reorder |
| **Serialization** | Serialize the full scene to plain JSON, restore it, register custom type adapters |
| **Export** | Render to PNG `Blob` or base64 data URL at standard / HD / ultra resolution |
| **Fonts** | Load custom web fonts via the `FontFace` API |
| **Context menu** | Built-in right-click menu with a full custom handler override |
| **Performance** | Dirty-tracking per element and asset cache ref-counting |

## Installation

```bash
npm install @geekybones/canvas-kit pixi.js
# or
pnpm add @geekybones/canvas-kit pixi.js
# or
yarn add @geekybones/canvas-kit pixi.js
```

## Quick start

```ts
import { CanvasKit, Shape, Text } from '@geekybones/canvas-kit';

const canvas = new CanvasKit(document.getElementById('canvas-container')!, {
  width: 1200,
  height: 800,
  backgroundColor: '#f4f5f7',
  extensions: {
    history: true,
    interaction: true,
    layering: true,
    serialization: true,
    export: true,
  },
});

await canvas.ready;

await canvas.add(Text.create({
  id: 'headline',
  type: 'text',
  text: 'Hello CanvasKit',
  x: 160,
  y: 120,
  fontSize: 56,
  fontWeight: '700',
  fill: '#0f172a',
}));

await canvas.add(Shape.create(Shape.Rectangle, {
  id: 'card',
  type: 'shape:rectangle',
  x: 140,
  y: 220,
  width: 320,
  height: 180,
  fill: '#ffffff',
  stroke: '#dbe4ff',
  strokeWidth: 2,
  borderRadius: 24,
}));

// Undo the last action
await canvas.history.undo();

// Serialize and restore
const scene = canvas.serializer.serialize();
await canvas.serializer.replace(scene);

// Export
const png = await canvas.export.render('png');
```

## Documentation

- [Getting started](https://github.com/geekybones/canvas-kit/blob/main/docs/GETTING-STARTED.md)
- [CanvasKit API](https://github.com/geekybones/canvas-kit/blob/main/docs/usage/CANVAS-KIT.md)
- [Elements](https://github.com/geekybones/canvas-kit/blob/main/docs/usage/ELEMENTS.md)
- [Serialization & Export](https://github.com/geekybones/canvas-kit/blob/main/docs/usage/SERIALIZATION-AND-EXPORT.md)
- [Extensions](https://github.com/geekybones/canvas-kit/blob/main/docs/extensions/README.md)

## Playground

The `playground/` directory is a full React app demonstrating every feature.

```bash
cd playground
npm install
npm run dev
```

---

Built with the help of [Claude Code](https://claude.ai/code).
