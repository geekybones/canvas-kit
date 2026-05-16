# Interaction

Manages element selection, drag movement, resize, rotation, copy/paste, and the bounding box overlay UI.

## Enable

Interaction is **on by default**.

```ts
extensions: {
  interaction: {
    theme: {
      boundingBox: {
        lineColor: '#000918',     // bounding box border color
        lineThickness: 1.5,       // border thickness
        lineType: 'solid',        // 'solid' | 'dotted'
        padding: 4,               // extra padding around the selection
      },
      handle: {
        size: 18,                 // handle square size
        color: '#000918',         // handle fill color
      },
      marquee: {
        fillColor: 0x4285f4,      // selection rectangle fill color
        fillAlpha: 0.1,           // fill opacity
        strokeColor: 0x4285f4,    // selection rectangle border color
        strokeWidth: 1,           // border width
        strokeAlpha: 0.8,         // border opacity
      },
    },
    controls: {
      // Override or add handles at specific positions
      // Positions: 'topLeft' | 'topCenter' | 'topRight' | 'middleLeft' | 'middleRight'
      //            | 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'rotateLeft' | 'rotateRight'
      //            | 'delete' | 'duplicate'
      topLeft: {
        icon: '↩',
        handler: 'rotate',
      },
    },
  },
}
```

Pass `interaction: false` to disable.

## Accessor API

```ts
// Select one element
canvas.interaction.select('headline');

// Select multiple elements
canvas.interaction.select(['headline', 'card']);

// Clear selection
canvas.interaction.select(null);

// Read current selection
canvas.interaction.getSelectedIds();      // string[]
canvas.interaction.getSelectedOptions();  // BaseOptions[]

// Programmatically duplicate the current selection
await canvas.interaction.duplicate();
```

`getSelectedOptions()` returns a snapshot of the options for each currently selected element in selection order.

## What it handles automatically

| Gesture / shortcut | Action |
|---|---|
| Click element | Select that element |
| Click canvas background | Clear selection |
| Drag canvas background | Marquee selection — draws a rectangle and selects all intersecting elements on release |
| Drag element | Move (recorded as `'move'` in history) |
| Drag resize handle | Resize (recorded as `'resize'`) |
| Drag rotate handle | Rotate (recorded as `'rotate'`) |
| `Delete` / `Backspace` | Delete selection (recorded as `'remove'`) |
| `Ctrl+C` | Copy selection to clipboard |
| `Ctrl+V` | Paste from clipboard with +10px offset (recorded as `'add'`) |
| `Ctrl+D` | Duplicate selection (recorded as `'add'`) |

## Theme configuration

### `theme.boundingBox`

| Field | Type | Description |
|---|---|---|
| `lineColor` | `number \| string?` | Border color |
| `lineThickness` | `number?` | Border width |
| `lineType` | `'solid' \| 'dotted'?` | Border style |
| `padding` | `number?` | Extra space around the selection bounds |

### `theme.handle`

| Field | Type | Description |
|---|---|---|
| `size` | `number?` | Handle square size in pixels |
| `color` | `number \| string?` | Handle fill color |

### `theme.marquee`

| Field | Type | Default | Description |
|---|---|---|---|
| `fillColor` | `number \| string?` | `0x4285f4` | Selection rectangle fill color |
| `fillAlpha` | `number?` | `0.1` | Fill opacity (0–1) |
| `strokeColor` | `number \| string?` | `0x4285f4` | Selection rectangle border color |
| `strokeWidth` | `number?` | `1` | Border width in pixels |
| `strokeAlpha` | `number?` | `0.8` | Border opacity (0–1) |

## Custom handles (`controls`)

The `controls` map lets you override the icon, handler, or size for any handle position, or register a completely custom action.

```ts
controls: {
  topRight: {
    icon: '⭐',
    handler: ({ selectedIds }) => {
      // custom callback receives the current selectedIds
      console.log('star clicked for', selectedIds);
    },
    size: 24,
  },
}
```

Built-in `handler` values:

| Handler | Behaviour |
|---|---|
| `'transform'` | Resize handle |
| `'rotate'` | Rotate handle |
| `'delete'` | Delete selected elements |
| `'duplicate'` | Duplicate selected elements |
| `(ctx) => void` | Custom callback; receives `{ selectedIds }` |

## Canvas-constraint interaction

When `constrainToCanvas: true` is set on CanvasKit, elements moved or resized via interaction are clamped to the canvas bounds after the gesture.

## Integration with other extensions

- **History** — move, resize, rotate, delete, duplicate, paste are all recorded when the history extension is enabled.
- **Camera** — panning (`Space + drag`) blocks interaction gestures while active. The `isPanBlocked()` state is checked before allowing element interaction.
- **Snap** — drag and resize gestures call `snap.resolve()` and `snap.showLines()` / `snap.hideLines()` when the snap extension is enabled.
- **Export** — interaction overlays are hidden during `canvas.export.render(...)` and restored afterward.
- **Context menu** — `contextMenu.open(id)` retargets the selection to the right-clicked element before calling the configured handler.
