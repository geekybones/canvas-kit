import type { MeshEffect } from '@/elements/Text/types';
import { createSinusoidalScaleEffect } from '@/elements/Text/Vector/effectBuilders';

// Top edge flat, bottom centre raised (chars shorter at centre, tops aligned).
export const Bridge: MeshEffect = {
  fn: createSinusoidalScaleEffect({ up: 0, down: 1 }),
  columns: 100,
};
