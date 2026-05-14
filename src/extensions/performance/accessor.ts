import type { PerformanceManager } from '@/extensions/performance/PerformanceManager';
import type { PerformanceAccessor } from '@/extensions/performance/types';

export function createPerformanceAccessor(
  getManager: () => PerformanceManager | undefined,
): PerformanceAccessor {
  return {
    markDirty: (id) => getManager()?.dirtyTracker.markDirty(id),
    isDirty: (id) => getManager()?.dirtyTracker.isDirty(id) ?? false,
    flushDirty: () => getManager()?.dirtyTracker.flush() ?? [],
    clearDirty: () => getManager()?.dirtyTracker.clear(),

    retainAsset: (url) => getManager()?.cacheManager.retain(url),
    releaseAsset: async (url) => {
      const perf = getManager();
      if (!perf) return;
      await perf.cacheManager.release(url);
    },
    clearAssets: async () => {
      const perf = getManager();
      if (!perf) return;
      await perf.cacheManager.clear();
    },
  };
}
