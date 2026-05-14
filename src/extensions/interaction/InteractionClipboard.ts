import type { BaseOptions } from '@/core/BaseOptions';
import { getMaxElementZIndex } from '@/core/duplicateOptions';
import { AddCommand } from '@/extensions/history/commands/AddCommand';
import type { InteractionClipboardContext } from '@/extensions/interaction/types';

export function copySelectedToClipboard(ctx: InteractionClipboardContext): void {
  const snapshots = ctx.getSelectedOptions().map((options) => ({ ...options }));
  const history = ctx.getHistoryManager();
  if (history) history.setClipboard(snapshots);
  else ctx.setClipboard(snapshots);
}

export async function pasteSelectionFromClipboard(ctx: InteractionClipboardContext): Promise<void> {
  const history = ctx.getHistoryManager();
  const items = history ? history.getClipboard() : ctx.getClipboard();
  if (!items.length) return;

  const pasted: BaseOptions[] = items.map((opts) => ({
    ...opts,
    id: `${opts.id}_paste_${crypto.randomUUID()}`,
    x: (opts.x ?? 0) + 10,
    y: (opts.y ?? 0) + 10,
  }));

  const sorted = [...pasted].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  let nextZ = getMaxElementZIndex(ctx.ctx.registry) + 1;
  for (const options of sorted) options.zIndex = nextZ++;

  if (history) {
    await history.execute(new AddCommand(ctx.ctx, pasted));
  } else {
    for (const options of pasted) {
      await ctx.ctx.addElement(ctx.ctx.registry.createFromOptions(options));
    }
  }

  ctx.setSelection(pasted.map((options) => options.id));
}
