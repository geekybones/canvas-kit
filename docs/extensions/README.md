# Extensions

Extensions add capabilities to CanvasKit. They are loaded during `CanvasKit` initialisation and expose a typed accessor namespace on the CanvasKit instance after `await canvas.ready`.

## On by default

These extensions are active unless you pass `false`:

| Extension | Accessor | Purpose |
|---|---|---|
| `alignment` | `canvas.alignment` | Align elements to each other or the canvas |
| `history` | `canvas.history` | Undo / redo with configurable tracking |
| `interaction` | `canvas.interaction` | Selection, drag, resize, rotate, copy/paste |
| `layering` | `canvas.layer` | Z-index management |
| `serialization` | `canvas.serializer` | Scene serialization to/from JSON |
| `export` | `canvas.export` | Render to PNG or base64 |
| `fonts` | `canvas.fonts` | Load web fonts via FontFace API |
| `performance` | `canvas.performance` | Dirty tracking and asset cache |
| `contextMenu` | `canvas.contextMenu` | Right-click context menus |

## Opt-in

These extensions are disabled by default and must be explicitly enabled:

| Extension | Accessor | Purpose |
|---|---|---|
| `camera` | `canvas.camera` | Pan, zoom, coordinate mapping |
| `grid` | `canvas.grid` | Tiled background grid |
| `snap` | `canvas.snap` | Grid / object / guide snapping |

## Configure an extension

```ts
const canvas = new CanvasKit(container, {
  extensions: {
    // Default extension — disable it
    fonts: false,

    // Default extension — enable with options
    history: {
      max: 50,
      track: ['move', 'resize', 'rotate', 'add', 'remove'],
    },

    // Opt-in extension — enable with defaults
    camera: true,

    // Opt-in extension — enable with options
    snap: {
      grid: true,
      objects: true,
      edges: true,
      threshold: 8,
    },
  },
});
```

## Access pattern

Always use accessor namespaces:

```ts
await canvas.history.undo();
const scene = canvas.serializer.serialize();
canvas.interaction.select(['id-1', 'id-2']);
```

Reach directly into the manager only for methods not surfaced on an accessor:

```ts
const manager = canvas.getExtension<SomeManager>('someName');
```

## Extension pages

- [Alignment](./alignment.md)
- [Camera](./camera.md)
- [Context menu](./context-menu.md)
- [Export](./export.md)
- [Fonts](./fonts.md)
- [Grid](./grid.md)
- [History](./history.md)
- [Interaction](./interaction.md)
- [Layering](./layering.md)
- [Performance](./performance.md)
- [Serialization](./serialization.md)
- [Snap](./snap.md)
