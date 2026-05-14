import type { ContextMenuManager } from '@/extensions/contextMenu/ContextMenuManager';
import type { ContextMenuAccessor } from '@/extensions/contextMenu/types';

export function createContextMenuAccessor(
  getManager: () => ContextMenuManager | undefined,
): ContextMenuAccessor {
  return {
    open: (id, options) => {
      getManager()?.open(id, options);
    },
    close: () => {
      getManager()?.close();
    },
  };
}
