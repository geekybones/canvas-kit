# Getting started

## Installation

```bash
npm install @geekybones/canvas-kit
# or
pnpm add @geekybones/canvas-kit
# or
yarn add @geekybones/canvas-kit
```

## Create a CanvasKit

```ts
import { CanvasKit } from '@geekybones/canvas-kit';

const container = document.getElementById('canvas-container')!;

const canvas = new CanvasKit(container, {
  width: 1200,
  height: 800,
  backgroundColor: '#f4f5f7',
});

// Always await ready before adding elements or calling accessors
await canvas.ready;
```

`canvas.ready` is a `Promise<void>` that resolves once PixiJS has initialised and all extensions are loaded. All accessor namespaces (`canvas.history`, `canvas.serializer`, etc.) are safe to use after this point.

## Add elements

```ts
import { CanvasKit, Text, Shape, Image } from '@geekybones/canvas-kit';

// Text
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

// Rectangle
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

// Image
await canvas.add(Image.create({
  id: 'photo',
  type: 'image',
  src: '/photo.jpg',
  x: 520,
  y: 200,
  width: 280,
  height: 280,
}));
```

## Configure extensions

All extensions except `camera`, `grid`, and `snap` are on by default. Pass `false` to disable, `true` to use defaults, or a config object to customise.

```ts
const canvas = new CanvasKit(container, {
  width: 1200,
  height: 800,
  backgroundColor: '#f4f5f7',
  constrainToCanvas: true,   // prevent dragging elements outside the canvas
  extensions: {
    history: {
      max: 50,               // keep up to 50 undo steps (default: 100)
      track: ['move', 'resize', 'rotate', 'add', 'remove'],
    },
    interaction: {
      theme: {
        boundingBox: { lineColor: '#000918', lineThickness: 1.5 },
        handle: { size: 18, color: '#000918' },
      },
    },
    serialization: true,
    export: true,
    camera: {
      minZoom: 0.25,
      maxZoom: 4,
      wheelZoom: true,
    },
    grid: {
      cellSize: 20,
      majorInterval: 5,
      visible: true,
    },
    snap: {
      grid: true,
      objects: true,
      edges: true,
      guides: true,
      threshold: 8,
    },
    // disable an extension entirely
    fonts: false,
  },
});
```

## Listen for events

```ts
canvas.on('element:added', (id) => console.log('added', id));
canvas.on('element:updated', (id) => console.log('updated', id));
canvas.on('element:removed', (id) => console.log('removed', id));
canvas.on('element:selected', (ids) => console.log('selected', ids));
canvas.on('history:changed', () => {
  const canUndo = canvas.history.canUndo();
  const canRedo = canvas.history.canRedo();
});
canvas.on('camera:changed', ({ zoom, x, y }) => {
  console.log('camera', zoom, x, y);
});
canvas.on('layer:changed', () => console.log('layers reordered'));
```

## Typical workflow example

```ts
import { CanvasKit, Shape } from '@geekybones/canvas-kit';

const canvas = new CanvasKit(document.getElementById('canvas')!, {
  extensions: { history: true, interaction: true, serialization: true, export: true },
});

await canvas.ready;

// Add
await canvas.add(Shape.create(Shape.Circle, {
  id: 'c1', type: 'shape:circle', radius: 60, fill: 0x4f86f7,
}));

// Update
await canvas.update('c1', { fill: 0xff6b6b });

// Select
canvas.interaction.select('c1');

// Undo / redo
await canvas.history.undo();
await canvas.history.redo();

// Save
const scene = canvas.serializer.serialize();
localStorage.setItem('scene', JSON.stringify(scene));

// Restore
const saved = JSON.parse(localStorage.getItem('scene') ?? '[]');
await canvas.serializer.replace(saved);

// Export
const png = await canvas.export.render('png');
const link = document.createElement('a');
link.href = URL.createObjectURL(png as Blob);
link.download = 'canvas.png';
link.click();

// Destroy
canvas.destroy();
```

## Next

- [CanvasKit API](./usage/CANVAS-KIT.md) — full reference for all methods, events, and accessors
- [Elements](./usage/ELEMENTS.md) — all element types and their option tables
- [Extensions](./extensions/README.md) — per-extension configuration and API
