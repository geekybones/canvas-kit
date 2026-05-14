import type { BaseOptions } from '@/core/BaseOptions';
import type { HandlePosition } from '@/core/Transform';
import type { ResizeAxes, StartState } from '@/extensions/interaction/types';

export const TRANSFORM_AXES: Partial<Record<HandlePosition, ResizeAxes>> = {
  tl: { xDir: -1, yDir: -1, proportional: true },
  tc: { xDir: 0, yDir: -1 },
  lc: { xDir: -1, yDir: 0 },
  rc: { xDir: 1, yDir: 0 },
  bl: { xDir: -1, yDir: 1 },
  bc: { xDir: 0, yDir: 1 },
  br: { xDir: 1, yDir: 1, proportional: true },
  tr: { xDir: 1, yDir: -1 },
};

export function createResizeStartState(
  options: BaseOptions & {
    fontSize?: number;
    width?: number;
    height?: number;
    radius?: number;
    strokeWidth?: number;
  },
): StartState {
  return {
    x: options.x ?? 0,
    y: options.y ?? 0,
    scaleX: options.scaleX ?? 1,
    scaleY: options.scaleY ?? 1,
    fontSize: options.fontSize,
    width: options.width,
    height: options.height,
    radius: options.radius,
    strokeWidth: options.strokeWidth,
  };
}

export function resolveResizeAnchor(
  axes: { xDir: -1 | 0 | 1; yDir: -1 | 0 | 1 },
  rect: { x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  return {
    x: axes.xDir < 0 ? rect.x + rect.width : axes.xDir > 0 ? rect.x : rect.x + rect.width / 2,
    y: axes.yDir < 0 ? rect.y + rect.height : axes.yDir > 0 ? rect.y : rect.y + rect.height / 2,
  };
}

export function resolveResizeScale(params: {
  axes: { xDir: -1 | 0 | 1; yDir: -1 | 0 | 1; proportional?: true };
  dx: number;
  dy: number;
  width: number;
  height: number;
}): { sx: number; sy: number } {
  const { axes, dx, dy, width, height } = params;

  if (axes.proportional) {
    const diagX = axes.xDir * width;
    const diagY = axes.yDir * height;
    const diagLen = Math.sqrt(diagX * diagX + diagY * diagY);
    const proj = dx * (diagX / diagLen) + dy * (diagY / diagLen);
    const minScale = 10 / Math.max(width, height);
    const scale = Math.max(minScale, (diagLen + proj) / diagLen);
    return { sx: scale, sy: scale };
  }

  const newW = Math.max(10, width + axes.xDir * dx);
  const newH = Math.max(10, height + axes.yDir * dy);
  return {
    sx: axes.xDir !== 0 ? newW / width : 1,
    sy: axes.yDir !== 0 ? newH / height : 1,
  };
}
