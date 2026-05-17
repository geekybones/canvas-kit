import type { BaseOptions } from '@/core/BaseOptions';
import type { StrokeAlign } from '@/elements/Shape/strokeAlign';

export interface LineOptions extends BaseOptions {
  readonly type: 'shape:line';
  width: number;
  stroke?: number | string;
  strokeWidth?: number;
  strokeAlpha?: number;
  strokeAlign?: StrokeAlign;
}
