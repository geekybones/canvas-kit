# History

Provides undo/redo with a configurable stack depth and per-operation-kind tracking.

## Enable

History is **on by default**. Configure or disable in `extensions`:

```ts
extensions: {
  history: {
    max: 100,     // max undo steps (default: 100)
    track: [      // which kinds to record (default: all)
      'move',
      'resize',
      'rotate',
      'add',
      'remove',
      'zOrder',
      'align',
      'text',
    ],
  },
}
```

Pass `history: false` to disable entirely.

## Accessor API

```ts
// Undo the last recorded action
await canvas.history.undo();

// Redo the last undone action
await canvas.history.redo();

// Check stack state
canvas.history.canUndo();     // boolean
canvas.history.canRedo();     // boolean

// Clipboard (shared with interaction copy/paste)
canvas.history.setClipboard(items);   // BaseOptions[]
canvas.history.getClipboard();        // BaseOptions[] (deep copy each call)
```

## Tracked kinds (`HistoryTrack`)

| Kind | When it's recorded |
|---|---|
| `'move'` | `canvas.update(id, { x, y })` or drag via interaction |
| `'resize'` | `canvas.update(id, { scaleX, scaleY, ... })` or resize handle drag |
| `'rotate'` | `canvas.update(id, { rotationDeg })` or rotate handle drag |
| `'add'` | `canvas.add(element)` or paste / duplicate |
| `'remove'` | `canvas.remove(id)` or delete via keyboard / menu |
| `'zOrder'` | `canvas.layer.*` operations |
| `'align'` | `canvas.alignment.align(...)` |
| `'text'` | `canvas.update(id, ...)` on a `text` element |

To track only specific operations (e.g. tracking add/remove but not moves):

```ts
history: { track: ['add', 'remove'] }
```

## Keyboard shortcuts

Registered automatically when the history extension is enabled:

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

## React to history changes

```ts
canvas.on('history:changed', () => {
  setCanUndo(canvas.history.canUndo());
  setCanRedo(canvas.history.canRedo());
});
```

## Clipboard

The clipboard is shared between `canvas.history` and the interaction extension's copy/paste flow. Items are stored as deep copies of `BaseOptions`.

```ts
// Manually set clipboard (e.g. from server-side paste)
canvas.history.setClipboard([{ id: 'el-1', type: 'shape:rectangle', ... }]);

// Read clipboard
const items = canvas.history.getClipboard();
```

## Notes

- When `max` is reached, the oldest entry is dropped from the undo stack.
- Calling `undo()` or `redo()` on an empty stack is a no-op.
- Performing a new action after undo clears the redo stack.
- An operation that matches a non-tracked kind executes but is not recorded — it cannot be undone.
