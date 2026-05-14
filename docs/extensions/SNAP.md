# Snap

Provides snap-to-grid, snap-to-object-center, snap-to-edge, and snap-to-guide, with visual indicator lines. The interaction extension uses snap automatically during drag and resize when snap is enabled.

## Enable

Snap is **opt-in**.

```ts
extensions: {
  snap: {
    grid: true,          // snap to grid lines (default: true)
    objects: true,       // snap to other element centers (default: true)
    edges: true,         // snap to other element edges (default: true)
    guides: true,        // snap to named guides (default: true)
    threshold: 8,        // snap distance in pixels (default: 8)
    lineColor: 0x1a73e8, // snap indicator line color (default: 0x1a73e8)
    lineAlpha: 0.75,     // snap indicator line opacity (default: 0.75)
    lineWidth: 1,        // snap indicator line width (default: 1)
  },
}
```

### `SnapConfig`

| Option | Type | Default | Description |
|---|---|---|---|
| `grid` | `boolean?` | `true` | Enable grid snapping |
| `objects` | `boolean?` | `true` | Enable center snap to other elements |
| `edges` | `boolean?` | `true` | Enable edge snap to other elements |
| `guides` | `boolean?` | `true` | Enable snap to named guides |
| `threshold` | `number?` | `8` | Max distance in pixels for a snap to activate |
| `lineColor` | `number \| string?` | `0x1a73e8` | Snap line color |
| `lineAlpha` | `number?` | `0.75` | Snap line opacity |
| `lineWidth` | `number?` | `1` | Snap line width |

## Accessor API

### Resolve snapped coordinates

```ts
const result = canvas.snap.resolve(x, y, {
  width: 100,           // element width — used for center/edge targets
  height: 60,           // element height
  exclude: ['id-1'],    // ignore these elements as snap targets
});
```

`resolve` returns a `SnapResult`:

| Field | Type | Description |
|---|---|---|
| `x` | `number` | Snapped X coordinate |
| `y` | `number` | Snapped Y coordinate |
| `snapped` | `boolean` | Whether any snap occurred |
| `xSnapped` | `boolean` | Whether the X axis snapped |
| `ySnapped` | `boolean` | Whether the Y axis snapped |
| `lineX` | `number?` | X position for the vertical indicator line |
| `lineY` | `number?` | Y position for the horizontal indicator line |
| `xTarget` | `SnapTarget?` | What the X axis snapped to |
| `yTarget` | `SnapTarget?` | What the Y axis snapped to |

### `SnapTarget`

```ts
type SnapTarget = {
  type: 'grid' | 'object' | 'edge' | 'guide';
  reference?: string;   // element id or guide id when relevant
}
```

### Show and hide indicator lines

```ts
canvas.snap.showLines(result);  // draw lines for the given snap result
canvas.snap.hideLines();        // hide all snap lines
```

### Manage guides

Guides are named axis-aligned lines that act as additional snap targets.

```ts
canvas.snap.addGuide({
  id: 'center-vertical',
  orientation: 'vertical',
  position: 600,          // world-space position
});

canvas.snap.addGuide({
  id: 'center-horizontal',
  orientation: 'horizontal',
  position: 400,
});

canvas.snap.removeGuide('center-vertical');
canvas.snap.clearGuides();
```

### Runtime configuration

```ts
canvas.snap.configure({
  threshold: 12,
  grid: false,             // disable grid snap at runtime
  lineColor: 0xff6b6b,
  lineAlpha: 0.9,
  lineWidth: 2,
});
```

### Read current state

```ts
const state = canvas.snap.getState();
// {
//   config: { grid, objects, edges, guides, threshold, lineColor, lineAlpha, lineWidth },
//   guides: [ { id, orientation, position }, ... ]
// }
```

`getState()` returns a deep copy — mutations to the result do not affect the manager.

## Snap priority

When multiple targets are within the threshold simultaneously, the snap resolver uses this priority order:

1. **Guides** (highest priority)
2. **Object centers and edges**
3. **Grid** (lowest priority)

X and Y axes are resolved independently, so you can snap X to a guide while Y snaps to a grid line in the same gesture.

## Grid cell size

When the `grid` extension is also enabled, the snap grid uses that extension's `cellSize`. When the grid extension is absent, snap falls back to a default cell size of 20px.

## Using snap in custom drag handlers

```ts
canvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;

  const worldPos = canvas.camera.screenToWorld(e.clientX, e.clientY);
  const snapped = canvas.snap.resolve(worldPos.x - offsetX, worldPos.y - offsetY, {
    width: element.width,
    height: element.height,
    exclude: [draggingId],
  });

  await canvas.update(draggingId, { x: snapped.x, y: snapped.y });

  if (snapped.snapped) {
    canvas.snap.showLines(snapped);
  } else {
    canvas.snap.hideLines();
  }
});

canvas.addEventListener('mouseup', () => {
  dragging = false;
  canvas.snap.hideLines();
});
```
