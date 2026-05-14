# Documentation

## Start here

| Guide | Description |
|---|---|
| [Getting started](./GETTING-STARTED.md) | Installation, first CanvasKit, first element |
| [CanvasKit API](./usage/CANVAS-KIT.md) | Full constructor, element ops, events, all accessor namespaces |
| [Elements](./usage/ELEMENTS.md) | All element types with complete option tables |
| [Serialization & Export](./usage/SERIALIZATION-AND-EXPORT.md) | Persist, restore, and render the scene |

## Extensions

| Extension | On by default | Guide |
|---|---|---|
| `alignment` | yes | [Alignment](./extensions/ALIGNMENT.md) |
| `camera` | **no** | [Camera](./extensions/CAMERA.md) |
| `contextMenu` | yes | [Context menu](./extensions/CONTEXT-MENU.md) |
| `export` | yes | [Export](./extensions/EXPORT.md) |
| `fonts` | yes | [Fonts](./extensions/FONTS.md) |
| `grid` | **no** | [Grid](./extensions/GRID.md) |
| `history` | yes | [History](./extensions/HISTORY.md) |
| `interaction` | yes | [Interaction](./extensions/INTERACTION.md) |
| `layering` | yes | [Layering](./extensions/LAYERING.md) |
| `performance` | yes | [Performance](./extensions/PERFORMANCE.md) |
| `serialization` | yes | [Serialization](./extensions/SERIALIZATION.md) |
| `snap` | **no** | [Snap](./extensions/SNAP.md) |

> `camera`, `grid`, and `snap` are opt-in and must be explicitly configured under `extensions`.

## TypeScript surface

From `@geekybones/canvas-kit` you import:

**Runtime values**
```ts
import { CanvasKit, Shape, Text, Image, SVGElement } from '@geekybones/canvas-kit';
```

**Types**
```ts
import type {
  CanvasKitOptions,
  ExtensionsConfig,
  // element options
  TextOptions, ImageOptions, RectangleOptions, CircleOptions,
  StarOptions, LineOptions, SVGOptions,
  // extension types
  HistoryConfig, HistoryTrack,
  CameraConfig, CameraAccessor,
  SnapConfig, SnapResult, Guide,
  InteractionConfig, InteractionTheme,
  ExportOptions, ExportMode, ExportQuality,
  GridConfig, GridState,
  ContextMenuConfig, ContextMenuEvent,
  SerializedElement, SerializationAdapter,
  // events
  CanvasEventMap,
} from '@geekybones/canvas-kit';
```

`CanvasEventMap` is the full event map type for use with `canvas.on` / `canvas.off`.
