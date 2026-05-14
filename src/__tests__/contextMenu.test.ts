import { Container } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { CanvasEventBus } from '@/core/Events';
import { ContextMenuManager } from '@/extensions/contextMenu/ContextMenuManager';

function makeElement(id: string, options: Partial<BaseOptions> = {}) {
  const displayObject = new Container();
  return {
    getId: () => id,
    getOptions: () => ({ id, type: 'shape:rectangle', selectable: true, ...options }),
    getDisplayObject: () => displayObject,
  };
}

function makeCtx(params?: {
  selectedIds?: readonly string[];
  selectable?: boolean;
  customHandler?: (ctx: unknown) => void;
}) {
  const canvas = document.createElement('canvas');
  const stage = new Container();
  const events = new CanvasEventBus();
  const element = makeElement('shape-1', { selectable: params?.selectable });
  const selectedElement = makeElement('shape-2');
  const elements = new Map([
    ['shape-1', element],
    ['shape-2', selectedElement],
  ]);

  const interaction = {
    getSelectedIds: vi.fn(() => params?.selectedIds ?? ['shape-2']),
    select: vi.fn(),
  };

  const layering = {
    bringToFront: vi.fn(),
    sendToBack: vi.fn(),
    bringForward: vi.fn(),
    sendBackward: vi.fn(),
    normalizeZIndex: vi.fn(),
  };

  const serializer = {
    serialize: vi.fn((item: { getOptions(): BaseOptions }) => item.getOptions()),
  };

  const ctx = {
    app: {
      getCanvas: () => canvas,
      getPixiApp: () => ({ stage, screen: { width: 800, height: 600 } }),
    },
    events,
    registry: {
      get: vi.fn((id: string) => elements.get(id)),
      getAll: vi.fn(() => elements),
      createFromOptions: vi.fn((options: BaseOptions) => makeElement(options.id, options)),
    },
    options: {
      extensions: {
        contextMenu: params?.customHandler ? { onElement: params.customHandler } : true,
      },
    },
    stage,
    getElement: vi.fn(),
    addElement: vi.fn(async (elementLike: { getOptions(): BaseOptions }) => {
      const options = elementLike.getOptions();
      elements.set(options.id, makeElement(options.id, options));
    }),
    removeElement: vi.fn((id: string) => {
      elements.delete(id);
    }),
    clearElements: vi.fn(() => {
      elements.clear();
    }),
    getExtension: vi.fn((name: string) => {
      if (name === 'interaction') return interaction;
      if (name === 'layering') return layering;
      if (name === 'serialization') return serializer;
      return undefined;
    }),
    hasExtension: vi.fn(),
  } as unknown as CanvasContext;

  return { ctx, canvas, events, interaction, layering, serializer, elements };
}

describe('ContextMenuManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('retargets to the clicked element when it is not already selected', () => {
    const customHandler = vi.fn();
    const { ctx, interaction, layering } = makeCtx({
      selectedIds: ['shape-2'],
      customHandler,
    });
    const manager = new ContextMenuManager();
    manager.init(ctx);

    manager.open('shape-1', { position: { x: 100, y: 120 } });
    const payload = customHandler.mock.calls[0]?.[0] as {
      actions: { bringToFront(): void };
    };
    payload.actions.bringToFront();

    expect(interaction.select).toHaveBeenCalledWith('shape-1');
    expect(layering.bringToFront).toHaveBeenCalledWith(['shape-1']);
  });

  it('uses resolved target ids for duplicate instead of ambient selection state', async () => {
    const customHandler = vi.fn();
    const { ctx, interaction, elements } = makeCtx({
      selectedIds: ['shape-2'],
      customHandler,
    });
    const manager = new ContextMenuManager();
    manager.init(ctx);

    manager.open('shape-1', { position: { x: 80, y: 90 } });
    const payload = customHandler.mock.calls[0]?.[0] as {
      actions: { duplicate(): void };
    };
    payload.actions.duplicate();
    await Promise.resolve();
    await Promise.resolve();

    expect(interaction.select).toHaveBeenCalledWith('shape-1');
    expect([...elements.keys()].some((id) => id.startsWith('shape-1_dup_'))).toBe(true);
    expect([...elements.keys()].some((id) => id.startsWith('shape-2_dup_'))).toBe(false);
  });

  it('syncs listeners when element selectable state changes', () => {
    const { ctx, events, elements } = makeCtx({ selectable: false });
    const manager = new ContextMenuManager();
    manager.init(ctx);

    const element = elements.get('shape-1');
    const displayObject = element?.getDisplayObject();
    const onSpy = vi.spyOn(displayObject as Container, 'on');

    events.emit('element:added', 'shape-1');
    expect(onSpy).not.toHaveBeenCalled();

    elements.set('shape-1', makeElement('shape-1', { selectable: true }));
    const nextDisplayObject = elements.get('shape-1')?.getDisplayObject();
    const nextOnSpy = vi.spyOn(nextDisplayObject as Container, 'on');
    events.emit('element:updated', 'shape-1');
    expect(nextOnSpy).toHaveBeenCalledTimes(2);

    const nextOffSpy = vi.spyOn(nextDisplayObject as Container, 'off');
    elements.set('shape-1', makeElement('shape-1', { selectable: false }));
    events.emit('element:updated', 'shape-1');
    expect(nextOffSpy).toHaveBeenCalledTimes(2);
  });

  it('custom handler suppresses the default menu', () => {
    const customHandler = vi.fn();
    const { ctx } = makeCtx({ customHandler });
    const manager = new ContextMenuManager();
    manager.init(ctx);

    manager.open('shape-1', { position: { x: 20, y: 30 } });

    expect(customHandler).toHaveBeenCalledTimes(1);
    expect(document.body.children.length).toBe(0);
  });

  it('default menu closes on escape and document click', () => {
    const { ctx } = makeCtx();
    const manager = new ContextMenuManager();
    manager.init(ctx);

    manager.open('shape-1', { position: { x: 40, y: 50 } });
    expect(document.body.children.length).toBeGreaterThan(0);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.body.children.length).toBe(0);

    manager.open('shape-1', { position: { x: 40, y: 50 } });
    expect(document.body.children.length).toBeGreaterThan(0);

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.body.children.length).toBe(0);
  });
});
