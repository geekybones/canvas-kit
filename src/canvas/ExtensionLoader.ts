import type { CanvasKitOptions } from '@/canvas/CanvasKitOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { buildExtensionList } from '@/extensions';

export function loadExtensions(params: {
  ctx: CanvasContext;
  options: CanvasKitOptions;
  extensions: Map<string, unknown>;
  target: object;
}): void {
  const list = buildExtensionList(params.options.extensions ?? {});
  for (const ext of list) {
    ext.init(params.ctx);
    if (ext.accessors) {
      Object.assign(params.target, ext.accessors);
    }
    params.extensions.set(ext.name, ext);
  }
}
