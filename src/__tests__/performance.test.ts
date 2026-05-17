import { Assets } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import type { CanvasContext } from '@/core/CanvasContext';
import { PerformanceManager } from '@/extensions/performance/PerformanceManager';

describe('PerformanceManager', () => {
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

  it('destroy clears all tracked assets', async () => {
    const unloadSpy = vi.mocked(Assets.unload);
    unloadSpy.mockClear();

    const ctx = {} as unknown as CanvasContext;
    const manager = new PerformanceManager();
    manager.init(ctx);
    manager.cacheManager.retain('/asset.png');

    manager.destroy();

    expect(unloadSpy).toHaveBeenCalledWith('/asset.png');
  });
});
