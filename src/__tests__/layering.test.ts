import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { Shape } from '@/elements/Shape';
import { LayerManager } from '@/extensions/layering/LayerManager';

function makeRect(id: string) {
  return Shape.create(Shape.Rectangle, {
    id,
    type: 'shape:rectangle',
    width: 50,
    height: 50,
  });
}

function makeCtx(elements: Map<string, BaseElement<BaseOptions>>): CanvasContext {
  const listeners: Record<string, Array<(id: string) => void>> = {};
  const off = vi.fn((event: string, cb: (id: string) => void) => {
    listeners[event] = (listeners[event] ?? []).filter((listener) => listener !== cb);
  });
  return {
    app: { getPixiApp: vi.fn() } as never,
    events: {
      emit: vi.fn(),
      on: vi.fn((event: string, cb: (id: string) => void) => {
        const group = listeners[event] ?? [];
        group.push(cb);
        listeners[event] = group;
      }),
      off,
      _trigger: (event: string, id: string) => {
        listeners[event]?.forEach((cb) => {
          cb(id);
        });
      },
    } as never,
    registry: { getAll: () => elements, get: (id: string) => elements.get(id) } as never,
    options: {},
    stage: {} as never,
    getElement: vi.fn(),
    addElement: vi.fn(),
    removeElement: vi.fn(),
    getExtension: vi.fn(),
  } as unknown as CanvasContext;
}

describe('LayerManager', () => {
  let layerMgr: LayerManager;
  let elements: Map<string, BaseElement<BaseOptions>>;
  let ctx: CanvasContext;

  beforeEach(() => {
    elements = new Map();
    ctx = makeCtx(elements);
    layerMgr = new LayerManager();
    layerMgr.init(ctx);
  });

  function addEl(id: string) {
    const el = makeRect(id);
    el.init();
    elements.set(id, el);
    (ctx.events as unknown as { _trigger(e: string, id: string): void })._trigger(
      'element:added',
      id,
    );
    return el;
  }

  it('assigns ascending zIndex on element:added', () => {
    const a = addEl('a');
    const b = addEl('b');
    const c = addEl('c');
    expect(a.getDisplayObject().zIndex).toBe(1);
    expect(b.getDisplayObject().zIndex).toBe(2);
    expect(c.getDisplayObject().zIndex).toBe(3);
  });

  it('preserves explicit zIndex on added elements', () => {
    const fixed = makeRect('fixed');
    fixed.init();
    fixed.setZIndex(9);
    elements.set('fixed', fixed);
    (ctx.events as unknown as { _trigger(e: string, id: string): void })._trigger(
      'element:added',
      'fixed',
    );

    expect(fixed.getDisplayObject().zIndex).toBe(9);
  });

  it('bringToFront moves element to top', () => {
    const a = addEl('a');
    const b = addEl('b');
    const c = addEl('c');

    layerMgr.bringToFront('a');

    expect(a.getDisplayObject().zIndex).toBeGreaterThan(b.getDisplayObject().zIndex);
    expect(a.getDisplayObject().zIndex).toBeGreaterThan(c.getDisplayObject().zIndex);
  });

  it('sendToBack moves element to bottom', () => {
    const a = addEl('a');
    const b = addEl('b');
    const c = addEl('c');

    layerMgr.sendToBack('c');

    expect(c.getDisplayObject().zIndex).toBeLessThan(a.getDisplayObject().zIndex);
    expect(c.getDisplayObject().zIndex).toBeLessThan(b.getDisplayObject().zIndex);
  });

  it('bringForward swaps with next element', () => {
    const a = addEl('a');
    const b = addEl('b');
    const aZ = a.getDisplayObject().zIndex;
    const bZ = b.getDisplayObject().zIndex;

    layerMgr.bringForward('a');

    expect(a.getDisplayObject().zIndex).toBe(bZ);
    expect(b.getDisplayObject().zIndex).toBe(aZ);
  });

  it('sendBackward swaps with previous element', () => {
    const a = addEl('a');
    const b = addEl('b');
    const aZ = a.getDisplayObject().zIndex;
    const bZ = b.getDisplayObject().zIndex;

    layerMgr.sendBackward('b');

    expect(b.getDisplayObject().zIndex).toBe(aZ);
    expect(a.getDisplayObject().zIndex).toBe(bZ);
  });

  it('normalizeZIndex reassigns 1..n preserving visual order', () => {
    const a = addEl('a');
    const b = addEl('b');
    const c = addEl('c');

    // Mess up z-indexes
    a.getDisplayObject().zIndex = 10;
    b.getDisplayObject().zIndex = 5;
    c.getDisplayObject().zIndex = 20;

    layerMgr.normalizeZIndex();

    const zValues = [a, b, c].map((el) => el.getDisplayObject().zIndex).sort((x, y) => x - y);
    expect(zValues).toEqual([1, 2, 3]);
    // Order should be preserved: b(5) < a(10) < c(20)
    expect(b.getDisplayObject().zIndex).toBeLessThan(a.getDisplayObject().zIndex);
    expect(a.getDisplayObject().zIndex).toBeLessThan(c.getDisplayObject().zIndex);
  });

  it('bringToFront with array preserves relative group order', () => {
    addEl('a');
    const b = addEl('b');
    const d = addEl('d');
    const c = addEl('c');

    layerMgr.bringToFront(['b', 'c']);

    // Both b and c should be above d (non-selected)
    expect(b.getDisplayObject().zIndex).toBeGreaterThan(d.getDisplayObject().zIndex);
    expect(c.getDisplayObject().zIndex).toBeGreaterThan(d.getDisplayObject().zIndex);
  });

  it('layer changes persist through later element updates', () => {
    const a = addEl('a');
    const b = addEl('b');

    layerMgr.sendToBack('b');
    b.update({ x: 120 });

    expect(b.getDisplayObject().zIndex).toBeLessThan(a.getDisplayObject().zIndex);
    expect(b.getOptions().zIndex).toBe(b.getDisplayObject().zIndex);
  });

  it('destroy unsubscribes the element:added listener', () => {
    const offSpy = vi.spyOn(ctx.events, 'off');

    layerMgr.destroy();

    expect(offSpy).toHaveBeenCalled();
  });
});
