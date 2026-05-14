import type { ElementRegistry } from '@/core/ElementRegistry';
import { IMAGE_FACTORIES } from '@/elements/Image';
import { getShapeFactories } from '@/elements/Shape/registry';
import { SVG_FACTORIES } from '@/elements/SVG';
import { TEXT_FACTORIES } from '@/elements/Text/registry';

function registerFactories(
  registry: ElementRegistry,
  factories: Iterable<readonly [string, (typeof IMAGE_FACTORIES)[string]]>,
): void {
  for (const [type, factory] of factories) {
    registry.registerFactory(type, factory);
  }
}

export function loadElements(registry: ElementRegistry): void {
  registerFactories(registry, Object.entries(TEXT_FACTORIES));
  registerFactories(registry, Object.entries(IMAGE_FACTORIES));
  registerFactories(registry, getShapeFactories());
  registerFactories(registry, Object.entries(SVG_FACTORIES));
}
