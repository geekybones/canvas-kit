import type {
  CanvasKit,
  CanvasKitOptions,
  ElementOptions,
  SerializedElement,
} from '@geekybones/canvas-kit';
import type { StateCreator } from 'zustand';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createDefaultConfig } from './configBuilder';
import { attachCanvasSubscriptions } from './storeSubscriptions';

export type SelectionState = {
  selected: ElementOptions | null;
  selectedId: string | null;
  selectionCount: number;
};

export type HistoryState = { canUndo: boolean; canRedo: boolean };
export type CameraState = { zoom: number };

export type CanvasViewport = {
  width: number;
  height: number;
};

/** Config + viewport slice passed to `updateCanvas` updaters. */
export type CanvasStoreCanvas = {
  config: CanvasKitOptions;
  viewport: CanvasViewport;
};

const selectionEmpty: SelectionState = { selected: null, selectedId: null, selectionCount: 0 };
const historyEmpty: HistoryState = { canUndo: false, canRedo: false };
const cameraEmpty: CameraState = { zoom: 1 };

let detachCanvasSubscriptions: (() => void) | undefined;

export type CanvasStore = {
  config: CanvasKitOptions;
  viewport: CanvasViewport;
  selection: SelectionState;
  history: HistoryState;
  camera: CameraState;
  layers: SerializedElement[];
  bindCanvas: (canvas: CanvasKit | null) => void;
  updateCanvas: (
    updater: CanvasStoreCanvas | ((current: CanvasStoreCanvas) => CanvasStoreCanvas),
  ) => void;
};

const storeInit: StateCreator<CanvasStore> = (set) => ({
  config: createDefaultConfig(),
  viewport: { width: 0, height: 0 },
  selection: selectionEmpty,
  history: historyEmpty,
  camera: cameraEmpty,
  layers: [],
  bindCanvas: (canvas) => {
    detachCanvasSubscriptions?.();
    detachCanvasSubscriptions = undefined;
    if (!canvas) {
      set({
        selection: selectionEmpty,
        history: historyEmpty,
        camera: cameraEmpty,
        layers: [],
      });
      return;
    }
    detachCanvasSubscriptions = attachCanvasSubscriptions(canvas, set);
  },
  updateCanvas: (updater) =>
    set((s) => {
      const prev: CanvasStoreCanvas = { config: s.config, viewport: s.viewport };
      const next =
        typeof updater === 'function'
          ? (updater as (c: CanvasStoreCanvas) => CanvasStoreCanvas)(prev)
          : updater;
      return { config: next.config, viewport: next.viewport };
    }),
});

export const useCanvasStore = create<CanvasStore>()(
  (import.meta.env.DEV
    ? devtools(storeInit, { name: 'canvas-store' })
    : storeInit) as StateCreator<CanvasStore>,
);
