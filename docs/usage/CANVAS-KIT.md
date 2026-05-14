# CanvasKit API

## Constructor

```ts
new CanvasKit(container: HTMLElement, options?: CanvasKitOptions)
```

### `CanvasKitOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | — | Initial canvas width in pixels |
| `height` | `number` | — | Initial canvas height in pixels |
| `backgroundColor` | `string` | — | Canvas background color (CSS color string) |
| `constrainToCanvas` | `boolean` | `false` | Prevent dragging elements outside the canvas bounds |
| `extensions` | `ExtensionsConfig` | — | Enable, disable, or configure individual extensions |

### `ExtensionsConfig`

| Key | Type | On by default |
|---|---|---|
| `alignment` | `boolean` | yes |
| `history` | `boolean \| HistoryConfig` | yes |
| `interaction` | `boolean \| InteractionConfig` | yes |
| `layering` | `boolean` | yes |
| `serialization` | `boolean` | yes |
| `export` | `boolean` | yes |
| `fonts` | `boolean` | yes |
| `performance` | `boolean` | yes |
| `contextMenu` | `boolean \| ContextMenuConfig` | yes |
| `camera` | `boolean \| CameraConfig` | **no** |
| `grid` | `boolean \| GridConfig` | **no** |
| `snap` | `boolean \| SnapConfig` | **no** |

Pass `false` to disable an extension that is on by default. Pass `true` to enable an opt-in extension with its defaults.

---

## Lifecycle

```ts
const canvas = new CanvasKit(container, options);

// Wait for PixiJS and all extensions to initialise
await canvas.ready;

// Tear down — destroys all extensions, clears registry, destroys PixiJS app
canvas.destroy();
```

Always await `canvas.ready` before adding elements or calling any accessor methods.

---

## Element operations

### `add(element)`

```ts
add(element: BaseElement<BaseOptions>): Promise<void>
```

Adds an element to the canvas. If an element with the same `id` already exists, the existing element is updated with the new options (upsert behaviour). When history is enabled, this is recorded as an `'add'` command.

```ts
await canvas.add(Shape.create(Shape.Rectangle, {
  id: 'rect-1',
  type: 'shape:rectangle',
  width: 200,
  height: 100,
  fill: 0x4f86f7,
}));
```

### `remove(id)`

```ts
remove(id: string): Promise<void>
```

Removes an element by id. When history is enabled, this is recorded as a `'remove'` command.

```ts
await canvas.remove('rect-1');
```

### `update(id, patch)`

```ts
update(id: string, patch: Partial<BaseOptions>): Promise<void>
```

Applies a partial options patch to an existing element. Only the supplied fields are changed. When history is enabled, `update()` automatically classifies the change kind (`'move'`, `'resize'`, `'rotate'`, `'zOrder'`, `'text'`) based on which fields are being updated.

```ts
await canvas.update('rect-1', { x: 200, y: 150 });         // recorded as 'move'
await canvas.update('rect-1', { scaleX: 1.5, scaleY: 1.5 }); // recorded as 'resize'
await canvas.update('rect-1', { rotationDeg: 45 });         // recorded as 'rotate'
await canvas.update('rect-1', { fill: 0xff0000 });          // not tracked (style change)
```

### `clear()`

```ts
clear(): void
```

Removes every registered element. This is not recorded in history.

### `get(id)` / `get(id, true)`

```ts
// Returns serialized options (plain object)
get(id: string): SerializedElement | undefined

// Returns the live element instance
get(id: string, raw: true): BaseElement<BaseOptions> | undefined
```

Default (no second argument or `false`) returns a serialized plain-object snapshot. Pass `true` to get the live element instance — useful when you need to call methods directly.

```ts
const options = canvas.get('rect-1');          // SerializedElement | undefined
const element = canvas.get('rect-1', true);    // BaseElement | undefined
```

---

## Events

```ts
canvas.on(event, listener): this
canvas.off(event, listener): this
```

Both methods are chainable. Listeners receive strongly-typed arguments based on the event name.

| Event | Payload | When |
|---|---|---|
| `element:added` | `id: string` | An element was added to the canvas |
| `element:removed` | `id: string` | An element was removed from the canvas |
| `element:updated` | `id: string` | An element's options were changed |
| `element:selected` | `ids: string \| readonly string[] \| null` | The selection changed |
| `history:changed` | *(none)* | Undo/redo stack was modified |
| `layer:changed` | *(none)* | Z-order was changed |
| `camera:changed` | `state: { zoom, x, y }` | Camera moved or zoomed |

```ts
canvas.on('element:added', (id) => {
  console.log('element added:', id);
});

canvas.on('camera:changed', ({ zoom, x, y }) => {
  myMinimap.update(zoom, x, y);
});

// Unlisten
const handler = (id: string) => console.log(id);
canvas.on('element:updated', handler);
canvas.off('element:updated', handler);
```

---

## Extension accessors

After `await canvas.ready`, each enabled extension attaches a typed accessor namespace to the CanvasKit instance. When an extension is disabled, its accessor is present but every method either returns a safe default or throws (for operations that must produce a result, such as `export.render`).

| Namespace | Extension | Description |
|---|---|---|
| `canvas.history` | `history` | Undo, redo, clipboard |
| `canvas.serializer` | `serialization` | Serialize / append / replace the scene |
| `canvas.interaction` | `interaction` | Selection, duplicate, selection state |
| `canvas.layer` | `layering` | Z-order operations |
| `canvas.alignment` | `alignment` | Align elements |
| `canvas.camera` | `camera` | Pan, zoom, coordinate mapping *(opt-in)* |
| `canvas.contextMenu` | `contextMenu` | Open/close context menu programmatically |
| `canvas.export` | `export` | Render to PNG or base64 |
| `canvas.fonts` | `fonts` | Load custom web fonts |
| `canvas.performance` | `performance` | Dirty tracking, asset retain/release |
| `canvas.grid` | `grid` | Grid visibility and sizing *(opt-in)* |
| `canvas.snap` | `snap` | Snap resolution, guides, config *(opt-in)* |

### History

```ts
await canvas.history.undo();
await canvas.history.redo();
canvas.history.canUndo();           // boolean
canvas.history.canRedo();           // boolean
canvas.history.setClipboard(items); // BaseOptions[]
canvas.history.getClipboard();      // BaseOptions[] (deep copy)
```

### Serialization

```ts
const scene = canvas.serializer.serialize();            // SerializedElement[]
await canvas.serializer.append(scene);                  // add to existing scene
await canvas.serializer.replace(scene);                 // replace (with rollback on error)
const opts = canvas.serializer.serializeElement(el);    // serialize one element
canvas.serializer.registerAdapter(adapter);             // register custom adapter
```

### Interaction

```ts
canvas.interaction.select('id');                    // select one
canvas.interaction.select(['id-1', 'id-2']);        // select multiple
canvas.interaction.select(null);                    // clear selection
canvas.interaction.getSelectedIds();               // string[]
canvas.interaction.getSelectedOptions();           // BaseOptions[]
await canvas.interaction.duplicate();              // duplicate selection
```

### Layering

```ts
canvas.layer.bringToFront('id');                   // or: ['id-1', 'id-2']
canvas.layer.sendToBack('id');                     // or: ['id-1', 'id-2']
canvas.layer.bringForward('id');                   // single id only
canvas.layer.sendBackward('id');                   // single id only
canvas.layer.normalizeZIndex();                    // reassign 1..n preserving order
```

### Alignment

```ts
await canvas.alignment.align('left');
await canvas.alignment.align('center');
await canvas.alignment.align('right');
await canvas.alignment.align('top');
await canvas.alignment.align('middle');
await canvas.alignment.align('bottom');
// pass explicit ids to override the current selection:
await canvas.alignment.align('left', ['id-1', 'id-2']);
```

One element selected → aligned to canvas bounds. Multiple elements → aligned to combined selection bounds.

### Camera

```ts
canvas.camera.getState();                                   // { zoom, x, y }
canvas.camera.setState({ zoom: 1.5, x: -100, y: 0 });
canvas.camera.setZoom(2, anchorX?, anchorY?);              // zoom around point
canvas.camera.screenToWorld(screenX, screenY);             // { x, y }
canvas.camera.worldToScreen(worldX, worldY);               // { x, y }
```

### Export

```ts
const blob = await canvas.export.render('png');            // Blob
const dataUrl = await canvas.export.render('base64');      // string

// With options:
const hd = await canvas.export.render('png', {
  quality: 'hd',          // 'standard' | 'hd' | 'ultra'
  mode: 'content',        // 'content' | 'viewport'
  margin: 20,
  backgroundColor: '#fff',
  antialias: true,
});
```

### Fonts

```ts
await canvas.fonts.load('Manrope', '/fonts/Manrope-Regular.ttf');
canvas.fonts.isLoaded('Manrope');       // boolean
canvas.fonts.getLoadedFonts();          // readonly string[]
```

### Performance

```ts
canvas.performance.markDirty('id');
canvas.performance.isDirty('id');       // boolean
canvas.performance.flushDirty();        // readonly string[] — all dirty ids, then clears
canvas.performance.clearDirty();        // clear without returning

canvas.performance.retainAsset('/asset.png');
await canvas.performance.releaseAsset('/asset.png');  // unloads when refcount hits 0
await canvas.performance.clearAssets();               // unload all tracked assets
```

### Grid

```ts
canvas.grid.setVisible(true);
canvas.grid.isVisible();                // boolean
canvas.grid.getState();                 // { cellSize, majorInterval, visible }
canvas.grid.setCellSize(24);
canvas.grid.setMajorInterval(4);
```

### Snap

```ts
const result = canvas.snap.resolve(x, y, {
  width: 100,           // element width for center/edge snapping
  height: 60,
  exclude: ['id-1'],    // skip these elements as snap targets
});
// result: { x, y, snapped, xSnapped, ySnapped, xTarget?, yTarget?, lineX?, lineY? }

canvas.snap.showLines(result);
canvas.snap.hideLines();

canvas.snap.addGuide({ id: 'g1', orientation: 'vertical', position: 400 });
canvas.snap.removeGuide('g1');
canvas.snap.clearGuides();

canvas.snap.configure({ threshold: 12, lineColor: 0xff6b6b });
canvas.snap.getState();   // { config: SnapConfig, guides: Guide[] }
```

### Context menu

```ts
canvas.contextMenu.open('element-id', {
  position: { x: 240, y: 180 },
  originalEvent: event,        // optional MouseEvent
});
canvas.contextMenu.close();
```

---

## Raw extension access

For extension methods not surfaced on an accessor, use `getExtension`:

```ts
const raw = canvas.getExtension<SomeManager>('someExtension');
```

Most applications should prefer accessor namespaces. This escape hatch is for advanced integrations and debugging.
