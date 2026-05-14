import { registerMeshEffect } from '@/elements/Text/Vector/registry';

registerMeshEffect('Arch', (t, ctx) => {
  const i = ctx.intensity / 100;
  const sagitta = ctx.textureHeight * 2.5 * i;

  if (sagitta < 0.5) return { dy: 0 };

  const hw = ctx.textureWidth / 2;
  const radius = (hw * hw + sagitta * sagitta) / (2 * sagitta);
  const halfAngle = Math.asin(Math.min(hw / radius, 1));
  const angle = halfAngle * (2 * t - 1);
  const cy = radius - sagitta;
  const arcY = cy - radius * Math.cos(angle);
  const dy = ctx.direction === 'down' ? -arcY : arcY;

  return { dy };
});
