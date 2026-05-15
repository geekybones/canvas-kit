import type { MeshEffect } from '@/elements/Text/types';
import { createLinearScaleEffect } from '@/elements/Text/Vector/effectBuilders';

// Top flat, tall→short left→right (top-fixed anchor).
export const Downward: MeshEffect = {
  fn: createLinearScaleEffect(0, 'down'),
  columns: 100,
};
