import type { MeshEffect } from '@/elements/Text/types';
import { createCenterSinusoidalScaleEffect } from '@/elements/Text/Vector/effectBuilders';

// Edges full height, centre squeezed (center-fixed so squeeze is symmetric).
// direction:'down' turns Pinch into Bulge.
export const Pinch: MeshEffect = {
  fn: createCenterSinusoidalScaleEffect('squeeze'),
  columns: 250,
};
