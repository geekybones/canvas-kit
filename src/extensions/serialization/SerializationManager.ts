import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { Extension } from '@/extensions/Extension';
import { createSerializerAccessor } from '@/extensions/serialization/accessor';
import { createDefaultSerializationAdapters } from '@/extensions/serialization/defaultAdapters';
import type { SerializationAdapter, SerializedElement } from '@/extensions/serialization/types';

type RegisteredSerializationAdapter = {
  readonly type: string;
  serialize(element: BaseElement<BaseOptions>): SerializedElement;
  deserialize(data: SerializedElement): BaseElement<BaseOptions>;
};

export class SerializationManager implements Extension {
  readonly name = 'serialization';
  accessors?: { serializer: ReturnType<typeof createSerializerAccessor> };
  private ctx!: CanvasContext;
  private readonly adapters = new Map<string, RegisteredSerializationAdapter>();

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.registerDefaultAdapters();
    this.accessors = {
      serializer: createSerializerAccessor(() =>
        ctx.getExtension<SerializationManager>('serialization'),
      ),
    };
  }

  private registerDefaultAdapters(): void {
    for (const adapter of createDefaultSerializationAdapters(this.ctx)) {
      this.registerAdapter(adapter);
    }
  }

  registerAdapter<T extends BaseOptions>(adapter: SerializationAdapter<T>): void {
    if (this.adapters.has(adapter.type)) {
      throw new Error(`A serialization adapter is already registered for "${adapter.type}".`);
    }

    this.adapters.set(adapter.type, {
      type: adapter.type,
      serialize: (element) => adapter.serialize(element as BaseElement<T>) as SerializedElement,
      deserialize: (data) => adapter.deserialize(data as T),
    });
  }

  serialize(element: BaseElement<BaseOptions>): SerializedElement {
    const adapter = this.adapters.get(element.getType());
    if (!adapter) {
      throw new Error(`No serialization adapter registered for "${element.getType()}".`);
    }
    return adapter.serialize(element) as unknown as SerializedElement;
  }

  serializeAll(): SerializedElement[] {
    return [...this.ctx.registry.getAll().values()].map((el) => this.serialize(el));
  }

  async appendAll(data: SerializedElement[]): Promise<void> {
    const elements = data.map((opts, index) => this.deserializeElement(opts, index));
    for (const element of elements) {
      await this.ctx.addElement(element);
    }
  }

  async replaceAll(data: SerializedElement[]): Promise<void> {
    const previousScene = this.serializeAll();
    this.ctx.clearElements();
    try {
      await this.appendAll(data);
    } catch (error) {
      try {
        this.ctx.clearElements();
        await this.appendAll(previousScene);
      } catch (restoreError) {
        const importMessage = (error instanceof Error ? error.message : String(error)).replace(
          /\.+$/,
          '',
        );
        const restoreMessage = (
          restoreError instanceof Error ? restoreError.message : String(restoreError)
        ).replace(/\.+$/, '');
        throw new Error(
          `Failed to replace scene and restore the previous scene. Import error: ${importMessage}. Restore error: ${restoreMessage}.`,
        );
      }
      throw error;
    }
  }

  private deserializeElement(opts: SerializedElement, index: number): BaseElement<BaseOptions> {
    const type = opts.type;
    if (!type) {
      throw new Error(`Serialized element at index ${index} is missing "type".`);
    }
    const adapter = this.adapters.get(type);
    if (!adapter) {
      throw new Error(`No serialization adapter registered for "${type}".`);
    }
    return adapter.deserialize(opts);
  }
}
