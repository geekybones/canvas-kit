import type { MeshEffectFunction } from '@/elements/Text/types';

type AnchorDirection = {
  up: 0 | 1;
  down: 0 | 1;
};

export function createSinusoidalScaleEffect(anchorY: AnchorDirection): MeshEffectFunction {
  return (t, ctx) => {
    const i = ctx.intensity / 100;
    const scaleY = Math.max(0.1, 1 - i * Math.sin(t * Math.PI));

    return {
      dy: 0,
      scaleY,
      anchorY: ctx.direction === 'down' ? anchorY.down : anchorY.up,
    };
  };
}

export function createLinearScaleEffect(
  anchorY: 0 | 0.5 | 1,
  directionBias: 'up' | 'down',
): MeshEffectFunction {
  return (t, ctx) => {
    const i = ctx.intensity / 100;
    const tEff = ctx.direction === directionBias ? 1 - t : t;
    const scaleY = Math.max(0.1, 1 - i * tEff);

    return { dy: 0, scaleY, anchorY };
  };
}

export function createCenterSinusoidalScaleEffect(mode: 'expand' | 'squeeze'): MeshEffectFunction {
  return (t, ctx) => {
    const i = ctx.intensity / 100;
    const wave = Math.sin(t * Math.PI);
    const squeeze = Math.max(0.1, 1 - i * wave);
    const expand = 1 + i * wave;
    const isExpanded =
      (mode === 'expand' && ctx.direction !== 'down') ||
      (mode === 'squeeze' && ctx.direction === 'down');

    return {
      dy: 0,
      scaleY: isExpanded ? expand : squeeze,
      anchorY: 0.5,
    };
  };
}
