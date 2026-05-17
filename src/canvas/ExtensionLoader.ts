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

  // Sort stage-level layer containers once by zIndex after all extensions have
  // added their children, so the stage never needs sortableChildren = true.
  // worldContainer already has sortableChildren = true for element z-ordering.
  const stage = params.ctx.stage;
  const sorted = [...stage.children].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  for (const child of sorted) {
    stage.addChild(child);
  }
}
