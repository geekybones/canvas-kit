# Fonts

Loads custom web fonts via the browser `FontFace` API and registers them with `document.fonts` so they are available to the PixiJS text renderer.

## Enable

Fonts is **on by default**.

```ts
extensions: { fonts: true }
// or disable:
extensions: { fonts: false }
```

## Accessor API

```ts
// Load a font family from a URL (.ttf / .otf / .woff)
await canvas.fonts.load('Manrope', '/fonts/Manrope-Regular.ttf');
await canvas.fonts.load('Manrope', '/fonts/Manrope-Bold.ttf');

// Check if a family has been loaded
canvas.fonts.isLoaded('Manrope');       // boolean

// List all loaded families
canvas.fonts.getLoadedFonts();          // readonly string[]
```

## Behaviour

- Calls are **deduplicated** — loading the same `family + url` pair more than once does nothing after the first call.
- Loading the same family from a **different URL** throws with `'already loaded'`.
- The `FontFace.load()` call is awaited, so `canvas.fonts.load()` resolves only once the font is ready to use.

## Standard vs vector text

Font loading via this extension applies to standard raster text (PixiJS `Text`). For vector text with mesh effects, also provide `fontUrl` directly on the text element — this is separate from the FontFace registration:

```ts
// Load via FontFace API (for standard text rendering)
await canvas.fonts.load('Manrope', '/fonts/Manrope-Bold.ttf');

// Then create a vector text element that also references the font file
await canvas.add(Text.create({
  id: 'title',
  type: 'text',
  renderMode: 'vector',
  fontUrl: '/fonts/Manrope-Bold.ttf',   // used for glyph outline data
  fontFamily: 'Manrope',                // used for raster fallback
  text: 'VECTOR',
  fontSize: 80,
  fill: '#0f172a',
  effect: { type: 'Arch', intensity: 6 },
}));
```

## Preload fonts before restoring a scene

```ts
await canvas.fonts.load('Inter', '/fonts/Inter-Regular.ttf');
await canvas.fonts.load('Inter', '/fonts/Inter-Bold.ttf');
await canvas.serializer.replace(savedScene);
```

Loading fonts before `replace()` ensures text renders with the correct typeface immediately on restore.
