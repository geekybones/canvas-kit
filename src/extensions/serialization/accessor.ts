import type { SerializationManager } from '@/extensions/serialization/SerializationManager';
import type { SerializerAccessor } from '@/extensions/serialization/types';

export function createSerializerAccessor(
  getManager: () => SerializationManager | undefined,
): SerializerAccessor {
  return {
    serialize: () => getManager()?.serializeAll() ?? [],
    append: async (data) => {
      const manager = getManager();
      if (!manager) return;
      await manager.appendAll(data);
    },
    replace: async (data) => {
      const manager = getManager();
      if (!manager) return;
      await manager.replaceAll(data);
    },

    serializeElement: (element) => {
      const manager = getManager();
      if (!manager) {
        throw new Error('Serialization extension is unavailable.');
      }
      return manager.serialize(element);
    },
    registerAdapter: (adapter) => getManager()?.registerAdapter(adapter),
  };
}
