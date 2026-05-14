import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { Command } from '@/extensions/history/commands/Command';

export class AddCommand implements Command {
  readonly description = 'Add element';
  readonly kind = 'add' as const;

  constructor(
    private readonly ctx: CanvasContext,
    private readonly snapshots: readonly BaseOptions[],
  ) {}

  async execute(): Promise<void> {
    for (const opts of this.snapshots) {
      const el = this.ctx.registry.createFromOptions(opts);
      await this.ctx.addElement(el);
    }
  }

  async undo(): Promise<void> {
    for (const opts of this.snapshots) {
      this.ctx.removeElement(opts.id);
    }
  }
}
