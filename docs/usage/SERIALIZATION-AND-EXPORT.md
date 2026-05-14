# Serialization & Export

## Serialization

The `serialization` extension converts the scene to and from plain JSON objects.

### Enable

Serialization is enabled by default. To disable:

```ts
extensions: { serialization: false }
```

### Serialize the full scene

```ts
const scene = canvas.serializer.serialize();
// Returns SerializedElement[] — a plain JSON-safe array
```

### Persist and restore

```ts
// Save
localStorage.setItem('scene', JSON.stringify(canvas.serializer.serialize()));

// Restore
const saved = JSON.parse(localStorage.getItem('scene') ?? '[]');
await canvas.serializer.replace(saved);
```

### `append` vs `replace`

| Method | Behaviour |
|---|---|
| `canvas.serializer.append(data)` | Deserializes `data` and **adds** the elements to the existing scene |
| `canvas.serializer.replace(data)` | Clears the scene, deserializes `data`, then **replaces** everything. If deserialization fails, the previous scene is fully restored |

### Serialize a single element

```ts
const opts = canvas.serializer.serializeElement(canvas.get('rect-1', true)!);
// also available shorthand:
const opts2 = canvas.get('rect-1');   // returns SerializedElement | undefined
```

### Error handling

`append` and `replace` throw synchronously for:
- a data item missing the `"type"` field
- a data item with an unknown `type` (no registered adapter)

`replace` additionally catches any deserialization error and restores the pre-replace scene before rethrowing.

---

## Custom serialization adapters

Register an adapter to support a custom element type in the serialization pipeline.

```ts
import type { SerializationAdapter } from '@geekybones/canvas-kit';

const badgeAdapter: SerializationAdapter = {
  type: 'custom:badge',

  // Return a plain options object from the live element
  serialize(element) {
    return element.getOptions();
  },

  // Reconstruct a live element from the saved options
  deserialize(data) {
    return new BadgeElement(data);
  },
};

canvas.serializer.registerAdapter(badgeAdapter);
```

Rules:
- `type` must be unique within a CanvasKit instance. Duplicate registrations throw.
- Custom adapters are registered at runtime after `await canvas.ready`.
- Built-in adapters exist for: `text`, `image`, `svg`, `shape:rectangle`, `shape:circle`, `shape:star`, `shape:line`.

---

## Export

The `export` extension renders the canvas to an image.

### Enable

Export is enabled by default. To disable:

```ts
extensions: { export: false }
```

### Basic usage

```ts
const blob = await canvas.export.render('png');
const dataUrl = await canvas.export.render('base64');
```

- `'png'` returns a `Blob` (type `image/png`)
- `'base64'` returns a PNG data URL string

### Export options

```ts
await canvas.export.render('png', {
  mode: 'content',           // 'content' | 'viewport' (default: viewport)
  margin: 20,                // add padding around content (pixels)
  quality: 'hd',             // 'standard' | 'hd' | 'ultra'
  resolution: 2,             // pixel ratio (overrides quality preset)
  antialias: true,
  backgroundColor: '#ffffff',
});
```

| Option | Type | Description |
|---|---|---|
| `mode` | `'content' \| 'viewport'` | `'viewport'` exports the whole canvas; `'content'` crops tightly to element bounds |
| `margin` | `number?` | Extra padding around the content area (only used with `'content'` mode) |
| `quality` | `'standard' \| 'hd' \| 'ultra'?` | Resolution preset (standard = 1×, hd = 2×, ultra = 3×) |
| `resolution` | `number?` | Exact pixel ratio — overrides `quality` if both are supplied |
| `antialias` | `boolean?` | Whether antialiasing is applied during render |
| `backgroundColor` | `string?` | Background color for the exported image |

### Overlay behaviour

The interaction bounding box and handle overlays are automatically hidden during export and restored afterward. No manual call is needed.

### Downloading the exported file

```ts
const blob = await canvas.export.render('png') as Blob;
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'canvas.png';
link.click();
URL.revokeObjectURL(url);
```

### Disabled extension

If the export extension is disabled, `canvas.export.render(...)` throws with `'Export extension is disabled'`. Guard if export is conditionally enabled:

```ts
try {
  const png = await canvas.export.render('png');
} catch (err) {
  console.warn('Export unavailable');
}
```

---

## Typical save / restore workflow

```ts
// Save on every change
canvas.on('element:added', save);
canvas.on('element:updated', save);
canvas.on('element:removed', save);

function save() {
  const scene = canvas.serializer.serialize();
  localStorage.setItem('scene', JSON.stringify(scene));
}

// Restore on load
async function restore() {
  const raw = localStorage.getItem('scene');
  if (raw) {
    await canvas.serializer.replace(JSON.parse(raw));
  }
}
```
