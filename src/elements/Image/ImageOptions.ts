import type { BaseOptions } from '@/core/BaseOptions';

export interface ImageOptions extends BaseOptions {
  readonly type: 'image';
  src: string;
  width?: number;
  height?: number;
  tint?: number | string;
}
