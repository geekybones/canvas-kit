# Layering

Manages the z-order of elements on the canvas using `zIndex`.

## Enable

Layering is **on by default**.

```ts
extensions: { layering: true }
// or disable:
extensions: { layering: false }
```

## Accessor API

```ts
// Move a single element
canvas.layer.bringToFront('id');
canvas.layer.sendToBack('id');
canvas.layer.bringForward('id');    // swap with next element up
canvas.layer.sendBackward('id');    // swap with next element down

// Move a group of elements (preserves relative order within the group)
canvas.layer.bringToFront(['id-1', 'id-2', 'id-3']);
canvas.layer.sendToBack(['id-1', 'id-2']);

// Compact all z-index values to consecutive integers (1..n) while preserving visual order
canvas.layer.normalizeZIndex();
```

`bringForward` and `sendBackward` accept only a single id. `bringToFront` and `sendToBack` accept a single id or an array.

## Auto-assignment

- Elements added without an explicit `zIndex` are placed above all existing elements.
- Elements added with an explicit `zIndex` keep that value as-is.

## History integration

`zOrder` changes are tracked by history (when `'zOrder'` is in the tracked kinds, which it is by default). Each layering call is one undoable step.

## Events

```ts
canvas.on('layer:changed', () => {
  // Refresh your layers panel
  renderLayerList();
});
```

## Batch reorder example

```ts
// Select all, then bring selection to front as a group
const selected = canvas.interaction.getSelectedIds();
canvas.layer.bringToFront(selected);
```

Batch moves preserve the relative z-order of the moved elements — the group is lifted as a unit without changing the order within it.
