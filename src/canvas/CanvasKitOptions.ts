import type { CameraConfig } from '@/extensions/camera/types';
import type { ContextMenuConfig } from '@/extensions/contextMenu/types';
import type { GridConfig } from '@/extensions/grid/types';
import type { HistoryConfig } from '@/extensions/history/types';
import type { InteractionConfig } from '@/extensions/interaction/types';
import type { SnapConfig } from '@/extensions/snap/types';

export interface ExtensionsConfig {
  alignment?: boolean;
  history?: boolean | HistoryConfig;
  interaction?: boolean | InteractionConfig;
  layering?: boolean;
  serialization?: boolean;
  export?: boolean;
  fonts?: boolean;
  performance?: boolean;
  contextMenu?: boolean | ContextMenuConfig;
  grid?: boolean | GridConfig;
  snap?: boolean | SnapConfig;
  camera?: boolean | CameraConfig;
}

export interface CanvasKitOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  constrainToCanvas?: boolean;
  extensions?: ExtensionsConfig;
}
