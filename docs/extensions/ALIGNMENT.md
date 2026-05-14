# Alignment

Aligns selected elements relative to each other or the canvas.

## Enable

Alignment is **on by default**.

```ts
extensions: { alignment: true }
// or disable:
extensions: { alignment: false }
```

## Accessor API

```ts
// Align using the current selection
await canvas.alignment.align('left');
await canvas.alignment.align('center');
await canvas.alignment.align('right');
await canvas.alignment.align('top');
await canvas.alignment.align('middle');
await canvas.alignment.align('bottom');

// Align specific elements regardless of current selection
await canvas.alignment.align('top', ['title', 'card', 'photo']);
```

### `AlignmentMode`

| Mode | Aligns to |
|---|---|
| `'left'` | Left edge |
| `'center'` | Horizontal center |
| `'right'` | Right edge |
| `'top'` | Top edge |
| `'middle'` | Vertical center |
| `'bottom'` | Bottom edge |

## Reference area

| Selection size | Reference |
|---|---|
| Single element | Canvas bounds (screen width × height) |
| Multiple elements | Combined bounding box of the selected elements |

## History integration

When the history extension is enabled and `'align'` is in the tracked kinds (the default), each `align()` call is recorded as a single undoable step, even when it moves many elements.

Alignment is a no-op if no positions change — in that case nothing is recorded in history.

## Examples

```ts
// Center everything vertically on the canvas
canvas.interaction.select(['title', 'card', 'photo']);
await canvas.alignment.align('middle');

// Align two elements to each other's left edge (without changing the selection)
await canvas.alignment.align('left', ['id-a', 'id-b']);
```
