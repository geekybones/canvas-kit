import type { ContextMenuEvent } from '@/extensions/contextMenu/types';

function getDefaultItems(ctx: ContextMenuEvent): Array<{ label: string; action?: () => void }> {
  return [
    { label: 'Duplicate', action: ctx.actions.duplicate },
    { label: 'Delete', action: ctx.actions.delete },
    { label: 'separator' },
    { label: 'Bring to Front', action: ctx.actions.bringToFront },
    { label: 'Bring Forward', action: ctx.actions.bringForward },
    { label: 'Send Backward', action: ctx.actions.sendBackward },
    { label: 'Send to Back', action: ctx.actions.sendToBack },
    { label: 'separator' },
    { label: 'Normalize z-Index', action: ctx.actions.normalizeZIndex },
  ];
}

export function renderDefaultContextMenu(ctx: ContextMenuEvent): HTMLElement {
  const menu = document.createElement('div');
  menu.style.cssText = `
    position: fixed;
    left: ${ctx.position.x}px;
    top: ${ctx.position.y}px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 4px 0;
    z-index: 9999;
    min-width: 160px;
    font-family: sans-serif;
    font-size: 13px;
  `;

  for (const item of getDefaultItems(ctx)) {
    const element = document.createElement('div');
    if (item.label === 'separator') {
      element.style.cssText = 'border-top: 1px solid #eee; margin: 4px 0;';
    } else {
      element.textContent = item.label;
      element.style.cssText = 'padding: 6px 16px; cursor: pointer; color: #222;';
      element.addEventListener('mouseenter', () => {
        element.style.background = '#f0f0f0';
      });
      element.addEventListener('mouseleave', () => {
        element.style.background = '';
      });
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        item.action?.();
      });
    }
    menu.appendChild(element);
  }

  document.body.appendChild(menu);
  clampMenuToViewport(menu, ctx.position);
  return menu;
}

function clampMenuToViewport(menu: HTMLElement, position: { x: number; y: number }): void {
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${position.x - rect.width}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${position.y - rect.height}px`;
  }
}
