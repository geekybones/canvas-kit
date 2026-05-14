import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { ElementFactory } from '@/core/ElementRegistry';
import type { CircleOptions } from '@/elements/Shape/Circle/CircleOptions';
import type { LineOptions } from '@/elements/Shape/Line/LineOptions';
import type { RectangleOptions } from '@/elements/Shape/Rectangle/RectangleOptions';
import {
  CircleShape,
  createShape,
  getShapeFactories,
  LineShape,
  RectangleShape,
  registerShapeFactory,
  StarShape,
} from '@/elements/Shape/registry';
import type { StarOptions } from '@/elements/Shape/Star/StarOptions';

const Rectangle = 'shape:rectangle' as const;
const Circle = 'shape:circle' as const;
const Star = 'shape:star' as const;
const Line = 'shape:line' as const;

function create(type: typeof Rectangle, options: RectangleOptions): RectangleShape;
function create(type: typeof Circle, options: CircleOptions): CircleShape;
function create(type: typeof Star, options: StarOptions): StarShape;
function create(type: typeof Line, options: LineOptions): LineShape;
function create(type: string, options: BaseOptions): BaseElement<BaseOptions> {
  return createShape({ ...options, type });
}

function register(type: string, factory: ElementFactory): void {
  registerShapeFactory(type, factory);
}

export const Shape = {
  Rectangle,
  Circle,
  Star,
  Line,
  create,
  register,
  get factories(): ReadonlyMap<string, ElementFactory> {
    return getShapeFactories();
  },
} as const;

export type { CircleOptions, LineOptions, RectangleOptions, StarOptions };
export {
  CircleShape,
  getShapeFactories,
  LineShape,
  RectangleShape,
  registerShapeFactory,
  StarShape,
};
