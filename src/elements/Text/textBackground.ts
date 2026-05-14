import { Graphics } from 'pixi.js';

import type { BaseTextOptions } from '@/elements/Text/types';

export function createTextBackground(
  options: Pick<BaseTextOptions, 'background' | 'backgroundAlpha' | 'backgroundPadding'>,
  fontSize: number,
  bounds: { x: number; y: number; width: number; height: number },
): Graphics | null {
  const { background, backgroundAlpha = 1, backgroundPadding } = options;

  if (background === undefined || backgroundAlpha <= 0) {
    return null;
  }

  if (bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  const resolvedPadding = Math.max(0, backgroundPadding ?? 6);
  const padX = resolvedPadding;
  const padY = resolvedPadding;
  const radius = Math.max(3, fontSize * 0.12);
  const backgroundNode = new Graphics();

  backgroundNode
    .roundRect(
      bounds.x - padX,
      bounds.y - padY,
      bounds.width + padX * 2,
      bounds.height + padY * 2,
      radius,
    )
    .fill({
      color: background,
      alpha: Math.max(0, Math.min(1, backgroundAlpha)),
    });

  return backgroundNode;
}
