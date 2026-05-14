import type { HistoryTrack } from '@/extensions/history/types';

export interface Command {
  readonly description: string;
  readonly kind: HistoryTrack;
  execute(): Promise<void>;
  undo(): Promise<void>;
}
