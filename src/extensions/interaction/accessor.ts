import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { InteractionManager } from '@/extensions/interaction/InteractionManager';
import type { InteractionAccessor } from '@/extensions/interaction/types';

export function createInteractionAccessor(params: {
  ctx: CanvasContext;
  getManager: () => InteractionManager | undefined;
}): InteractionAccessor {
  function select(idOrIds: string | readonly string[] | null): void {
    params.getManager()?.select(idOrIds);
  }

  async function duplicate(): Promise<void> {
    await params.getManager()?.duplicate();
  }

  function getSelectedIds(): string[] {
    return [...(params.getManager()?.getSelectedIds() ?? [])];
  }

  function getSelectedOptions(): BaseOptions[] {
    return getSelectedIds()
      .map((id) => params.ctx.getElement(id)?.getOptions())
      .filter((opts): opts is BaseOptions => opts !== undefined);
  }

  return { select, duplicate, getSelectedIds, getSelectedOptions };
}
