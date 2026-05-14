import type { LayerManager } from '@/extensions/layering/LayerManager';
import type { LayeringAccessor } from '@/extensions/layering/types';

export function createLayeringAccessor(
  getManager: () => LayerManager | undefined,
): LayeringAccessor {
  const call = <Args extends unknown[]>(invoke: (manager: LayerManager, ...args: Args) => void) => {
    return (...args: Args): void => {
      const manager = getManager();
      if (!manager) return;
      invoke(manager, ...args);
    };
  };

  return {
    bringToFront: call((manager, idOrIds) => manager.bringToFront(idOrIds)),
    sendToBack: call((manager, idOrIds) => manager.sendToBack(idOrIds)),
    bringForward: call((manager, id) => manager.bringForward(id)),
    sendBackward: call((manager, id) => manager.sendBackward(id)),
    normalizeZIndex: call((manager) => manager.normalizeZIndex()),
  };
}
