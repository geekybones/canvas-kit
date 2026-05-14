# Camera

Provides pan, zoom, and world↔screen coordinate mapping. All elements are reparented into a `worldContainer` that the camera transforms, so your element coordinates remain in world space regardless of zoom or pan.

## Enable

Camera is **opt-in**. Pass `camera: true` for defaults or provide a config object:

```ts
extensions: {
  camera: {
    zoom: 1,          // initial zoom level (default: 1)
    minZoom: 0.1,     // minimum zoom (default: 0.1)
    maxZoom: 20,      // maximum zoom (default: 20)
    zoomStep: 0.1,    // zoom step per keyboard press (default: 0.1)
    wheelZoom: true,  // enable wheel zoom (default: true)
  },
}
```

### `CameraConfig`

| Option | Type | Default | Description |
|---|---|---|---|
| `zoom` | `number?` | `1` | Initial zoom level |
| `minZoom` | `number?` | `0.1` | Minimum allowed zoom |
| `maxZoom` | `number?` | `20` | Maximum allowed zoom |
| `zoomStep` | `number?` | `0.1` | Factor per keyboard zoom step |
| `wheelZoom` | `boolean?` | `true` | Enable scroll-wheel zooming |

## Accessor API

```ts
// Get current state
const state = canvas.camera.getState();
// { zoom: number, x: number, y: number }

// Set state (zoom clamped to min/max)
canvas.camera.setState({ zoom: 2, x: -100, y: 0 });

// Zoom around a point (defaults to canvas center)
canvas.camera.setZoom(1.5);
canvas.camera.setZoom(2, anchorX, anchorY);

// Coordinate conversion
const world = canvas.camera.screenToWorld(mouseX, mouseY);
const screen = canvas.camera.worldToScreen(element.x, element.y);
```

## Coordinate systems

When the camera extension is enabled, element `x`/`y` positions are in **world space** — they do not change when the user pans or zooms. Screen coordinates are what the browser reports in pointer events.

```ts
// Example: placing an element at the current mouse position in world space
canvas.addEventListener('mousemove', (e) => {
  const world = canvas.camera.screenToWorld(e.clientX, e.clientY);
  canvas.update('cursor', { x: world.x, y: world.y });
});
```

## Input controls

| Input | Behaviour |
|---|---|
| Mouse wheel | Zoom in/out anchored at cursor position (when `wheelZoom: true`) |
| Pinch gesture | Zoom in/out (touch) |
| `Space + drag` | Pan the canvas |
| `=` / `+` | Zoom in by one step |
| `-` | Zoom out by one step |
| `0` | Reset zoom to 1 and position to (0, 0) |

## Events

```ts
canvas.on('camera:changed', ({ zoom, x, y }) => {
  myMinimap.update(zoom, x, y);
});
```

`camera:changed` fires once per pan or zoom gesture, not on every animation frame.

## Build a minimap or zoom control

```ts
// Sync a custom zoom slider
const slider = document.getElementById('zoom-slider') as HTMLInputElement;

canvas.on('camera:changed', ({ zoom }) => {
  slider.value = String(zoom);
});

slider.addEventListener('input', () => {
  canvas.camera.setZoom(parseFloat(slider.value));
});
```

## Notes

- Zoom is clamped between `minZoom` and `maxZoom` at all times — this applies to `setZoom`, `setState`, and user input.
- `setState` emits `camera:changed` exactly once regardless of how many fields change.
- If the camera extension is disabled, `canvas.camera` is present but all methods are no-ops / return safe defaults. Snap lines and grid automatically adapt to the presence or absence of the camera.
