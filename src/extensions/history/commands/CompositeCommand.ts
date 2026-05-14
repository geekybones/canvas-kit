import type { Command } from '@/extensions/history/commands/Command';
import type { HistoryTrack } from '@/extensions/history/types';

export class CompositeCommand implements Command {
  constructor(
    readonly description: string,
    readonly kind: HistoryTrack,
    private readonly commands: readonly Command[],
  ) {}

  async execute(): Promise<void> {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo(): Promise<void> {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i]?.undo();
    }
  }
}
