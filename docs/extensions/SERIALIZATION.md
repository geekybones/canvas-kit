# Serialization

Converts the full scene or individual elements to and from plain JSON objects. Supports custom element types through a pluggable adapter system.

## Enable

Serialization is **on by default**.

```ts
extensions: { serialization: true }
// or disable:
extensions: { serialization: false }
```

## Accessor API

```ts
// Serialize the full scene to a JSON-safe array
const scene = canvas.serializer.serialize();   // SerializedElement[]

// Append elements to the current scene
await canvas.serializer.append(scene);

// Replace the entire scene (with automatic rollback on error)
await canvas.serializer.replace(scene);

// Serialize a single live element
const opts = canvas.serializer.serializeElement(canvas.get('id', true)!);

// Register a custom adapter
canvas.serializer.registerAdapter(myAdapter);
```

## `append` vs `replace`

| Method | Behaviour |
|---|---|
| `append(data)` | Deserializes `data` and adds the resulting elements to the current scene |
| `replace(data)` | Clears the scene, deserializes `data`, and installs the new elements. If any error occurs during deserialization, the previous scene is fully restored before the error is rethrown |

## Error handling

Both methods throw for:
- Any item missing the `"type"` field — `'missing "type"'`
- Any item whose `type` has no registered adapter — `'No serialization adapter registered for "..."'`

`replace` additionally surfaces a combined message if restoration also fails:

```
Failed to replace scene and restore the previous scene. Import error: ... Restore error: ...
```

## Custom adapters

Register an adapter to support custom element types:

```ts
import type { SerializationAdapter } from '@geekybones/canvas-kit';

const badgeAdapter: SerializationAdapter<BadgeOptions> = {
  type: 'custom:badge',

  serialize(element) {
    return element.getOptions();
  },

  deserialize(data) {
    return new BadgeElement(data);
  },
};

canvas.serializer.registerAdapter(badgeAdapter);
```

Rules:
- `type` must be unique. Registering a duplicate throws immediately.
- Register adapters after `await canvas.ready`.
- Built-in adapters are pre-registered for: `text`, `image`, `svg`, `shape:rectangle`, `shape:circle`, `shape:star`, `shape:line`.

## `SerializedElement` type

```ts
type SerializedElement = Record<string, unknown> & {
  id: string;
  type: string;
};
```

The raw array from `serialize()` is JSON-serializable — you can pass it directly to `JSON.stringify`.

## Persist and restore pattern

```ts
// Save
function save() {
  localStorage.setItem('scene', JSON.stringify(canvas.serializer.serialize()));
}

canvas.on('element:added', save);
canvas.on('element:updated', save);
canvas.on('element:removed', save);

// Restore on startup
const raw = localStorage.getItem('scene');
if (raw) {
  await canvas.serializer.replace(JSON.parse(raw));
}
```
