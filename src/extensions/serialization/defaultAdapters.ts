import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { SerializationAdapter } from '@/extensions/serialization/types';

export function createDefaultSerializationAdapters(ctx: CanvasContext): SerializationAdapter[] {
  const registryBackedTypes = [
    'text',
    'image',
    'svg',
    'shape:rectangle',
    'shape:circle',
    'shape:star',
    'shape:line',
  ] as const;

  const registryAdapters = registryBackedTypes.map(
    (type): SerializationAdapter<BaseOptions> => ({
      type,
      serialize: (element) => element.getOptions(),
      deserialize: (data) => ctx.registry.createFromOptions(data),
    }),
  );

  return registryAdapters;
}
