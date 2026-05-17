import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasKit } from '@/canvas/CanvasKit';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import { Shape } from '@/elements/Shape';

function makeRect(
  id: string,
  overrides: { x?: number; width?: number; height?: number } = {},
): BaseElement<BaseOptions> {
  return Shape.create(Shape.Rectangle, {
    id,
    width: 100,
    height: 80,
    fill: 0xff0000,
    ...overrides,
  });
}

describe('CanvasKit', () => {
  let canvas: CanvasKit;

  beforeEach(async () => {
    const container = document.createElement('div');
    canvas = new CanvasKit(container, { extensions: {} });
    await canvas.ready;
  });

  it('creates with ready promise', () => {
    expect(canvas).toBeDefined();
    expect(canvas.ready).toBeInstanceOf(Promise);
  });

  it('add returns the element id', async () => {
    const rect = makeRect('r1');
    const id = await canvas.add(rect);
    expect(id).toBe('r1');
  });

  it('add with auto-generated id returns a uuid', async () => {
    const rect = Shape.create(Shape.Rectangle, { width: 100, height: 80 });
    const id = await canvas.add(rect);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(canvas.get(id, true)).toBeDefined();
  });

  it('adds a new element', async () => {
    const rect = makeRect('r1');
    await canvas.add(rect);

    const result = canvas.get('r1', true);
    expect(result).toBeDefined();
    expect(result?.getId()).toBe('r1');
  });

  it('upserts element when same id added again', async () => {
    await canvas.add(makeRect('r1'));
    const element = canvas.get('r1', true);
    expect(element).toBeDefined();
    if (!element) {
      throw new Error('Expected element r1 to exist');
    }
    const updateSpy = vi.spyOn(element, 'update');
    await canvas.add(makeRect('r1', { width: 200 }));

    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ width: 200 }));
  });

  it('removes an element', async () => {
    await canvas.add(makeRect('r1'));
    await canvas.remove('r1');

    expect(canvas.get('r1', true)).toBeUndefined();
  });

  it('clear removes all elements', async () => {
    await canvas.add(makeRect('r1'));
    await canvas.add(makeRect('r2'));
    canvas.clear();

    expect(canvas.get('r1', true)).toBeUndefined();
    expect(canvas.get('r2', true)).toBeUndefined();
  });

  it('get returns serialized form by default', async () => {
    await canvas.add(makeRect('r1'));
    const result = canvas.get('r1');
    expect(result).toBeDefined();
  });

  it('get returns undefined for missing id', () => {
    expect(canvas.get('missing')).toBeUndefined();
  });

  it('getIds returns all element ids', async () => {
    await canvas.add(makeRect('r1'));
    await canvas.add(makeRect('r2'));
    expect(canvas.getIds()).toEqual(expect.arrayContaining(['r1', 'r2']));
    expect(canvas.getIds()).toHaveLength(2);
  });

  it('getAll returns serialized elements without requiring serializer', async () => {
    await canvas.add(makeRect('r1'));
    await canvas.add(makeRect('r2'));
    const all = canvas.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((e) => e.id)).toEqual(expect.arrayContaining(['r1', 'r2']));
  });

  it('getAll works even when serializer extension is disabled', async () => {
    const container = document.createElement('div');
    const noSerCanvas = new CanvasKit(container, { extensions: { serialization: false } });
    await noSerCanvas.ready;
    await noSerCanvas.add(makeRect('r1'));
    const all = noSerCanvas.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe('r1');
  });

  it('destroy cleans up extensions and registry', async () => {
    await canvas.add(makeRect('r1'));
    canvas.destroy();
    expect(canvas.get('r1', true)).toBeUndefined();
  });

  it('exposes extension accessors after ready', async () => {
    expect(canvas.history).toBeDefined();
    expect(canvas.serializer).toBeDefined();
    expect(canvas.interaction).toBeDefined();
    expect(canvas.layer).toBeDefined();
    expect(canvas.alignment).toBeDefined();
    expect(canvas.export).toBeDefined();
    expect(canvas.fonts).toBeDefined();
    expect(canvas.performance).toBeDefined();
    expect(canvas.contextMenu).toBeDefined();
    expect(canvas.camera).toBeDefined();
    expect(canvas.grid).toBeDefined();
    expect(canvas.snap).toBeDefined();

    await expect(canvas.history?.undo()).resolves.toBeUndefined();
    expect(Array.isArray(canvas.serializer?.serialize())).toBe(true);
  });

  it('exposes clipboard helpers on the history accessor', () => {
    const items = [{ id: 'clip-1', type: 'shape:rectangle' }];

    canvas.history?.setClipboard(items);

    const clipboard = canvas.history?.getClipboard();
    expect(clipboard).toEqual(items);
    expect(clipboard).not.toBe(items);
    expect(clipboard?.[0]).not.toBe(items[0]);
  });

  it('keeps disabled accessors available with safe defaults', async () => {
    const container = document.createElement('div');
    const disabledCanvas = new CanvasKit(container, {
      extensions: {
        history: false,
        serialization: false,
      },
    });
    await disabledCanvas.ready;

    expect(disabledCanvas.history).toBeDefined();
    expect(disabledCanvas.serializer).toBeDefined();
    expect(disabledCanvas.history.canUndo()).toBe(false);
    expect(disabledCanvas.serializer.serialize()).toEqual([]);
  });

  it('exposes the cleaned interaction accessor surface', async () => {
    await canvas.add(makeRect('r1'));
    await canvas.add(makeRect('r2', { x: 120 }));

    canvas.interaction?.select(['r1', 'r2']);

    expect(canvas.interaction?.getSelectedIds()).toEqual(['r1', 'r2']);
    expect(canvas.interaction?.getSelectedOptions()).toEqual([
      expect.objectContaining({ id: 'r1' }),
      expect.objectContaining({ id: 'r2' }),
    ]);

    await canvas.interaction?.duplicate();
    expect(canvas.interaction?.getSelectedIds()).toHaveLength(2);
  });

  it('warmup resolves without error', async () => {
    await expect(canvas.warmup()).resolves.toBeUndefined();
  });

  describe('addMany', () => {
    it('adds all elements and returns their ids', async () => {
      const ids = await canvas.addMany([makeRect('r1'), makeRect('r2'), makeRect('r3')]);
      expect(ids).toEqual(['r1', 'r2', 'r3']);
      expect(canvas.getIds()).toEqual(expect.arrayContaining(['r1', 'r2', 'r3']));
      expect(canvas.getIds()).toHaveLength(3);
    });

    it('returns an empty array for empty input', async () => {
      const ids = await canvas.addMany([]);
      expect(ids).toEqual([]);
    });

    it('records a single history entry so one undo removes all elements', async () => {
      await canvas.addMany([makeRect('r1'), makeRect('r2')]);
      expect(canvas.history.canUndo()).toBe(true);
      await canvas.history.undo();
      expect(canvas.getIds()).toHaveLength(0);
    });
  });

  describe('update with track: false', () => {
    it('applies the patch without adding to the undo stack', async () => {
      await canvas.add(makeRect('r1'));
      const undoDepthBefore = canvas.history.canUndo();

      await canvas.update('r1', { x: 999, y: 999 }, { track: false });

      expect(canvas.history.canUndo()).toBe(undoDepthBefore);
      expect(canvas.get('r1', true)?.getOptions().x).toBe(999);
    });

    it('still applies the patch when history is disabled', async () => {
      const container = document.createElement('div');
      const noHistCanvas = new CanvasKit(container, { extensions: { history: false } });
      await noHistCanvas.ready;
      await noHistCanvas.add(makeRect('r1'));

      await noHistCanvas.update('r1', { x: 42 }, { track: false });

      expect(noHistCanvas.get('r1', true)?.getOptions().x).toBe(42);
    });
  });

  describe('dimensions', () => {
    it('width and height reflect the initial canvas size', () => {
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
    });

    it('resize updates width and height', () => {
      canvas.resize(1280, 720);
      expect(canvas.width).toBe(1280);
      expect(canvas.height).toBe(720);
    });
  });

  describe('dimensions before ready', () => {
    it('width and height return configured size before ready resolves', () => {
      const container = document.createElement('div');
      const pending = new CanvasKit(container, { width: 640, height: 480, extensions: {} });
      expect(pending.width).toBe(640);
      expect(pending.height).toBe(480);
    });
  });

  describe('element pointer events', () => {
    function getPointerHandler(
      canvas: CanvasKit,
      id: string,
      event: string,
    ): (() => void) | undefined {
      const el = canvas.get(id, true);
      if (!el) return undefined;
      const displayObj = el.getDisplayObject() as unknown as { on: ReturnType<typeof vi.fn> };
      const call = displayObj.on.mock.calls.find((args) => args[0] === event);
      return call?.[1] as (() => void) | undefined;
    }

    it('emits element:click when the element is clicked', async () => {
      await canvas.add(makeRect('r1'));
      const handler = getPointerHandler(canvas, 'r1', 'click');
      const listener = vi.fn();
      canvas.on('element:click', listener);
      expect(handler).toBeDefined();
      if (handler) handler();
      expect(listener).toHaveBeenCalledWith('r1');
    });

    it('emits element:dblclick when the element is double-clicked', async () => {
      await canvas.add(makeRect('r1'));
      const handler = getPointerHandler(canvas, 'r1', 'dblclick');
      const listener = vi.fn();
      canvas.on('element:dblclick', listener);
      expect(handler).toBeDefined();
      if (handler) handler();
      expect(listener).toHaveBeenCalledWith('r1');
    });

    it('emits element:pointerenter when the pointer enters the element', async () => {
      await canvas.add(makeRect('r1'));
      const handler = getPointerHandler(canvas, 'r1', 'pointerenter');
      const listener = vi.fn();
      canvas.on('element:pointerenter', listener);
      expect(handler).toBeDefined();
      if (handler) handler();
      expect(listener).toHaveBeenCalledWith('r1');
    });

    it('emits element:pointerleave when the pointer leaves the element', async () => {
      await canvas.add(makeRect('r1'));
      const handler = getPointerHandler(canvas, 'r1', 'pointerleave');
      const listener = vi.fn();
      canvas.on('element:pointerleave', listener);
      expect(handler).toBeDefined();
      if (handler) handler();
      expect(listener).toHaveBeenCalledWith('r1');
    });

    it('fires pointer events for non-selectable elements', async () => {
      const el = Shape.create(Shape.Rectangle, {
        id: 'ns1',
        width: 100,
        height: 80,
        selectable: false,
      });
      await canvas.add(el);
      const handler = getPointerHandler(canvas, 'ns1', 'click');
      const listener = vi.fn();
      canvas.on('element:click', listener);
      expect(handler).toBeDefined();
      if (handler) handler();
      expect(listener).toHaveBeenCalledWith('ns1');
    });

    it('does not emit pointer events after the element is removed', async () => {
      await canvas.add(makeRect('r1'));
      const el = canvas.get('r1', true);
      expect(el).toBeDefined();
      if (!el) return;
      const displayObj = el.getDisplayObject() as unknown as { off: ReturnType<typeof vi.fn> };

      await canvas.remove('r1');

      const offCalls = displayObj.off.mock.calls.map((args) => args[0] as string);
      expect(offCalls).toContain('click');
      expect(offCalls).toContain('dblclick');
      expect(offCalls).toContain('pointerenter');
      expect(offCalls).toContain('pointerleave');
    });
  });
});
