import type { BaseOptions } from '@/core/BaseOptions';
import type { StrokeAlign } from '@/elements/Shape/strokeAlign';

export interface RectangleOptions extends BaseOptions {
  readonly type: 'shape:rectangle';
  width: number;
  height: number;
  fill?: number;
  fillAlpha?: number;
  stroke?: number;
  strokeWidth?: number;
  strokeAlpha?: number;
  strokeAlign?: StrokeAlign;
  borderRadius?: number;
}
