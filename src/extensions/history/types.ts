import type { BaseOptions } from '@/core/BaseOptions';

export type HistoryTrack =
  | 'move'
  | 'resize'
  | 'rotate'
  | 'add'
  | 'remove'
  | 'zOrder'
  | 'align'
  | 'text';

export interface HistoryConfig {
  max?: number;
  track?: HistoryTrack[];
}

export type HistoryAccessor = {
  undo(): Promise<void>;
  redo(): Promise<void>;
  canUndo(): boolean;
  canRedo(): boolean;
  setClipboard(items: BaseOptions[]): void;
  getClipboard(): BaseOptions[];
};
