import { createLinearScaleEffect } from '@/elements/Text/Vector/effectBuilders';
import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Top flat, tall→short left→right (top-fixed anchor).
registerMeshEffect('Downward', createLinearScaleEffect(0, 'down'));
