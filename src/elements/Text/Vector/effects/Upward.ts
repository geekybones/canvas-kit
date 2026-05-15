import type { MeshEffect } from '@/elements/Text/types';
import { createLinearScaleEffect } from '@/elements/Text/Vector/effectBuilders';

// Bottom flat, short→tall left→right (bottom-fixed anchor).
export const Upward: MeshEffect = {
  fn: createLinearScaleEffect(1, 'up'),
  columns: 100,
};
