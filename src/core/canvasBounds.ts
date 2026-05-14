import type { Bounds } from 'pixi.js';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { CameraManager } from '@/extensions/camera/CameraManager';

export function isCanvasConstraintEnabled(ctx: CanvasContext): boolean {
  return ctx.options.constrainToCanvas === true;
}

export function getCanvasWorldBounds(ctx: CanvasContext): Bounds {
  const pixi = ctx.app.getPixiApp();
  const camera = ctx.getExtension<CameraManager>('camera');

  if (!camera) {
    return {
      x: 0,
      y: 0,
      width: pixi.screen.width,
      height: pixi.screen.height,
    } as Bounds;
  }

  const topLeft = camera.screenToWorld(0, 0);
  const bottomRight = camera.screenToWorld(pixi.screen.width, pixi.screen.height);

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  } as Bounds;
}

export function screenBoundsToWorldBounds(ctx: CanvasContext, bounds: Bounds): Bounds {
  const camera = ctx.getExtension<CameraManager>('camera');

  if (!camera) {
    return bounds;
  }

  const topLeft = camera.screenToWorld(bounds.x, bounds.y);
  const bottomRight = camera.screenToWorld(bounds.x + bounds.width, bounds.y + bounds.height);

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  } as Bounds;
}

export function getElementWorldBounds(ctx: CanvasContext, el: BaseElement<BaseOptions>): Bounds {
  return screenBoundsToWorldBounds(ctx, el.getDisplayObject().getBounds());
}

export function combineBounds(boundsList: readonly Bounds[]): Bounds {
  const [first, ...rest] = boundsList;

  if (!first) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    } as Bounds;
  }

  let minX = first.x;
  let minY = first.y;
  let maxX = first.x + first.width;
  let maxY = first.y + first.height;

  for (const bounds of rest) {
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  } as Bounds;
}

export function getCombinedElementWorldBounds(
  ctx: CanvasContext,
  elements: readonly BaseElement<BaseOptions>[],
): Bounds {
  return combineBounds(elements.map((el) => getElementWorldBounds(ctx, el)));
}

export function clampBoundsDelta(
  bounds: Bounds,
  dx: number,
  dy: number,
  limits: Bounds,
): { dx: number; dy: number } {
  const nextLeft = bounds.x + dx;
  const nextTop = bounds.y + dy;
  const nextRight = nextLeft + bounds.width;
  const nextBottom = nextTop + bounds.height;
  const limitRight = limits.x + limits.width;
  const limitBottom = limits.y + limits.height;

  let clampedDx = dx;
  let clampedDy = dy;

  if (bounds.width >= limits.width) {
    clampedDx = limits.x - bounds.x;
  } else {
    if (nextLeft < limits.x) {
      clampedDx += limits.x - nextLeft;
    }
    if (nextRight > limitRight) {
      clampedDx -= nextRight - limitRight;
    }
  }

  if (bounds.height >= limits.height) {
    clampedDy = limits.y - bounds.y;
  } else {
    if (nextTop < limits.y) {
      clampedDy += limits.y - nextTop;
    }
    if (nextBottom > limitBottom) {
      clampedDy -= nextBottom - limitBottom;
    }
  }

  return { dx: clampedDx, dy: clampedDy };
}

export async function constrainElementToCanvas(
  ctx: CanvasContext,
  el: BaseElement<BaseOptions>,
): Promise<boolean> {
  if (!isCanvasConstraintEnabled(ctx)) {
    return false;
  }

  const bounds = getElementWorldBounds(ctx, el);
  const limits = getCanvasWorldBounds(ctx);
  const { dx, dy } = clampBoundsDelta(bounds, 0, 0, limits);

  if (dx === 0 && dy === 0) {
    return false;
  }

  const opts = el.getOptions();
  await el.update({
    x: (opts.x ?? 0) + dx,
    y: (opts.y ?? 0) + dy,
  } as Partial<BaseOptions>);

  return true;
}
