import type { ElementFactory } from '@/core/ElementRegistry';
import { ImageElement } from '@/elements/Image/ImageElement';
import type { ImageOptions } from '@/elements/Image/ImageOptions';

export const IMAGE_FACTORIES: Record<string, ElementFactory> = {
  image: (opts, ctx) => new ImageElement(opts as ImageOptions, ctx),
};

function create(options: ImageOptions): ImageElement {
  return new ImageElement(options);
}

export const Image = {
  create,
  factories: IMAGE_FACTORIES,
} as const;

export type { ImageOptions };
export { ImageElement };
