import type { MeshEffect } from '@/elements/Text/types';
import { createCenterSinusoidalScaleEffect } from '@/elements/Text/Vector/effectBuilders';

// Edges full height, centre expanded (center-fixed so bulge is symmetric).
// direction:'down' turns Bulge into Pinch.
export const Bulge: MeshEffect = {
  fn: createCenterSinusoidalScaleEffect('expand'),
  columns: 100,
};
