import { Assets } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import type { CanvasContext } from '@/core/CanvasContext';
import { CanvasEventBus } from '@/core/Events';
import { PerformanceManager } from '@/extensions/performance/PerformanceManager';

function makeCtx() {
  const events = new CanvasEventBus();
  const app = {
    getPixiApp: () => ({
      ticker: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    }),
  };

  const ctx = {
    app,
    events,
    registry: {
      get: vi.fn(),
      getAll: vi.fn(() => new Map()),
    },
    options: {},
    stage: {} as never,
    getElement: vi.fn(),
    addElement: vi.fn(),
    removeElement: vi.fn(),
    getExtension: vi.fn(),
    hasExtension: vi.fn(),
  } as unknown as CanvasContext;

  return { ctx, events };
}

describe('PerformanceManager', () => {
  it('keeps dirty ids until flushed explicitly', () => {
    const { ctx, events } = makeCtx();
    const manager = new PerformanceManager();
    manager.init(ctx);

    events.emit('element:updated', 'shape-1');
    expect(manager.dirtyTracker.isDirty('shape-1')).toBe(true);
    expect(manager.dirtyTracker.flush()).toEqual(['shape-1']);
    expect(manager.dirtyTracker.isDirty('shape-1')).toBe(false);
  });

  it('retains and releases assets by reference count', async () => {
    const unloadSpy = vi.mocked(Assets.unload);
    unloadSpy.mockClear();

    const manager = new PerformanceManager();
    manager.cacheManager.retain('/asset.png');
    manager.cacheManager.retain('/asset.png');

    await manager.cacheManager.release('/asset.png');
    expect(unloadSpy).not.toHaveBeenCalled();

    await manager.cacheManager.release('/asset.png');
    expect(unloadSpy).toHaveBeenCalledWith('/asset.png');
  });

  it('clear unloads every tracked asset', async () => {
    const unloadSpy = vi.mocked(Assets.unload);
    unloadSpy.mockClear();

    const manager = new PerformanceManager();
    manager.cacheManager.retain('/a.png');
    manager.cacheManager.retain('/b.png');

    await manager.cacheManager.clear();

    expect(unloadSpy).toHaveBeenCalledWith('/a.png');
    expect(unloadSpy).toHaveBeenCalledWith('/b.png');
  });

  it('destroy unsubscribes listeners and clears state', async () => {
    const { ctx, events } = makeCtx();
    const offSpy = vi.spyOn(events, 'off');
    const manager = new PerformanceManager();
    manager.init(ctx);

    events.emit('element:updated', 'shape-1');
    manager.cacheManager.retain('/asset.png');

    manager.destroy();

    expect(offSpy).toHaveBeenCalled();
    expect(manager.dirtyTracker.flush()).toEqual([]);
  });
});
