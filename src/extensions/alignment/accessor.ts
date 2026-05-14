import type { AlignmentManager } from '@/extensions/alignment/AlignmentManager';
import type { AlignmentAccessor } from '@/extensions/alignment/types';

export function createAlignmentAccessor(
  getManager: () => AlignmentManager | undefined,
): AlignmentAccessor {
  return {
    align: (mode, ids) => getManager()?.align(mode, ids) ?? Promise.resolve(),
  };
}
