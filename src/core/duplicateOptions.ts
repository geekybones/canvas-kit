import type { BaseOptions } from '@/core/BaseOptions';
import type { ElementRegistry } from '@/core/ElementRegistry';

export function buildDuplicateOptions(
  snapshots: readonly BaseOptions[],
  nextZIndex: number,
): BaseOptions[] {
  const duplicates = snapshots.map((options) => ({
    ...options,
    id: `${options.id}_dup_${crypto.randomUUID()}`,
    x: (options.x ?? 0) + 10,
    y: (options.y ?? 0) + 10,
  }));

  let currentZIndex = nextZIndex;
  for (const duplicate of duplicates) {
    duplicate.zIndex = currentZIndex++;
  }

  return duplicates;
}

export function getMaxElementZIndex(registry: ElementRegistry): number {
  let maxZIndex = 0;
  for (const element of registry.getAll().values()) {
    maxZIndex = Math.max(maxZIndex, element.getDisplayObject().zIndex);
  }
  return maxZIndex;
}
