import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { ElementPatch } from '@/types/Elements';

export type SerializedElement = Record<string, unknown> & {
  id: string;
  type: string;
} & ElementPatch;

export interface SerializationAdapter<T extends BaseOptions = BaseOptions> {
  readonly type: string;
  serialize(element: BaseElement<T>): T;
  deserialize(data: T): BaseElement<T>;
}

export type SerializerAccessor = {
  serialize(): SerializedElement[];
  append(data: SerializedElement[]): Promise<void>;
  replace(data: SerializedElement[]): Promise<void>;
  serializeElement(element: BaseElement<BaseOptions>): SerializedElement;
  registerAdapter<T extends BaseOptions>(adapter: SerializationAdapter<T>): void;
};
