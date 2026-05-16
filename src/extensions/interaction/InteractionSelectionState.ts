import type { FederatedPointerEvent } from 'pixi.js';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { InteractionSelectionStateContext } from '@/extensions/interaction/types';

export function selectOnly(ctx: InteractionSelectionStateContext, id: string): void {
  setSelection(ctx, [id]);
}

export function toggleSelection(ctx: InteractionSelectionStateContext, id: string): void {
  if (ctx.selectedIds.has(id)) ctx.selectedIds.delete(id);
  else ctx.selectedIds.add(id);
  setSelection(ctx, [...ctx.selectedIds]);
}

export function onStagePointerDown(
  ctx: InteractionSelectionStateContext & {
    startElementDrag(e: FederatedPointerEvent): void;
    startMarqueeSelection(e: FederatedPointerEvent): void;
  },
  e: FederatedPointerEvent,
): void {
  if (e.button !== 0) return;
  if (ctx.isPanBlocked()) return;

  if (ctx.selectedIds.size > 0 && ctx.boundingBox.containsGlobalPoint(e.globalX, e.globalY)) {
    ctx.startElementDrag(e);
    return;
  }

  ctx.startMarqueeSelection(e);
}

export function setSelection(
  ctx: InteractionSelectionStateContext,
  ids: readonly string[] | null,
): void {
  ctx.selectedIds.clear();
  for (const id of ids ?? []) {
    ctx.selectedIds.add(id);
  }

  const selected = [...ctx.selectedIds];
  ctx.ctx.events.emit(
    'element:selected',
    selected.length === 0 ? null : selected.length === 1 ? (selected[0] ?? null) : selected,
  );
  updateBoundingBox(ctx);
}

export function getSelectedElements(
  ctx: InteractionSelectionStateContext,
): BaseElement<BaseOptions>[] {
  return [...ctx.selectedIds]
    .map((id) => ctx.ctx.registry.get(id))
    .filter((el): el is BaseElement<BaseOptions> => el !== undefined);
}

export function getSelectedOptions(ctx: InteractionSelectionStateContext): BaseOptions[] {
  return getSelectedElements(ctx).map((element) => element.getOptions());
}

export function updateBoundingBox(ctx: InteractionSelectionStateContext): void {
  ctx.boundingBox.update(getSelectedElements(ctx));
}

export function captureElementOptions(
  elements: readonly BaseElement<BaseOptions>[],
  patch?: (element: BaseElement<BaseOptions>) => Partial<BaseOptions>,
): Map<string, BaseOptions> {
  const snapshots = new Map<string, BaseOptions>();
  for (const element of elements) {
    snapshots.set(element.getId(), {
      ...element.getOptions(),
      ...patch?.(element),
    });
  }
  return snapshots;
}
