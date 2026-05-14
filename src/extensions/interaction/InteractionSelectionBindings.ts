import type { FederatedPointerEvent } from 'pixi.js';
import { selectOnly, toggleSelection } from '@/extensions/interaction/InteractionSelectionState';
import type { InteractionSelectionBindingsContext } from '@/extensions/interaction/types';

export function syncSelectableElement(ctx: InteractionSelectionBindingsContext, id: string): void {
  const el = ctx.ctx.registry.get(id);
  if (!el || el.getOptions().selectable === false) {
    detachSelectableElement(ctx, id);
    return;
  }

  const displayObject = el.getDisplayObject();
  displayObject.eventMode = 'static';
  displayObject.cursor = 'move';

  const existing = ctx.selectableBindings.get(id);
  if (existing?.displayObject === displayObject) {
    return;
  }
  detachSelectableElement(ctx, id);

  const onPointerDown = (e: FederatedPointerEvent) => {
    if (e.button !== 0) return;
    if (ctx.isPanBlocked()) return;

    e.stopPropagation();
    const native = e.nativeEvent as PointerEvent | null;
    if (native?.ctrlKey || native?.metaKey) {
      toggleSelection(ctx, el.getId());
    } else {
      selectOnly(ctx, el.getId());
    }
    ctx.startElementDrag(e);
  };

  displayObject.on('pointerdown', onPointerDown);
  ctx.selectableBindings.set(id, { displayObject, onPointerDown });
}

export function detachSelectableElement(
  ctx: InteractionSelectionBindingsContext,
  id: string,
): void {
  const binding = ctx.selectableBindings.get(id);
  if (!binding) return;

  binding.displayObject.off('pointerdown', binding.onPointerDown);
  ctx.selectableBindings.delete(id);
}
