export type { ImageOptions } from '@/elements/Image/ImageOptions';

export type { CircleOptions } from '@/elements/Shape/Circle/CircleOptions';
export type { LineOptions } from '@/elements/Shape/Line/LineOptions';
export type { RectangleOptions } from '@/elements/Shape/Rectangle/RectangleOptions';
export type { StarOptions } from '@/elements/Shape/Star/StarOptions';

export type { SVGOptions } from '@/elements/SVG/SVGOptions';

export type { TextOptions } from '@/elements/Text/types';

import type { ImageOptions } from '@/elements/Image/ImageOptions';
import type { CircleOptions } from '@/elements/Shape/Circle/CircleOptions';
import type { LineOptions } from '@/elements/Shape/Line/LineOptions';
import type { RectangleOptions } from '@/elements/Shape/Rectangle/RectangleOptions';
import type { StarOptions } from '@/elements/Shape/Star/StarOptions';
import type { SVGOptions } from '@/elements/SVG/SVGOptions';
import type { TextOptions } from '@/elements/Text/types';

export type ShapeOptions = RectangleOptions | CircleOptions | StarOptions | LineOptions;

export type ElementOptions = TextOptions | ImageOptions | ShapeOptions | SVGOptions;

// Distributes Partial<> over each union member so element-specific fields are reachable.
// Partial<TextOptions | ImageOptions> collapses to only common keys; this preserves all.
type DistributedPartial<T> = T extends unknown ? Partial<T> : never;
export type ElementPatch = DistributedPartial<ElementOptions>;
export type ElementType = ElementOptions['type'];
