# Context menu

Provides right-click context menus for elements, with a built-in HTML menu and a full custom handler override.

## Enable

Context menu is **on by default**.

```ts
// Built-in HTML menu (default)
extensions: { contextMenu: true }

// Custom handler — suppress the built-in menu
extensions: {
  contextMenu: {
    onElement: ({ selected, position, originalEvent, actions }) => {
      showMyMenu(position, actions);
    },
  },
}

// Disable
extensions: { contextMenu: false }
```

## `ContextMenuConfig`

| Option | Type | Description |
|---|---|---|
| `onElement` | `(ctx: ContextMenuEvent) => void?` | Called when a context menu opens on an element. When provided, the built-in HTML menu is suppressed entirely. |

### `ContextMenuEvent`

```ts
type ContextMenuEvent = {
  selected: SerializedElement[];   // serialized options of the targeted element(s)
  position: { x: number; y: number };
  originalEvent: MouseEvent;
  actions: ContextMenuAction;
};
```

### `ContextMenuAction`

```ts
type ContextMenuAction = {
  delete(): void;
  duplicate(): void;
  bringToFront(): void;
  sendToBack(): void;
  bringForward(): void;
  sendBackward(): void;
  normalizeZIndex(): void;
};
```

## Accessor API

```ts
// Open programmatically
canvas.contextMenu.open('element-id', {
  position: { x: 240, y: 180 },
  originalEvent: mouseEvent,       // optional
});

// Close programmatically
canvas.contextMenu.close();
```

## Selection behaviour

When a context menu is opened on an element that is not currently selected, the selection is automatically retargeted to that element before the handler is called. This ensures that the `actions` object operates on the right element.

## Built-in menu

The built-in HTML menu is a minimal fallback for quick prototyping. It:
- Appears at the clicked position
- Closes on `Escape` or a click outside
- Provides all 7 default actions as menu items

For production apps, provide a custom `onElement` handler and render your own UI.

## Custom handler example

```ts
const canvas = new CanvasKit(container, {
  extensions: {
    contextMenu: {
      onElement: ({ selected, position, actions }) => {
        const menu = document.getElementById('context-menu')!;
        menu.style.left = `${position.x}px`;
        menu.style.top = `${position.y}px`;
        menu.style.display = 'block';

        document.getElementById('menu-delete')!.onclick = () => {
          actions.delete();
          menu.style.display = 'none';
        };
        document.getElementById('menu-front')!.onclick = () => {
          actions.bringToFront();
          menu.style.display = 'none';
        };
      },
    },
  },
});
```

## Notes

- `duplicate` via context menu uses `crypto.randomUUID()` to generate the new element id, ensuring collision-free ids.
- Layering actions (`bringToFront`, etc.) go through the layering extension and are recorded in history.
- `delete` goes through the interaction extension's delete flow and is recorded as `'remove'` in history.
