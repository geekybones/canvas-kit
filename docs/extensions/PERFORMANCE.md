# Performance

Provides a reference-counted asset cache for PixiJS assets.

## Enable

Performance is **on by default**.

```ts
extensions: { performance: true }
// or disable:
extensions: { performance: false }
```

## Accessor API

### Asset cache

Reference counting for PixiJS assets (images, fonts, textures). Assets are unloaded via `Assets.unload()` only when their reference count reaches zero.

```ts
// Increment reference count for an asset
canvas.performance.retainAsset('/images/texture.png');

// Decrement reference count; unloads when count reaches 0
await canvas.performance.releaseAsset('/images/texture.png');

// Unload all tracked assets and reset all counts
await canvas.performance.clearAssets();
```

## Asset lifecycle pattern

```ts
// When adding an image element
canvas.performance.retainAsset(imageUrl);
await canvas.add(Image.create({ id: 'img-1', type: 'image', src: imageUrl, ... }));

// When removing the element
await canvas.remove('img-1');
await canvas.performance.releaseAsset(imageUrl);
// Asset is unloaded from Pixi's cache if nothing else holds a reference
```

## Notes

- Asset reference counts are tracked in memory only — counts reset on `canvas.destroy()` or `clearAssets()`.
- This extension is intentionally low-level. Most applications use it as an integration point for custom asset lifecycle management.
