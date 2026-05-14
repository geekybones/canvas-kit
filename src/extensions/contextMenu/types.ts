import type { SerializedElement } from '@/extensions/serialization/types';

export interface ContextMenuAction {
  delete: () => void;
  duplicate: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  normalizeZIndex: () => void;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuOpenOptions {
  position: ContextMenuPosition;
  originalEvent?: MouseEvent;
}

export interface ContextMenuEvent {
  selected: SerializedElement[];
  position: ContextMenuPosition;
  originalEvent: MouseEvent;
  actions: ContextMenuAction;
}

export interface ContextMenuConfig {
  onElement?: (ctx: ContextMenuEvent) => void;
}

export type ContextMenuAccessor = {
  open(id: string, options: ContextMenuOpenOptions): void;
  close(): void;
};
