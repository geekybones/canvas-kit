import type { MeshEffect } from '@/elements/Text/types';
import { createLinearScaleEffect } from '@/elements/Text/Vector/effectBuilders';

// Centre-aligned, narrow on left expanding to full height on right.
export const Cone: MeshEffect = {
  fn: createLinearScaleEffect(0.5, 'up'),
  columns: 100,
};
