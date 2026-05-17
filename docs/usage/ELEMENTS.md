# Elements

Every element extends `BaseOptions`, which provides the shared layout and identity fields described below. Type-specific options are listed per element.

## Base options (all elements)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier *(readonly)* |
| `type` | `string` | Element type discriminator |
| `name` | `string?` | Optional display name |
| `x` | `number?` | Horizontal position |
| `y` | `number?` | Vertical position |
| `rotationDeg` | `number?` | Rotation in degrees |
| `scaleX` | `number?` | Horizontal scale factor |
| `scaleY` | `number?` | Vertical scale factor |
| `zIndex` | `number?` | Stack order (managed by the layering extension) |
| `visible` | `boolean?` | Visibility (default `true`) |
| `selectable` | `boolean?` | Whether the element can be selected and dragged (default `true`). Non-selectable elements still emit `element:click` / pointer events. |
| `custom` | `Record<string, unknown>?` | Arbitrary app-level metadata, persisted through serialization |

---

## Shape

```ts
import { Shape } from '@geekybones/canvas-kit';
```

All shapes share stroke properties. Fill and `borderRadius` are shape-specific.

The `type` field is inferred from the first argument and must not be passed in the options object. The `id` field is optional — a UUID is generated automatically when omitted.

### Rectangle

```ts
Shape.create(Shape.Rectangle, options: RectangleOptions)
// type: 'shape:rectangle'
```

| Field | Type | Description |
|---|---|---|
| `width` | `number` | Width in pixels |
| `height` | `number` | Height in pixels |
| `fill` | `number \| string?` | Fill color (hex number or CSS string) |
| `fillAlpha` | `number?` | Fill opacity (0–1) |
| `stroke` | `number \| string?` | Stroke color (hex number or CSS string) |
| `strokeWidth` | `number?` | Stroke width in pixels |
| `strokeAlpha` | `number?` | Stroke opacity (0–1) |
| `strokeAlign` | `'inside' \| 'center' \| 'outside'?` | Where the stroke is drawn relative to the path |
| `borderRadius` | `number?` | Corner radius |

```ts
await canvas.add(Shape.create(Shape.Rectangle, {
  x: 140,
  y: 220,
  width: 320,
  height: 180,
  fill: 0xffffff,
  stroke: 0xdbe4ff,
  strokeWidth: 2,
  borderRadius: 24,
}));
```

### Circle

```ts
Shape.create(Shape.Circle, options: CircleOptions)
// type: 'shape:circle'
```

| Field | Type | Description |
|---|---|---|
| `radius` | `number?` | Radius in pixels |
| `width` | `number?` | Width (used as diameter if radius is omitted) |
| `height` | `number?` | Height |
| `fill` | `number \| string?` | Fill color (hex number or CSS string) |
| `fillAlpha` | `number?` | Fill opacity |
| `stroke` | `number \| string?` | Stroke color (hex number or CSS string) |
| `strokeWidth` | `number?` | Stroke width |
| `strokeAlpha` | `number?` | Stroke opacity |
| `strokeAlign` | `'inside' \| 'center' \| 'outside'?` | Stroke alignment |

```ts
await canvas.add(Shape.create(Shape.Circle, {
  x: 500,
  y: 200,
  radius: 80,
  fill: 0xf59e0b,
}));
```

### Star

```ts
Shape.create(Shape.Star, options: StarOptions)
// type: 'shape:star'
```

| Field | Type | Description |
|---|---|---|
| `points` | `number` | Number of star points |
| `width` | `number` | Outer width |
| `height` | `number` | Outer height |
| `fill` | `number \| string?` | Fill color (hex number or CSS string) |
| `fillAlpha` | `number?` | Fill opacity |
| `stroke` | `number \| string?` | Stroke color (hex number or CSS string) |
| `strokeWidth` | `number?` | Stroke width |
| `strokeAlpha` | `number?` | Stroke opacity |
| `strokeAlign` | `'inside' \| 'center' \| 'outside'?` | Stroke alignment |

```ts
await canvas.add(Shape.create(Shape.Star, {
  x: 700,
  y: 180,
  points: 5,
  width: 120,
  height: 120,
  fill: 0x7c3aed,
}));
```

### Line

```ts
Shape.create(Shape.Line, options: LineOptions)
// type: 'shape:line'
```

| Field | Type | Description |
|---|---|---|
| `width` | `number` | Line length in pixels |
| `stroke` | `number \| string?` | Stroke color (hex number or CSS string) |
| `strokeWidth` | `number?` | Stroke width |
| `strokeAlpha` | `number?` | Stroke opacity |
| `strokeAlign` | `'inside' \| 'center' \| 'outside'?` | Stroke alignment |

```ts
await canvas.add(Shape.create(Shape.Line, {
  x: 80,
  y: 480,
  width: 360,
  stroke: 0x0f172a,
  strokeWidth: 3,
}));
```

### Register a custom shape type

```ts
Shape.register('shape:badge', (opts) =>
  Shape.create(Shape.Rectangle, {
    ...opts,
    borderRadius: 999,
  }),
);
```

---

## Text

```ts
import { Text } from '@geekybones/canvas-kit';

Text.create(options: TextOptions)
// type: 'text'
```

### Style options

| Field | Type | Description |
|---|---|---|
| `text` | `string` | The text content (multiline with `\n`) |
| `fontFamily` | `string?` | Font family name |
| `fontSize` | `number?` | Font size in pixels |
| `fill` | `number \| string?` | Text fill color |
| `background` | `number \| string?` | Background color behind the text |
| `backgroundAlpha` | `number?` | Background opacity (0–1) |
| `backgroundPadding` | `number?` | Padding around the background |
| `stroke` | `number \| string?` | Text stroke color |
| `strokeWidth` | `number?` | Text stroke width |
| `strokeAlpha` | `number?` | Text stroke opacity |
| `strokeAlign` | `'inside' \| 'center' \| 'outside'?` | Text stroke alignment |
| `fontWeight` | `string?` | CSS font weight (e.g. `'700'`) |
| `fontStyle` | `string?` | CSS font style (e.g. `'italic'`) |
| `underline` | `boolean?` | Underline decoration |
| `strikethrough` | `boolean?` | Strikethrough decoration |
| `letterSpacing` | `number?` | Letter spacing in pixels |
| `align` | `'left' \| 'center' \| 'right' \| 'justify'?` | Horizontal text alignment |
| `lineHeight` | `number?` | Line height multiplier |

### Vector and render mode options

| Field | Type | Description |
|---|---|---|
| `renderMode` | `'standard' \| 'vector'?` | `'standard'` for raster Pixi text (default); `'vector'` for glyph-outline mesh rendering |
| `fontUrl` | `string?` | URL to a `.ttf` / `.otf` / `.woff` font file. Required when using mesh effects. |
| `effect` | `TextEffectOptions?` | Mesh warp effect (requires `fontUrl`) |

### Text effects

Set `effect` to apply a mesh warp. Available `type` values:

| Type | Description |
|---|---|
| `'Normal'` | No warp (passthrough) |
| `'Curved'` | Curve along an arc |
| `'Arch'` | Arch upward or downward |
| `'Bridge'` | Bridge shape |
| `'Valley'` | Valley curve |
| `'Pinch'` | Pinch / squeeze |
| `'Perspective'` | Perspective tilt |
| `'Pointed'` | Pointed at center |
| `'Bulge'` | Bulge outward |
| `'Downward'` | Push downward |
| `'Upward'` | Push upward |
| `'Cone'` | Cone warp |

```ts
effect: {
  type: 'Arch',       // TextEffect
  intensity: 6,       // optional
  direction: 'up',    // 'up' | 'down', optional
  radius: 240,        // optional
}
```

### Examples

```ts
// Standard raster text
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

// Vector text with warp effect
await canvas.add(Text.create({
  id: 'warped',
  type: 'text',
  renderMode: 'vector',
  fontUrl: '/fonts/Manrope-Bold.ttf',
  text: 'ARCH',
  x: 200,
  y: 300,
  fontSize: 72,
  fill: '#7c3aed',
  effect: { type: 'Arch', intensity: 8 },
}));
```

### Register a custom mesh effect

```ts
Text.registerEffect('MyWarp', (t, ctx) => ({
  dy: Math.sin(t * Math.PI) * ctx.intensity,
}), { columns: 64 });
```

---

## Image

```ts
import { Image } from '@geekybones/canvas-kit';

Image.create(options: ImageOptions)
// type: 'image'
```

| Field | Type | Description |
|---|---|---|
| `src` | `string` | Image URL |
| `width` | `number?` | Display width |
| `height` | `number?` | Display height |
| `tint` | `number \| string?` | Tint color applied to the sprite |

```ts
await canvas.add(Image.create({
  id: 'cover',
  type: 'image',
  src: '/cover.jpg',
  x: 80,
  y: 80,
  width: 320,
  height: 240,
}));
```

---

## SVG

```ts
import { SVGElement } from '@geekybones/canvas-kit';
// type: 'svg'
```

Use `SVGElement` for inline or remote SVG content. SVG elements share the same base options and are persisted through the serialization system with the built-in `'svg'` adapter.

---

## Updating element options

Use `canvas.update(id, patch)` to change any option after creation:

```ts
await canvas.update('headline', { text: 'Updated', fill: '#e11d48' });
await canvas.update('card', { fill: 0x1e293b, borderRadius: 12 });
await canvas.update('cover', { tint: 0xff6b6b });
```

Only the supplied fields are changed. All others remain as-is.
