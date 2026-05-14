import type { CanvasContext } from '@/core/CanvasContext';
import type { Extension } from '@/extensions/Extension';
import { createPerformanceAccessor } from '@/extensions/performance/accessor';
import { CacheManager } from '@/extensions/performance/CacheManager';
import { DirtyTracker } from '@/extensions/performance/DirtyTracker';

export class PerformanceManager implements Extension {
  readonly name = 'performance';
  accessors?: { performance: ReturnType<typeof createPerformanceAccessor> };
  readonly dirtyTracker = new DirtyTracker();
  readonly cacheManager = new CacheManager();
  private cleanupFns: Array<() => void> = [];

  init(ctx: CanvasContext): void {
    this.accessors = {
      performance: createPerformanceAccessor(() =>
        ctx.getExtension<PerformanceManager>('performance'),
      ),
    };

    const onElementUpdated = (id: string) => {
      this.dirtyTracker.markDirty(id);
    };
    ctx.events.on('element:updated', onElementUpdated);
    this.cleanupFns.push(() => ctx.events.off('element:updated', onElementUpdated));
  }

  destroy(): void {
    for (const cleanup of this.cleanupFns) cleanup();
    this.cleanupFns = [];
    this.dirtyTracker.clear();
    void this.cacheManager.clear();
  }
}
