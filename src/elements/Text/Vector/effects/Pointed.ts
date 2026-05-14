import { registerMeshEffect } from '@/elements/Text/Vector/registry';

// Bottom edge flat, centre full height, corners shorter with a sharper
// roof-like taper instead of a rounded arch.
registerMeshEffect('Pointed', (t, ctx) => {
  const i = ctx.intensity / 100;
  const centerPeak = 1 - Math.abs(2 * t - 1);
  const scaleY = Math.max(0.1, 1 - i * (1 - centerPeak));
  const anchorY = ctx.direction === 'down' ? 0 : 1;

  return { dy: 0, scaleY, anchorY };
});
