import type { ExtensionsConfig } from '@/canvas/CanvasKitOptions';
import { AlignmentManager } from '@/extensions/alignment/AlignmentManager';
import { CameraManager } from '@/extensions/camera/CameraManager';
import { ContextMenuManager } from '@/extensions/contextMenu/ContextMenuManager';
import type { Extension } from '@/extensions/Extension';
import { ExportManager } from '@/extensions/export/ExportManager';
import { FontManager } from '@/extensions/fonts/FontManager';
import { GridManager } from '@/extensions/grid/GridManager';
import { HistoryManager } from '@/extensions/history/HistoryManager';
import { InteractionManager } from '@/extensions/interaction/InteractionManager';
import { LayerManager } from '@/extensions/layering/LayerManager';
import { PerformanceManager } from '@/extensions/performance/PerformanceManager';
import { SerializationManager } from '@/extensions/serialization/SerializationManager';
import { SnapManager } from '@/extensions/snap/SnapManager';

export function buildExtensionList(config: ExtensionsConfig = {}): Extension[] {
  const extensions: Extension[] = [];
  const isEnabled = (key: keyof ExtensionsConfig): boolean => config[key] !== false;
  const pushIfEnabled = (key: keyof ExtensionsConfig, extension: Extension): void => {
    if (isEnabled(key)) {
      extensions.push(extension);
    }
  };
  const pushIfConfigured = <TConfig>(
    value: boolean | TConfig | undefined,
    create: (config: TConfig | undefined) => Extension,
  ): void => {
    if (value) {
      extensions.push(create(typeof value === 'object' ? value : undefined));
    }
  };

  pushIfEnabled('layering', new LayerManager());
  pushIfEnabled('alignment', new AlignmentManager());
  pushIfEnabled(
    'history',
    new HistoryManager(typeof config.history === 'object' ? config.history : {}),
  );
  pushIfEnabled('serialization', new SerializationManager());
  pushIfEnabled('interaction', new InteractionManager());
  pushIfEnabled('contextMenu', new ContextMenuManager());
  pushIfEnabled('fonts', new FontManager());
  pushIfEnabled('performance', new PerformanceManager());
  pushIfEnabled('export', new ExportManager());
  pushIfConfigured(config.camera, (cameraConfig) => new CameraManager(cameraConfig ?? {}));
  pushIfConfigured(config.grid, (gridConfig) => new GridManager(gridConfig ?? {}));
  pushIfConfigured(config.snap, (snapConfig) => new SnapManager(snapConfig ?? {}));

  return extensions;
}
