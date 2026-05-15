import type { FederatedPointerEvent } from 'pixi.js';
import type { BaseOptions } from '@/core/BaseOptions';
import {
  clampBoundsDelta,
  getCanvasWorldBounds,
  getCombinedElementWorldBounds,
  getElementWorldBounds,
  isCanvasConstraintEnabled,
} from '@/core/canvasBounds';
import type { HandlePosition } from '@/core/Transform';
import { Transform } from '@/core/Transform';
import { captureElementOptions } from '@/extensions/interaction/InteractionSelectionState';
import {
  createResizeStartState,
  resolveResizeAnchor,
  resolveResizeScale,
  TRANSFORM_AXES,
} from '@/extensions/interaction/ResizeSession';
import { computeResizeUpdate } from '@/extensions/interaction/ResizeStrategy';
import type { InteractionGesturesContext, StartState } from '@/extensions/interaction/types';
import { BoundsIndex } from '@/extensions/snap/BoundsIndex';
import type { InternalSnapResult } from '@/extensions/snap/types';

// Wrap a pointermove handler in requestAnimationFrame so at most one frame of
// work is queued per display refresh, regardless of input device frequency.
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

export function startResize(
  ctx: InteractionGesturesContext,
  e: FederatedPointerEvent,
  pos: HandlePosition,
): () => void {
  const elements = ctx.getSelectedElements();
  if (!elements.length) return () => {};

  const axes = TRANSFORM_AXES[pos];
  if (!axes) return () => {};

  const startRect = Transform.getCombinedBoundingRect(elements);
  if (startRect.width === 0 || startRect.height === 0) return () => {};

  const camera = ctx.getCameraManager();
  const { x: axScreen, y: ayScreen } = resolveResizeAnchor(axes, startRect);
  const { x: ax, y: ay } = camera?.screenToWorld(axScreen, ayScreen) ?? {
    x: axScreen,
    y: ayScreen,
  };

  const startStates = new Map<string, StartState>();
  for (const el of elements) {
    startStates.set(
      el.getId(),
      createResizeStartState(
        el.getOptions() as BaseOptions & {
          fontSize?: number;
          width?: number;
          height?: number;
          radius?: number;
          strokeWidth?: number;
        },
      ),
    );
  }

  const startX = e.globalX;
  const startY = e.globalY;

  const processResize = (mv: FederatedPointerEvent) => {
    const dx = mv.globalX - startX;
    const dy = mv.globalY - startY;
    const { sx, sy } = resolveResizeScale({
      axes,
      dx,
      dy,
      width: startRect.width,
      height: startRect.height,
    });

    for (const el of elements) {
      const state = startStates.get(el.getId());
      if (!state) continue;
      void el.update(computeResizeUpdate(el.getType(), state, axes, sx, sy, ax, ay));
      ctx.ctx.events.emit('element:transforming', el.getId());
    }
    ctx.updateBoundingBox();
  };

  const onMove = rafThrottle(processResize);

  return attachStageDrag(ctx, onMove, () => {
    for (const el of elements) {
      ctx.ctx.events.emit('element:updated', el.getId());
    }
    ctx.recordGroupUpdate(elements, startStates, 'resize');
  });
}

export function startRotate(ctx: InteractionGesturesContext, e: FederatedPointerEvent): () => void {
  const elements = ctx.getSelectedElements();
  if (!elements.length) return () => {};

  const rect = Transform.getCombinedBoundingRect(elements);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  const startAngle = Math.atan2(e.globalY - cy, e.globalX - cx);
  const startRots = new Map<string, number>();
  for (const el of elements) {
    startRots.set(el.getId(), el.getOptions().rotationDeg ?? 0);
  }

  const processRotate = (mv: FederatedPointerEvent) => {
    const angle = Math.atan2(mv.globalY - cy, mv.globalX - cx);
    const deltaDeg = (angle - startAngle) * (180 / Math.PI);
    for (const el of elements) {
      void el.update({
        rotationDeg: (startRots.get(el.getId()) ?? 0) + deltaDeg,
      } as Partial<BaseOptions>);
      ctx.ctx.events.emit('element:transforming', el.getId());
    }
    ctx.updateBoundingBox();
  };

  const onMove = rafThrottle(processRotate);

  return attachStageDrag(ctx, onMove, () => {
    for (const el of elements) {
      ctx.ctx.events.emit('element:updated', el.getId());
    }
    ctx.recordGroupUpdate(
      elements,
      captureElementOptions(elements, (element) => ({
        rotationDeg: startRots.get(element.getId()) ?? 0,
      })),
      'rotate',
    );
  });
}

export function startElementDrag(
  ctx: InteractionGesturesContext,
  e: FederatedPointerEvent,
): () => void {
  const startX = e.globalX;
  const startY = e.globalY;
  const selectedElements = ctx.getSelectedElements();
  const startPositions = captureElementOptions(selectedElements);

  const camera = ctx.getCameraManager();
  const snap = ctx.getSnapManager();

  const startBounds = snap ? getCombinedElementWorldBounds(ctx.ctx, selectedElements) : null;
  const startConstraintBounds = isCanvasConstraintEnabled(ctx.ctx)
    ? getCombinedElementWorldBounds(ctx.ctx, selectedElements)
    : null;

  const excludeIds = new Set(ctx.getSelectedIds());

  // Capture element bounds once at drag-start instead of per-frame getBounds() calls.
  let boundsIndex: BoundsIndex | undefined;
  if (snap) {
    const staticBounds = new Map<string, { x: number; y: number; width: number; height: number }>();
    for (const [id, el] of ctx.ctx.registry.getAll()) {
      if (excludeIds.has(id)) continue;
      const b = getElementWorldBounds(ctx.ctx, el);
      staticBounds.set(id, { x: b.x, y: b.y, width: b.width, height: b.height });
    }
    boundsIndex = new BoundsIndex(staticBounds);
  }

  ctx.boundingBox.hide();

  const processDrag = (mv: FederatedPointerEvent) => {
    const zoom = camera?.getZoom() ?? 1;
    const dx = (mv.globalX - startX) / zoom;
    const dy = (mv.globalY - startY) / zoom;

    let snapDx = dx;
    let snapDy = dy;

    let snapResult: InternalSnapResult | null = null;

    if (snap && startBounds && boundsIndex) {
      const candidateIds = boundsIndex.query(
        startBounds.x + dx,
        startBounds.y + dy,
        snap.getThreshold() + Math.max(startBounds.width, startBounds.height),
      );
      const result = snap.resolve(startBounds.x + dx, startBounds.y + dy, {
        width: startBounds.width,
        height: startBounds.height,
        exclude: [...excludeIds],
        candidateIds,
      });
      snapDx = result.x - startBounds.x;
      snapDy = result.y - startBounds.y;
      snapResult = result;
    }

    if (isCanvasConstraintEnabled(ctx.ctx) && startConstraintBounds) {
      const constrained = clampBoundsDelta(
        {
          x: startConstraintBounds.x,
          y: startConstraintBounds.y,
          width: startConstraintBounds.width,
          height: startConstraintBounds.height,
        } as never,
        snapDx,
        snapDy,
        getCanvasWorldBounds(ctx.ctx),
      );
      snapDx = constrained.dx;
      snapDy = constrained.dy;
    }

    for (const [id, start] of startPositions) {
      const el = ctx.ctx.registry.get(id);
      if (!el) continue;
      void el.update({
        x: (start.x ?? 0) + snapDx,
        y: (start.y ?? 0) + snapDy,
      } as Partial<BaseOptions>);
      ctx.ctx.events.emit('element:transforming', id);
    }

    if (snap && snapResult) {
      const actualBounds = getCombinedElementWorldBounds(ctx.ctx, selectedElements);
      snap.showLines({
        ...snapResult,
        lineX: resolveSnapLinePosition(actualBounds.x, actualBounds.width, snapResult.xAnchor),
        lineY: resolveSnapLinePosition(actualBounds.y, actualBounds.height, snapResult.yAnchor),
      });
    }
  };

  const onMove = rafThrottle(processDrag);

  return attachStageDrag(ctx, onMove, () => {
    snap?.hideLines();
    ctx.boundingBox.show();
    ctx.updateBoundingBox();
    for (const [id] of startPositions) {
      ctx.ctx.events.emit('element:updated', id);
    }
    ctx.recordGroupUpdate(selectedElements, startPositions, 'move');
  });
}

function resolveSnapLinePosition(
  start: number,
  size: number,
  anchor: InternalSnapResult['xAnchor'] | InternalSnapResult['yAnchor'],
): number | undefined {
  switch (anchor) {
    case 'min':
      return start;
    case 'center':
      return start + size / 2;
    case 'max':
      return start + size;
    default:
      return undefined;
  }
}

// Returns a cleanup function that removes all stage listeners for this gesture.
function attachStageDrag(
  ctx: Pick<InteractionGesturesContext, 'ctx'>,
  onMove: (e: FederatedPointerEvent) => void,
  onEnd?: () => void,
): () => void {
  const stage = ctx.ctx.app.getPixiApp().stage;
  const cleanup = () => {
    stage.off('pointermove', onMove);
    stage.off('pointerup', onUp);
    stage.off('pointerupoutside', onUp);
  };
  const onUp = () => {
    cleanup();
    onEnd?.();
  };
  stage.on('pointermove', onMove);
  stage.on('pointerup', onUp);
  stage.on('pointerupoutside', onUp);
  return cleanup;
}
