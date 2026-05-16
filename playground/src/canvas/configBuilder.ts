import type { CanvasKitOptions, ExtensionsConfig } from '@geekybones/canvas-kit';

export const HISTORY_TRACKS = [
  'move',
  'resize',
  'rotate',
  'add',
  'remove',
  'zOrder',
  'align',
  'text',
] as const;

export type HistoryConfig = Exclude<NonNullable<ExtensionsConfig['history']>, boolean | undefined>;
export type InteractionConfig = Exclude<
  NonNullable<ExtensionsConfig['interaction']>,
  boolean | undefined
>;
export type CameraConfig = Exclude<NonNullable<ExtensionsConfig['camera']>, boolean | undefined>;
export type GridConfig = Exclude<NonNullable<ExtensionsConfig['grid']>, boolean | undefined>;
export type SnapConfig = Exclude<NonNullable<ExtensionsConfig['snap']>, boolean | undefined>;

export const DEFAULT_HISTORY_CONFIG: HistoryConfig = {
  max: 100,
  track: [...HISTORY_TRACKS],
};

export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
  marquee: true,
  theme: {
    boundingBox: { lineColor: '#000918', lineThickness: 1.5 },
    handle: { size: 18, color: '#000918' },
    marquee: {
      fillColor: '#4285f4',
      fillAlpha: 0.1,
      strokeColor: '#4285f4',
      strokeWidth: 1,
      strokeAlpha: 0.8,
    },
  },
};

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  zoom: 1,
  minZoom: 0.25,
  maxZoom: 4,
  zoomStep: 0.1,
  wheelZoom: false,
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cellSize: 32,
  majorInterval: 4,
  visible: true,
  minorLineColor: 0xd7dee8,
  minorLineAlpha: 0.6,
  majorLineColor: 0xbfcbdd,
  majorLineAlpha: 0.9,
};

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  grid: true,
  objects: true,
  edges: true,
  guides: true,
  threshold: 8,
  lineColor: 0x1a73e8,
  lineAlpha: 0.75,
  lineWidth: 1,
};

export function createDefaultConfig(): CanvasKitOptions {
  return {
    backgroundColor: '#f4f5f7',
    constrainToCanvas: true,
    extensions: {
      alignment: true,
      history: { ...DEFAULT_HISTORY_CONFIG, track: [...(DEFAULT_HISTORY_CONFIG.track ?? [])] },
      interaction: { ...DEFAULT_INTERACTION_CONFIG },
      layering: true,
      serialization: true,
      export: true,
      fonts: true,
      performance: true,
      contextMenu: true,
      camera: { ...DEFAULT_CAMERA_CONFIG },
      grid: false,
      snap: false,
    },
  };
}
