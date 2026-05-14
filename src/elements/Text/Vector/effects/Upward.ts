import { createLinearScaleEffect } from '@/elements/Text/Vector/effectBuilders';
import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Bottom flat, short→tall left→right (bottom-fixed anchor).
registerMeshEffect('Upward', createLinearScaleEffect(1, 'up'));
