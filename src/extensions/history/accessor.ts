import type { HistoryManager } from '@/extensions/history/HistoryManager';
import type { HistoryAccessor } from '@/extensions/history/types';

export function createHistoryAccessor(
  getManager: () => HistoryManager | undefined,
): HistoryAccessor {
  return {
    undo: async () => {
      await getManager()?.undo();
    },
    redo: async () => {
      await getManager()?.redo();
    },
    canUndo: () => getManager()?.canUndo() ?? false,
    canRedo: () => getManager()?.canRedo() ?? false,
    setClipboard: (items) => {
      getManager()?.setClipboard(items);
    },
    getClipboard: () => getManager()?.getClipboard() ?? [],
  };
}
