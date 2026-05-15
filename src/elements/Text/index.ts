import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import { TEXT_FACTORIES } from '@/elements/Text/registry';
import { TextElement } from '@/elements/Text/TextElement';
import type {
  MeshEffectFunction,
  RegisterMeshEffectOptions,
  TextOptions,
} from '@/elements/Text/types';
import { clearVectorTemplateCache } from '@/elements/Text/Vector/builder';
import {
  getMeshEffect,
  listMeshEffects,
  registerMeshEffect,
} from '@/elements/Text/Vector/registry';

export namespace Text {
  export const Type = 'text' as const;

  export function create(options: TextOptions): TextElement;
  export function create(type: string, options: BaseOptions): BaseElement<BaseOptions>;
  export function create(
    typeOrOptions: string | TextOptions,
    maybeOptions?: BaseOptions,
  ): BaseElement<BaseOptions> {
    const type = typeof typeOrOptions === 'string' ? typeOrOptions : Type;
    const options = typeof typeOrOptions === 'string' ? maybeOptions : typeOrOptions;
    const factory = TEXT_FACTORIES[type];

    if (!factory || !options) {
      throw new Error(`Unknown text type: "${type}"`);
    }

    return factory(options);
  }

  export function registerEffect(
    name: string,
    fn: MeshEffectFunction,
    options?: RegisterMeshEffectOptions,
  ): void {
    registerMeshEffect(name, fn, options);
  }

  export const getEffect = getMeshEffect;
  export const listEffects = listMeshEffects;
  export const clearEffectCache = clearVectorTemplateCache;
  export const factories = TEXT_FACTORIES;
}

export type {
  BaseTextOptions,
  MeshEffectColumn,
  MeshEffect,
  MeshEffectFnContext,
  MeshEffectFunction,
  RegisterMeshEffectOptions,
  TextAlign,
  TextEffect,
  TextEffectOptions,
  TextOptions,
  TextStrokeAlign,
  TextStyleOptions,
  VectorTextRenderOptions,
  VectorTextState,
} from '@/elements/Text/types';
export { TextElement };
