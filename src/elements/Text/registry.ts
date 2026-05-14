import type { ElementFactory } from '@/core/ElementRegistry';
import { TextElement } from '@/elements/Text/TextElement';
import type { TextOptions } from '@/elements/Text/types';

export const TEXT_FACTORIES: Record<string, ElementFactory> = {
  text: (opts) => new TextElement(opts as TextOptions),
};

export type { TextOptions };
export { TextElement };
