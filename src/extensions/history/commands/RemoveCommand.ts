import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { Command } from '@/extensions/history/commands/Command';

export class RemoveCommand implements Command {
  readonly description = 'Remove element';
  readonly kind = 'remove' as const;
  private snapshots: BaseOptions[] = [];

  constructor(
    private readonly ctx: CanvasContext,
    private readonly ids: readonly string[],
  ) {}

  async execute(): Promise<void> {
    this.snapshots = [];
    for (const id of this.ids) {
      const el = this.ctx.registry.get(id);
      if (el) this.snapshots.push({ ...el.getOptions() });
      this.ctx.removeElement(id);
    }
  }

  async undo(): Promise<void> {
    for (const opts of this.snapshots) {
      const el = this.ctx.registry.createFromOptions(opts);
      await this.ctx.addElement(el);
    }
  }
}
