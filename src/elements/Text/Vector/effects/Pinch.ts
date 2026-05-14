import { createCenterSinusoidalScaleEffect } from '@/elements/Text/Vector/effectBuilders';
import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Edges full height, centre squeezed (center-fixed so squeeze is symmetric).
// direction:'down' turns Pinch into Bulge.
registerMeshEffect('Pinch', createCenterSinusoidalScaleEffect('squeeze'), { columns: 250 });
