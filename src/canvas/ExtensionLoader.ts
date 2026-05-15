import type { CanvasKitOptions } from '@/canvas/CanvasKitOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { buildExtensionList } from '@/extensions';

export async function loadExtensions(params: {
  ctx: CanvasContext;
  options: CanvasKitOptions;
  extensions: Map<string, unknown>;
  target: object;
}): Promise<void> {
  const list = buildExtensionList(params.options.extensions ?? {});
  for (const ext of list) {
    await ext.init(params.ctx);
    if (ext.accessors) {
      Object.assign(params.target, ext.accessors);
    }
    params.extensions.set(ext.name, ext);
  }
}
