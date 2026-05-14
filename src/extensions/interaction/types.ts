import type { FederatedPointerEvent } from 'pixi.js';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { HandlePosition } from '@/core/Transform';
import type { CameraManager } from '@/extensions/camera/CameraManager';
import type { BoundingBox } from '@/extensions/interaction/BoundingBox';
import type { SnapManager } from '@/extensions/snap/SnapManager';

export type HandlerType =
  | 'transform'
  | 'rotate'
  | 'delete'
  | 'duplicate'
  | ((ctx: InteractionHandlerContext) => void);

export interface InteractionHandlerContext {
  selectedIds: readonly string[];
}

export interface ControlConfig {
  icon?: string;
  handler: HandlerType;
  size?: number;
}

export interface InteractionTheme {
  boundingBox?: {
    lineColor?: number | string;
    lineThickness?: number;
    lineType?: 'solid' | 'dotted';
    padding?: number;
  };
  handle?: {
    size?: number;
    color?: number | string;
  };
}

export interface InteractionConfig {
  controls?: Partial<Record<HandlePosition, ControlConfig>>;
  theme?: InteractionTheme;
}

export type InteractionAccessor = {
  select(idOrIds: string | readonly string[] | null): void;
  duplicate(): Promise<void>;
  getSelectedIds(): string[];
  getSelectedOptions(): BaseOptions[];
};

export type InteractionSelectionStateContext = {
  ctx: CanvasContext;
  boundingBox: BoundingBox;
  selectedIds: Set<string>;
  isPanBlocked(): boolean;
};

export type SelectableBinding = {
  displayObject: {
    on(event: 'pointerdown', handler: (e: FederatedPointerEvent) => void): void;
    off(event: 'pointerdown', handler: (e: FederatedPointerEvent) => void): void;
  };
  onPointerDown: (e: FederatedPointerEvent) => void;
};

export type InteractionSelectionBindingsContext = InteractionSelectionStateContext & {
  ctx: CanvasContext;
  selectableBindings: Map<string, SelectableBinding>;
  startElementDrag(e: FederatedPointerEvent): void;
};

export type InteractionActionsContext = {
  ctx: CanvasContext;
  getHistoryManager(): import('../history/HistoryManager').HistoryManager | undefined;
  getSelectedIds(): readonly string[];
  getSelectedElements(): BaseElement<BaseOptions>[];
  getSelectedOptions(): BaseOptions[];
  setSelection(ids: readonly string[] | null): void;
  getClipboard(): BaseOptions[];
  setClipboard(items: BaseOptions[]): void;
};

export type InteractionClipboardContext = {
  getHistoryManager(): import('../history/HistoryManager').HistoryManager | undefined;
  getSelectedOptions(): BaseOptions[];
  getClipboard(): BaseOptions[];
  setClipboard(items: BaseOptions[]): void;
  ctx: CanvasContext;
  setSelection(ids: readonly string[] | null): void;
};

export type ResizeAxes = { xDir: -1 | 0 | 1; yDir: -1 | 0 | 1; proportional?: true };

export type StartState = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  fontSize?: number;
  width?: number;
  height?: number;
  radius?: number;
  strokeWidth?: number;
};

export type InteractionGesturesContext = {
  ctx: CanvasContext;
  boundingBox: BoundingBox;
  getCameraManager(): CameraManager | undefined;
  getSnapManager(): SnapManager | undefined;
  getSelectedIds(): readonly string[];
  getSelectedElements(): BaseElement<BaseOptions>[];
  updateBoundingBox(): void;
  recordGroupUpdate(
    elements: readonly BaseElement<BaseOptions>[],
    beforeStates: Map<string, StartState | BaseOptions>,
    kind: 'move' | 'resize' | 'rotate',
  ): void;
};

export interface ControlHandleOptions {
  position: HandlePosition;
  icon?: string;
  handler: HandlerType;
  size?: number;
  bgSize?: number;
  bgColor?: number | string;
}
