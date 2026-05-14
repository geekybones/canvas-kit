import type { BaseOptions } from '@/core/BaseOptions';

export interface SVGOptions extends BaseOptions {
  readonly type: 'svg';
  src: string;
  width?: number;
  height?: number;
}
