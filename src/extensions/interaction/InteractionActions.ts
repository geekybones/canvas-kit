import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import { buildDuplicateOptions, getMaxElementZIndex } from '@/core/duplicateOptions';
import { AddCommand } from '@/extensions/history/commands/AddCommand';
import { CompositeCommand } from '@/extensions/history/commands/CompositeCommand';
import { RemoveCommand } from '@/extensions/history/commands/RemoveCommand';
import { UpdateCommand } from '@/extensions/history/commands/UpdateCommand';
import {
  copySelectedToClipboard,
  pasteSelectionFromClipboard,
} from '@/extensions/interaction/InteractionClipboard';
import type { InteractionActionsContext, StartState } from '@/extensions/interaction/types';

export async function deleteSelected(ctx: InteractionActionsContext): Promise<void> {
  const ids = [...ctx.getSelectedIds()];
  if (ids.length === 0) return;

  ctx.setSelection(null);

  const history = ctx.getHistoryManager();
  if (history) {
    await history.execute(new RemoveCommand(ctx.ctx, ids));
  } else {
    for (const id of ids) ctx.ctx.removeElement(id);
  }
}

export function copySelected(ctx: InteractionActionsContext): void {
  copySelectedToClipboard(ctx);
}

export async function duplicateSelection(ctx: InteractionActionsContext): Promise<void> {
  const snapshots = ctx
    .getSelectedElements()
    .map((el) => ({ ...el.getOptions() }))
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  if (!snapshots.length) return;

  const duplicates = buildDuplicateOptions(snapshots, getMaxElementZIndex(ctx.ctx.registry) + 1);

  const history = ctx.getHistoryManager();
  if (history) {
    await history.execute(new AddCommand(ctx.ctx, duplicates));
  } else {
    for (const options of duplicates) {
      await ctx.ctx.addElement(ctx.ctx.registry.createFromOptions(options));
    }
  }

  ctx.setSelection(duplicates.map((options) => options.id));
}

export async function pasteSelected(ctx: InteractionActionsContext): Promise<void> {
  await pasteSelectionFromClipboard(ctx);
}

export function recordGroupUpdate(
  ctx: Pick<InteractionActionsContext, 'ctx' | 'getHistoryManager'>,
  elements: readonly BaseElement<BaseOptions>[],
  beforeStates: Map<string, StartState | BaseOptions>,
  kind: 'move' | 'resize' | 'rotate',
): void {
  const history = ctx.getHistoryManager();
  if (!history?.shouldTrack(kind)) {
    return;
  }

  const commands = elements
    .map((el) => {
      const before = beforeStates.get(el.getId());
      if (!before) return null;

      return UpdateCommand.createFromSnapshot(
        ctx.ctx,
        el.getId(),
        kind,
        before as Partial<BaseOptions>,
        ctx.ctx.registry.get(el.getId())?.getOptions(),
        el.getOptions(),
      );
    })
    .filter((command): command is UpdateCommand => command !== null);

  if (commands.length === 0) {
    return;
  }

  const [first] = commands;
  const command =
    commands.length === 1 && first ? first : new CompositeCommand(`Update ${kind}`, kind, commands);

  history.record(command);
}
