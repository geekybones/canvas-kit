import type { CanvasContext } from '@/core/CanvasContext';
import type { Command } from '@/extensions/history/commands/Command';

type LayerSnapshot = {
  id: string;
  zIndex: number;
};

export class LayerCommand implements Command {
  readonly description = 'Change layer order';
  readonly kind = 'zOrder' as const;

  constructor(
    private readonly ctx: CanvasContext,
    private readonly before: readonly LayerSnapshot[],
    private readonly after: readonly LayerSnapshot[],
  ) {}

  async execute(): Promise<void> {
    this.apply(this.after);
  }

  async undo(): Promise<void> {
    this.apply(this.before);
  }

  private apply(snapshots: readonly LayerSnapshot[]): void {
    for (const snapshot of snapshots) {
      const el = this.ctx.registry.get(snapshot.id);
      if (!el) continue;
      el.setZIndex(snapshot.zIndex);
      this.ctx.events.emit('element:updated', snapshot.id);
    }

    this.ctx.events.emit('layer:changed');
  }
}
