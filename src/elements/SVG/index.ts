import type { ElementFactory } from '@/core/ElementRegistry';
import { SVGElement } from '@/elements/SVG/SVGElement';
import type { SVGOptions } from '@/elements/SVG/SVGOptions';

export const SVG_FACTORIES: Record<string, ElementFactory> = {
  svg: (opts) => new SVGElement(opts as SVGOptions),
};

export type { SVGOptions };
export { SVGElement };
