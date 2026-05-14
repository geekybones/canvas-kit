import type { BaseOptions } from '@/core/BaseOptions';
import type { StrokeAlign } from '@/elements/Shape/strokeAlign';

export interface CircleOptions extends BaseOptions {
  readonly type: 'shape:circle';
  radius?: number;
  width?: number;
  height?: number;
  fill?: number;
  fillAlpha?: number;
  stroke?: number;
  strokeWidth?: number;
  strokeAlpha?: number;
  strokeAlign?: StrokeAlign;
}
