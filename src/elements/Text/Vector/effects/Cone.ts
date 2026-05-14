import { createLinearScaleEffect } from '@/elements/Text/Vector/effectBuilders';
import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Centre-aligned, narrow on left expanding to full height on right.
registerMeshEffect('Cone', createLinearScaleEffect(0.5, 'up'));
