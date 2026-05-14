import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { ElementRegistry } from '@/core/ElementRegistry';
import type { HistoryManager } from '@/extensions/history/HistoryManager';
import type { HistoryTrack } from '@/extensions/history/types';
import type { SerializationManager } from '@/extensions/serialization/SerializationManager';
import type { SerializedElement } from '@/extensions/serialization/types';

type UpdateKind = Exclude<HistoryTrack, 'add' | 'remove'> | null;

type CanvasKitActionsContext = {
  registry: ElementRegistry;
  getHistoryManager: () => HistoryManager | undefined;
  getSerializationManager: () => SerializationManager | undefined;
  addElement: (element: BaseElement<BaseOptions>) => Promise<void>;
  removeElement: (id: string) => void;
  updateElement: (element: BaseElement<BaseOptions>, next: Partial<BaseOptions>) => Promise<void>;
  getUpdateKind: (element: BaseElement<BaseOptions>, next: Partial<BaseOptions>) => UpdateKind;
};

export function applyHistoryAwareChange(
  getHistoryManager: () => HistoryManager | undefined,
  fallback: () => Promise<void> | void,
  withHistory: (history: HistoryManager) => Promise<void> | void,
): Promise<void> {
  const history = getHistoryManager();
  if (!history) {
    return Promise.resolve(fallback());
  }

  return Promise.resolve(withHistory(history));
}

export function addWithHistory(
  ctx: CanvasKitActionsContext,
  element: BaseElement<BaseOptions>,
): Promise<void> {
  const existing = ctx.registry.get(element.getId());

  return applyHistoryAwareChange(
    ctx.getHistoryManager,
    () => ctx.addElement(element),
    (history) => {
      if (existing) {
        const kind =
          existing.getType() === 'text'
            ? 'text'
            : ctx.getUpdateKind(existing, element.getOptions());
        if (!kind) {
          return ctx.addElement(element);
        }

        return history.update(existing.getId(), kind, existing.getOptions(), element.getOptions());
      }

      return history.add([element.getOptions()]);
    },
  );
}

export function removeWithHistory(ctx: CanvasKitActionsContext, id: string): Promise<void> {
  return applyHistoryAwareChange(
    ctx.getHistoryManager,
    () => ctx.removeElement(id),
    (history) => history.remove([id]),
  );
}

export function updateWithHistory(
  ctx: CanvasKitActionsContext,
  id: string,
  next: Partial<BaseOptions>,
): Promise<void> {
  const element = ctx.registry.get(id);
  if (!element) {
    return Promise.resolve();
  }

  const kind = ctx.getUpdateKind(element, next);
  return applyHistoryAwareChange(
    ctx.getHistoryManager,
    () => ctx.updateElement(element, next),
    (history) => {
      if (!kind) {
        return ctx.updateElement(element, next);
      }

      return history.update(id, kind, element.getOptions(), next);
    },
  );
}

export function clearElements(
  registry: ElementRegistry,
  removeElement: (id: string) => void,
): void {
  for (const id of [...registry.getAll().keys()]) {
    removeElement(id);
  }
}

export function getElementSnapshot(
  registry: ElementRegistry,
  getSerializationManager: () => SerializationManager | undefined,
  id: string,
): SerializedElement | undefined {
  const element = registry.get(id);
  if (!element) {
    return undefined;
  }

  const serializer = getSerializationManager();
  return serializer ? serializer.serialize(element) : (element.getOptions() as SerializedElement);
}
