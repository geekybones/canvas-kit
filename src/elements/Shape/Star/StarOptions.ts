import type { BaseOptions } from '@/core/BaseOptions';
import type { StrokeAlign } from '@/elements/Shape/strokeAlign';

export interface StarOptions extends BaseOptions {
  readonly type: 'shape:star';
  points: number;
  width: number;
  height: number;
  fill?: number | string;
  fillAlpha?: number;
  stroke?: number | string;
  strokeWidth?: number;
  strokeAlpha?: number;
  strokeAlign?: StrokeAlign;
}
