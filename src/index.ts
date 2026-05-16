export { CanvasKit } from '@/canvas/CanvasKit';

export type { CanvasEventMap } from '@/core/Events';

export { Image, Shape, SVGElement, Text } from '@/elements';

export type {
  AlignmentAccessor,
  AlignmentMode,
} from '@/extensions/alignment/types';
export type {
  CameraAccessor,
  CameraConfig,
  CameraPoint,
} from '@/extensions/camera/types';
export type {
  ContextMenuAccessor,
  ContextMenuAction,
  ContextMenuConfig,
  ContextMenuEvent,
  ContextMenuOpenOptions,
  ContextMenuPosition,
} from '@/extensions/contextMenu/types';
export type {
  ExportAccessor,
  ExportMode,
  ExportOptions,
  ExportQuality,
} from '@/extensions/export/types';
export { fontManager } from '@/extensions/fonts';
export type { FontsAccessor } from '@/extensions/fonts/types';
export type {
  GridAccessor,
  GridConfig,
  GridState,
} from '@/extensions/grid/types';
export type {
  HistoryAccessor,
  HistoryConfig,
  HistoryTrack,
} from '@/extensions/history/types';
export type {
  ControlConfig,
  HandlerType,
  InteractionAccessor,
  InteractionConfig,
  InteractionHandlerContext,
  InteractionTheme,
} from '@/extensions/interaction/types';
export type { LayeringAccessor } from '@/extensions/layering/types';
export type { PerformanceAccessor } from '@/extensions/performance/types';
export type {
  SerializationAdapter,
  SerializedElement,
  SerializerAccessor,
} from '@/extensions/serialization/types';
export type {
  Guide,
  SnapAccessor,
  SnapConfig,
  SnapLineStyle,
  SnapResult,
  SnapState,
  SnapTarget,
} from '@/extensions/snap/types';
export type { CanvasKitOptions, ExtensionsConfig } from '@/types/CanvasKit';
export type {
  CircleOptions,
  ElementOptions,
  ElementPatch,
  ElementType,
  ImageOptions,
  LineOptions,
  RectangleOptions,
  ShapeOptions,
  StarOptions,
  SVGOptions,
  TextOptions,
} from '@/types/Elements';
