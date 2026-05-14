import type { Container } from 'pixi.js';
import { Rectangle } from 'pixi.js';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';

export type HandlePosition = 'tl' | 'tc' | 'tr' | 'lc' | 'rc' | 'bl' | 'bc' | 'br' | 'top' | 'btop';

export interface HandlePoint {
  x: number;
  y: number;
}

function getBoundingRect(container: Container): Rectangle {
  const bounds = container.getBounds();
  return new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
}

function getCombinedBoundingRect(elements: ReadonlyArray<BaseElement<BaseOptions>>): Rectangle {
  if (elements.length === 0) return new Rectangle(0, 0, 0, 0);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const el of elements) {
    const r = getBoundingRect(el.getDisplayObject());
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y + r.height > maxY) maxY = r.y + r.height;
  }

  return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}

function getHandlePositions(rect: Rectangle, handleSize = 20): Record<HandlePosition, HandlePoint> {
  const { x, y, width: w, height: h } = rect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  // Keep a fixed 12px gap between the tc handle top edge and the rotate handle bottom edge.
  const topOffset = handleSize + 12;

  return {
    tl: { x, y },
    tc: { x: cx, y },
    tr: { x: x + w, y },
    lc: { x, y: cy },
    rc: { x: x + w, y: cy },
    bl: { x, y: y + h },
    bc: { x: cx, y: y + h },
    br: { x: x + w, y: y + h },
    top: { x: cx, y: y - topOffset },
    btop: { x: cx, y: y - topOffset / 2 },
  };
}

export const Transform = {
  getBoundingRect,
  getCombinedBoundingRect,
  getHandlePositions,
};
