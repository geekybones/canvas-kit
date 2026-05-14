# Grid

Renders a tiled background grid that automatically tracks the camera when the camera extension is enabled.

## Enable

Grid is **opt-in**.

```ts
extensions: {
  grid: {
    cellSize: 20,       // minor cell size in pixels (default: 20)
    majorInterval: 5,   // draw a major line every N minor lines (default: 5)
    visible: true,      // initial visibility (default: true)
  },
}
```

### `GridConfig`

| Option | Type | Default | Description |
|---|---|---|---|
| `cellSize` | `number?` | `20` | Minor grid cell size in pixels |
| `majorInterval` | `number?` | `5` | Number of minor cells per major cell |
| `visible` | `boolean?` | `true` | Whether the grid is initially visible |
| `minorLineColor` | `number?` | — | Color for minor grid lines |
| `minorLineAlpha` | `number?` | — | Opacity for minor grid lines |
| `majorLineColor` | `number?` | — | Color for major grid lines |
| `majorLineAlpha` | `number?` | — | Opacity for major grid lines |

## Accessor API

```ts
// Toggle visibility
canvas.grid.setVisible(true);
canvas.grid.setVisible(false);
canvas.grid.isVisible();          // boolean

// Read current state
const state = canvas.grid.getState();
// { cellSize: number, majorInterval: number, visible: boolean }

// Change sizing at runtime
canvas.grid.setCellSize(24);
canvas.grid.setMajorInterval(4);
```

### `GridState`

```ts
type GridState = {
  cellSize: number;
  majorInterval: number;
  visible: boolean;
};
```

## Behaviour

- The grid renders as a tiled sprite at `zIndex: 0`, behind all elements.
- When the `camera` extension is enabled, the grid tile position and scale update automatically on every `camera:changed` event to maintain visual continuity while panning and zooming.
- The grid does not participate in snapping directly. Pair it with `snap: { grid: true }` to snap to grid lines.

## Toggle grid from a button

```ts
const toggle = document.getElementById('toggle-grid')!;
toggle.addEventListener('click', () => {
  const visible = !canvas.grid.isVisible();
  canvas.grid.setVisible(visible);
});
```

## Snap integration

The snap extension reads the grid's `cellSize` when computing grid snap targets. If you change `cellSize` at runtime, snap adjusts automatically:

```ts
canvas.grid.setCellSize(40);
// snap.resolve() will now snap to 40px intervals
```
