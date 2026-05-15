import type { MeshEffect } from '@/elements/Text/types';
import { createSinusoidalScaleEffect } from '@/elements/Text/Vector/effectBuilders';

// Bottom edge flat, top centre dips (chars shorter at centre, bottoms aligned).
export const Valley: MeshEffect = {
  fn: createSinusoidalScaleEffect({ up: 1, down: 0 }),
  columns: 160,
};
