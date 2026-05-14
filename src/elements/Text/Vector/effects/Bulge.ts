import { createCenterSinusoidalScaleEffect } from '@/elements/Text/Vector/effectBuilders';
import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Edges full height, centre expanded (center-fixed so bulge is symmetric).
// direction:'down' turns Bulge into Pinch.
registerMeshEffect('Bulge', createCenterSinusoidalScaleEffect('expand'));
