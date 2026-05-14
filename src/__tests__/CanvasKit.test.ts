import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasKit } from '@/canvas/CanvasKit';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import { Shape } from '@/elements/Shape';
import type { RectangleOptions } from '@/elements/Shape/Rectangle/RectangleOptions';

function makeRect(id: string, overrides: Partial<RectangleOptions> = {}): BaseElement<BaseOptions> {
  return Shape.create(Shape.Rectangle, {
    id,
    type: 'shape:rectangle',
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
});
