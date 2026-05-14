import { registerMeshEffect } from '@/elements/Text/Vector/registry';

registerMeshEffect('Curved', (t, ctx) => {
  const i = ctx.intensity / 100;
  const arc = (Math.PI / 2) * i;
  const radius = arc > 0.001 ? ctx.textureWidth / (2 * Math.sin(arc / 2)) : ctx.textureWidth * 100;
  const startAngle = -Math.PI / 2 - arc / 2;
  const angle = startAngle + t * arc;
  const midY = radius;
  const arcY = radius * Math.sin(angle) + midY - ctx.textureHeight / 2;
  const dy = ctx.direction === 'down' ? -arcY : arcY;
  return { dy };
});
