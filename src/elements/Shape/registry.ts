import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { ElementFactory } from '@/core/ElementRegistry';
import type { CircleOptions } from '@/elements/Shape/Circle/CircleOptions';
import { CircleShape } from '@/elements/Shape/Circle/CircleShape';
import type { LineOptions } from '@/elements/Shape/Line/LineOptions';
import { LineShape } from '@/elements/Shape/Line/LineShape';
import type { RectangleOptions } from '@/elements/Shape/Rectangle/RectangleOptions';
import { RectangleShape } from '@/elements/Shape/Rectangle/RectangleShape';
import type { StarOptions } from '@/elements/Shape/Star/StarOptions';
import { StarShape } from '@/elements/Shape/Star/StarShape';

const shapeFactories = new Map<string, ElementFactory>([
  ['shape:rectangle', (opts) => new RectangleShape(opts as RectangleOptions)],
  ['shape:circle', (opts) => new CircleShape(opts as CircleOptions)],
  ['shape:star', (opts) => new StarShape(opts as StarOptions)],
  ['shape:line', (opts) => new LineShape(opts as LineOptions)],
]);

export function registerShapeFactory(type: string, factory: ElementFactory): void {
  shapeFactories.set(type, factory);
}

export function getShapeFactories(): ReadonlyMap<string, ElementFactory> {
  return shapeFactories;
}

export function createShape(options: BaseOptions): BaseElement<BaseOptions> {
  const factory = shapeFactories.get(options.type);
  if (!factory) throw new Error(`Unknown shape type: "${options.type}"`);
  return factory(options);
}

export type { CircleOptions, LineOptions, RectangleOptions, StarOptions };
export { CircleShape, LineShape, RectangleShape, StarShape };
