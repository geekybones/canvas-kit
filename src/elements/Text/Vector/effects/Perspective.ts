import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Centre stretched taller, edges compressed shorter, with a broad
// perspective-style taper across the whole word. Uses a pointed
// profile rather than a rounded bulge so the sides feel more geometric.
registerMeshEffect(
  'Perspective',
  (t, ctx) => {
    const i = ctx.intensity / 100;
    const centerWeight = 1 - Math.abs(2 * t - 1);
    const plateauWidth = 0.18;
    const pointedWeight = centerWeight >= 1 - plateauWidth ? 1 : centerWeight / (1 - plateauWidth);

    const compressedScale = Math.max(0.2, 1 - i * 0.55);
    const expandedScale = 1 + i * 0.75;
    const scaleY =
      ctx.direction === 'down'
        ? expandedScale + (compressedScale - expandedScale) * pointedWeight
        : compressedScale + (expandedScale - compressedScale) * pointedWeight;

    return { dy: 0, scaleY, anchorY: 0.5 };
  },
  { columns: 180 },
);
