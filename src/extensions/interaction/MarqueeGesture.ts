import type { Container, FederatedPointerEvent } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type { CanvasContext } from '@/core/CanvasContext';
import { getElementWorldBounds } from '@/core/canvasBounds';
import type { CameraManager } from '@/extensions/camera/CameraManager';
import type { InteractionTheme } from '@/extensions/interaction/types';

const DEFAULT_FILL_COLOR: number | string = 0x4285f4;
const DEFAULT_FILL_ALPHA = 0.1;
const DEFAULT_STROKE_COLOR: number | string = 0x4285f4;
const DEFAULT_STROKE_WIDTH = 1;
const DEFAULT_STROKE_ALPHA = 0.8;

export type MarqueeContext = {
  ctx: CanvasContext;
  overlayLayer: Container;
  getCameraManager(): CameraManager | undefined;
  setSelection(ids: readonly string[] | null): void;
  theme?: InteractionTheme['marquee'];
};

function rafThrottle<T>(handler: (event: T) => void): (event: T) => void {
  let pending: T | null = null;
  let rafId: number | undefined;
  return (event: T) => {
    pending = event;
    if (rafId !== undefined) return;
    rafId = requestAnimationFrame(() => {
      rafId = undefined;
      if (pending !== null) {
        handler(pending);
        pending = null;
      }
    });
  };
}

export function startMarqueeSelection(
  ctx: MarqueeContext,
  startEvent: FederatedPointerEvent,
): () => void {
  const stage = ctx.ctx.app.getPixiApp().stage;
  const startX = startEvent.globalX;
  const startY = startEvent.globalY;
  const theme = ctx.theme ?? {};

  const fillColor = theme.fillColor ?? DEFAULT_FILL_COLOR;
  const fillAlpha = theme.fillAlpha ?? DEFAULT_FILL_ALPHA;
  const strokeColor = theme.strokeColor ?? DEFAULT_STROKE_COLOR;
  const strokeWidth = theme.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const strokeAlpha = theme.strokeAlpha ?? DEFAULT_STROKE_ALPHA;

  // Snapshot world bounds for all eligible elements once at drag-start so that
  // onUp does no getBounds() traversals — the same pattern used in startElementDrag.
  type Rect = { x: number; y: number; width: number; height: number };
  const elementBounds = new Map<string, Rect>();
  for (const [id, el] of ctx.ctx.registry.getAll()) {
    const opts = el.getOptions();
    if (opts.selectable === false || opts.visible === false) continue;
    const b = getElementWorldBounds(ctx.ctx, el);
    elementBounds.set(id, { x: b.x, y: b.y, width: b.width, height: b.height });
  }

  const marquee = new Graphics();
  marquee.eventMode = 'none';
  ctx.overlayLayer.addChild(marquee);

  let currentX = startX;
  let currentY = startY;

  function drawMarquee(): void {
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);
    marquee.clear();
    if (w < 1 || h < 1) return;
    marquee.rect(x, y, w, h);
    marquee.fill({ color: fillColor, alpha: fillAlpha });
    marquee.stroke({ color: strokeColor, width: strokeWidth, alpha: strokeAlpha });
  }

  const onMove = rafThrottle((e: FederatedPointerEvent) => {
    currentX = e.globalX;
    currentY = e.globalY;
    drawMarquee();
  });

  const cleanup = () => {
    stage.off('pointermove', onMove);
    stage.off('pointerup', onUp);
    stage.off('pointerupoutside', onUp);
    if (!marquee.destroyed) marquee.destroy();
  };

  const onUp = () => {
    cleanup();

    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    if (w < 4 && h < 4) {
      ctx.setSelection(null);
      return;
    }

    const screenX = Math.min(startX, currentX);
    const screenY = Math.min(startY, currentY);
    const camera = ctx.getCameraManager();
    const topLeft = camera?.screenToWorld(screenX, screenY) ?? { x: screenX, y: screenY };
    const bottomRight = camera?.screenToWorld(screenX + w, screenY + h) ?? {
      x: screenX + w,
      y: screenY + h,
    };

    const wx = topLeft.x;
    const wy = topLeft.y;
    const ww = bottomRight.x - topLeft.x;
    const wh = bottomRight.y - topLeft.y;

    const selected: string[] = [];
    for (const [id, b] of elementBounds) {
      if (wx < b.x + b.width && wx + ww > b.x && wy < b.y + b.height && wy + wh > b.y) {
        selected.push(id);
      }
    }

    ctx.setSelection(selected.length > 0 ? selected : null);
  };

  stage.on('pointermove', onMove);
  stage.on('pointerup', onUp);
  stage.on('pointerupoutside', onUp);

  return cleanup;
}
