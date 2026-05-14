# Export

Renders the canvas to a PNG `Blob` or base64 data URL.

## Enable

Export is **on by default**.

```ts
extensions: { export: true }
// or disable:
extensions: { export: false }
```

## Accessor API

```ts
const blob    = await canvas.export.render('png');     // Blob (image/png)
const dataUrl = await canvas.export.render('base64');  // string (data URL)
```

### With options

```ts
await canvas.export.render('png', {
  mode: 'content',         // crop to element bounds; 'viewport' exports the full canvas
  margin: 20,              // padding around content (used only with 'content' mode)
  quality: 'hd',           // 'standard' (1×) | 'hd' (2×) | 'ultra' (3×)
  resolution: 2,           // explicit pixel ratio (overrides quality)
  antialias: true,         // antialias during render
  backgroundColor: '#fff', // fill background with this color
});
```

### `ExportOptions`

| Option | Type | Description |
|---|---|---|
| `mode` | `'content' \| 'viewport'?` | `'viewport'` exports the full canvas. `'content'` crops tightly to element bounds. |
| `margin` | `number?` | Extra padding in pixels around the content area (only applies to `'content'` mode) |
| `quality` | `'standard' \| 'hd' \| 'ultra'?` | Resolution preset: 1×, 2×, or 3× |
| `resolution` | `number?` | Explicit pixel ratio — overrides `quality` when both are provided |
| `antialias` | `boolean?` | Enable antialiasing during the render pass |
| `backgroundColor` | `string?` | CSS color to fill the background before rendering |

## Overlay behaviour

Interaction bounding boxes and handles are automatically hidden before rendering and restored when `render()` resolves. No manual calls are needed.

## Download example

```ts
const blob = await canvas.export.render('png') as Blob;
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'canvas.png';
link.click();
URL.revokeObjectURL(url);
```

## Disabled extension

When the export extension is disabled, `canvas.export.render(...)` throws with:

```
Export extension is disabled
```

## Notes

- Rendering is asynchronous — it waits for the PixiJS renderer to produce the image.
- `'png'` uses `canvas.toBlob()`; `'base64'` uses `canvas.toDataURL()`.
- When `'content'` mode is used with no elements, the export falls back to the viewport bounds.
