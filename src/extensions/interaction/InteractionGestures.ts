import type { FederatedPointerEvent } from 'pixi.js';
import type { BaseOptions } from '@/core/BaseOptions';
import {
  clampBoundsDelta,
  getCanvasWorldBounds,
  getCombinedElementWorldBounds,
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
import type { InternalSnapResult } from '@/extensions/snap/types';

export function startResize(
  ctx: InteractionGesturesContext,
  e: FederatedPointerEvent,
  pos: HandlePosition,
): void {
  const elements = ctx.getSelectedElements();
  if (!elements.length) return;

  const axes = TRANSFORM_AXES[pos];
  if (!axes) return;

  const startRect = Transform.getCombinedBoundingRect(elements);
  if (startRect.width === 0 || startRect.height === 0) return;

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

  const onMove = (mv: FederatedPointerEvent) => {
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
      el.update(computeResizeUpdate(el.getType(), state, axes, sx, sy, ax, ay));
      ctx.ctx.events.emit('element:updated', el.getId());
    }
    ctx.updateBoundingBox();
  };

  attachStageDrag(ctx, onMove, () => {
    ctx.recordGroupUpdate(elements, startStates, 'resize');
  });
}

export function startRotate(ctx: InteractionGesturesContext, e: FederatedPointerEvent): void {
  const elements = ctx.getSelectedElements();
  if (!elements.length) return;

  const rect = Transform.getCombinedBoundingRect(elements);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  const startAngle = Math.atan2(e.globalY - cy, e.globalX - cx);
  const startRots = new Map<string, number>();
  for (const el of elements) {
    startRots.set(el.getId(), el.getOptions().rotationDeg ?? 0);
  }

  const onMove = (mv: FederatedPointerEvent) => {
    const angle = Math.atan2(mv.globalY - cy, mv.globalX - cx);
    const deltaDeg = (angle - startAngle) * (180 / Math.PI);
    for (const el of elements) {
      el.update({
        rotationDeg: (startRots.get(el.getId()) ?? 0) + deltaDeg,
      } as Partial<BaseOptions>);
      ctx.ctx.events.emit('element:updated', el.getId());
    }
    ctx.updateBoundingBox();
  };

  attachStageDrag(ctx, onMove, () => {
    ctx.recordGroupUpdate(
      elements,
      captureElementOptions(elements, (element) => ({
        rotationDeg: startRots.get(element.getId()) ?? 0,
      })),
      'rotate',
    );
  });
}

export function startElementDrag(ctx: InteractionGesturesContext, e: FederatedPointerEvent): void {
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

  ctx.boundingBox.hide();

  const onMove = (mv: FederatedPointerEvent) => {
    const zoom = camera?.getZoom() ?? 1;
    const dx = (mv.globalX - startX) / zoom;
    const dy = (mv.globalY - startY) / zoom;

    let snapDx = dx;
    let snapDy = dy;

    let snapResult: InternalSnapResult | null = null;

    if (snap && startBounds) {
      const result = snap.resolve(startBounds.x + dx, startBounds.y + dy, {
        width: startBounds.width,
        height: startBounds.height,
        exclude: [...ctx.getSelectedIds()],
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
      el.update({
        x: (start.x ?? 0) + snapDx,
        y: (start.y ?? 0) + snapDy,
      } as Partial<BaseOptions>);
      ctx.ctx.events.emit('element:updated', id);
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

  attachStageDrag(ctx, onMove, () => {
    snap?.hideLines();
    ctx.boundingBox.show();
    ctx.updateBoundingBox();
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

function attachStageDrag(
  ctx: Pick<InteractionGesturesContext, 'ctx'>,
  onMove: (e: FederatedPointerEvent) => void,
  onEnd?: () => void,
): void {
  const stage = ctx.ctx.app.getPixiApp().stage;
  const onUp = () => {
    stage.off('pointermove', onMove);
    stage.off('pointerup', onUp);
    stage.off('pointerupoutside', onUp);
    onEnd?.();
  };
  stage.on('pointermove', onMove);
  stage.on('pointerup', onUp);
  stage.on('pointerupoutside', onUp);
}
