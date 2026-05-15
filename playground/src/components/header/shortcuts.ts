export type ShortcutEntry = {
  keys: string;
  description: string;
};

export type ShortcutGroup = {
  title: string;
  items: ShortcutEntry[];
};

function modKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
}

export function getShortcutGroups(): ShortcutGroup[] {
  const mod = modKey();

  return [
    {
      title: 'Selection',
      items: [
        { keys: 'Click', description: 'Select element' },
        { keys: `${mod} + Click`, description: 'Add or remove from selection' },
        { keys: 'Click empty canvas', description: 'Clear selection' },
        { keys: 'Drag selection', description: 'Move selected elements' },
        { keys: 'Drag inside selection box', description: 'Move multi-selection (including gaps)' },
      ],
    },
    {
      title: 'Transform',
      items: [
        { keys: 'Drag handle', description: 'Resize selection' },
        { keys: 'Drag rotate handle', description: 'Rotate selection' },
      ],
    },
    {
      title: 'Edit',
      items: [
        { keys: 'Delete / Backspace', description: 'Delete selection' },
        { keys: `${mod} + C`, description: 'Copy selection' },
        { keys: `${mod} + V`, description: 'Paste clipboard' },
        { keys: `${mod} + D`, description: 'Duplicate selection' },
        { keys: `${mod} + Z`, description: 'Undo' },
        { keys: `${mod} + Shift + Z`, description: 'Redo' },
      ],
    },
    {
      title: 'Camera',
      items: [
        { keys: '+ / =', description: 'Zoom in' },
        { keys: '-', description: 'Zoom out' },
        { keys: '0', description: 'Reset zoom and pan' },
        { keys: 'Space + drag', description: 'Pan canvas' },
        { keys: 'Scroll wheel', description: 'Zoom at pointer' },
      ],
    },
    {
      title: 'General',
      items: [
        { keys: 'Right-click element', description: 'Open context menu' },
        { keys: 'Escape', description: 'Close menu or dialog' },
      ],
    },
  ];
}
