import { createSinusoidalScaleEffect } from '@/elements/Text/Vector/effectBuilders';
import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Top edge flat, bottom centre raised (chars shorter at centre, tops aligned).
registerMeshEffect('Bridge', createSinusoidalScaleEffect({ up: 0, down: 1 }));
