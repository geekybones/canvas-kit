import type { CanvasContext } from '@/core/CanvasContext';
import type { Extension } from '@/extensions/Extension';
import { createPerformanceAccessor } from '@/extensions/performance/accessor';
import { CacheManager } from '@/extensions/performance/CacheManager';

export class PerformanceManager implements Extension {
  readonly name = 'performance';
  accessors?: { performance: ReturnType<typeof createPerformanceAccessor> };
  readonly cacheManager = new CacheManager();

  init(ctx: CanvasContext): void {
    this.accessors = {
      performance: createPerformanceAccessor(() =>
        ctx.getExtension<PerformanceManager>('performance'),
      ),
    };
  }

  destroy(): void {
    void this.cacheManager.clear();
  }
}
