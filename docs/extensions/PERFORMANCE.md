# Performance

Provides two low-level utilities: a dirty tracker for changed elements, and a reference-counted asset cache for PixiJS assets.

## Enable

Performance is **on by default**.

```ts
extensions: { performance: true }
// or disable:
extensions: { performance: false }
```

## Accessor API

### Dirty tracking

Elements are automatically marked dirty when they receive an `element:updated` event. You can also mark them manually.

```ts
// Mark an element as dirty
canvas.performance.markDirty('element-id');

// Check if an element is dirty
canvas.performance.isDirty('element-id');   // boolean

// Get all dirty ids and clear the dirty set
canvas.performance.flushDirty();            // readonly string[]

// Clear the dirty set without returning the ids
canvas.performance.clearDirty();
```

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

## Dirty tracking pattern

Use dirty tracking to drive selective re-renders or sync updates to external state:

```ts
canvas.on('element:updated', () => {
  const dirty = canvas.performance.flushDirty();
  for (const id of dirty) {
    syncElementToServer(id, canvas.get(id));
  }
});
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

- Dirty ids accumulate until explicitly cleared via `flushDirty()` or `clearDirty()`.
- `flushDirty()` returns all current dirty ids **and** clears them in one step.
- Asset reference counts are tracked in memory only — counts reset on `canvas.destroy()` or `clearAssets()`.
- This extension is intentionally low-level. Most applications use it as an integration point for custom sync or render-budget logic rather than calling it from UI event handlers.
