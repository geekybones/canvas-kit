import { createSinusoidalScaleEffect } from '@/elements/Text/Vector/effectBuilders';
import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Bottom edge flat, top centre dips (chars shorter at centre, bottoms aligned).
registerMeshEffect('Valley', createSinusoidalScaleEffect({ up: 1, down: 0 }), { columns: 160 });
