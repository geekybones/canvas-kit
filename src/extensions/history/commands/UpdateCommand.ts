import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { Command } from '@/extensions/history/commands/Command';
import type { HistoryTrack } from '@/extensions/history/types';

export class UpdateCommand implements Command {
  readonly description = 'Update element';

  static create(
    ctx: CanvasContext,
    id: string,
    kind: Exclude<HistoryTrack, 'add' | 'remove'>,
    before: BaseOptions,
    after: Partial<BaseOptions>,
  ): UpdateCommand | null {
    const patches = UpdateCommand.buildPatches(before, after);
    if (!patches) {
      return null;
    }

    return new UpdateCommand(ctx, id, kind, patches.reverse, patches.diff);
  }

  static createFromSnapshot(
    ctx: CanvasContext,
    id: string,
    kind: Exclude<HistoryTrack, 'add' | 'remove'>,
    snapshot: Partial<BaseOptions>,
    current: BaseOptions | undefined,
    after: BaseOptions,
  ): UpdateCommand | null {
    const before = UpdateCommand.mergeSnapshot(id, snapshot, current);
    return UpdateCommand.create(ctx, id, kind, before, after);
  }

  constructor(
    private readonly ctx: CanvasContext,
    private readonly id: string,
    readonly kind: Exclude<HistoryTrack, 'add' | 'remove'>,
    private readonly before: Partial<BaseOptions>,
    private readonly after: Partial<BaseOptions>,
  ) {}

  async execute(): Promise<void> {
    const el = this.ctx.registry.get(this.id);
    if (el) {
      await el.update(this.after);
      this.ctx.events.emit('element:updated', this.id);
    }
  }

  async undo(): Promise<void> {
    const el = this.ctx.registry.get(this.id);
    if (el) {
      await el.update(this.before);
      this.ctx.events.emit('element:updated', this.id);
    }
  }

  private static buildPatches(
    before: BaseOptions,
    after: Partial<BaseOptions>,
  ): { diff: Partial<BaseOptions>; reverse: Partial<BaseOptions> } | null {
    const diff: Partial<BaseOptions> = {};

    for (const [key, value] of Object.entries(after) as Array<
      [keyof BaseOptions, BaseOptions[keyof BaseOptions]]
    >) {
      if (key === 'id' || key === 'type') {
        continue;
      }

      if (before[key] !== value) {
        diff[key] = value as never;
      }
    }

    if (Object.keys(diff).length === 0) {
      return null;
    }

    const reverse: Record<string, unknown> = {};
    for (const key of Object.keys(diff) as Array<keyof BaseOptions>) {
      reverse[key] = before[key];
    }

    return {
      diff,
      reverse: reverse as Partial<BaseOptions>,
    };
  }

  private static mergeSnapshot(
    id: string,
    snapshot: Partial<BaseOptions>,
    current?: BaseOptions,
  ): BaseOptions {
    return {
      ...(current ?? { id, type: '' }),
      ...snapshot,
    };
  }
}
