import type { Mesh, MeshGeometry, Shader } from 'pixi.js';

import type { BaseOptions } from '@/core/BaseOptions';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextStrokeAlign = 'inside' | 'center' | 'outside';
export type TextEffect =
  | 'Normal'
  | 'Curved'
  | 'Arch'
  | 'Bridge'
  | 'Valley'
  | 'Pinch'
  | 'Perspective'
  | 'Pointed'
  | 'Bulge'
  | 'Downward'
  | 'Upward'
  | 'Cone';

export interface TextEffectOptions {
  type: TextEffect;
  intensity?: number;
  direction?: 'up' | 'down';
  radius?: number;
}

export interface TextStyleOptions {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: number | string;
  background?: number | string;
  backgroundAlpha?: number;
  backgroundPadding?: number;
  stroke?: number | string;
  strokeWidth?: number;
  strokeAlpha?: number;
  strokeAlign?: TextStrokeAlign;
  fontWeight?: string;
  fontStyle?: string;
  underline?: boolean;
  strikethrough?: boolean;
  letterSpacing?: number;
  align?: TextAlign;
  lineHeight?: number;
}

export interface BaseTextOptions extends BaseOptions, TextStyleOptions {
  /**
   * Used for vector text rendering (glyph outlines). Optional for standard raster text.
   * If you enable vector effects and omit this, we fall back to a default font URL.
   */
  fontUrl?: string;
  effect?: TextEffectOptions;
}

export type StandardTextOptions = BaseTextOptions & {
  renderMode?: 'standard';
};

export type VectorTextOptions = BaseTextOptions & {
  renderMode: 'vector';
  fontUrl: string;
};

export type TextOptions = (StandardTextOptions | VectorTextOptions) & {
  readonly type: 'text';
};

export interface MeshEffectColumn {
  dy: number;
  scaleY?: number;
  anchorY?: number;
}

export interface MeshEffectFnContext {
  textureWidth: number;
  textureHeight: number;
  fontSize: number;
  radius: number;
  intensity: number;
  direction: 'up' | 'down';
}

export type MeshEffectFunction = (t: number, ctx: MeshEffectFnContext) => MeshEffectColumn;

export interface MeshEffectEntry {
  fn: MeshEffectFunction;
  columns: number;
}

export interface RegisterMeshEffectOptions {
  columns?: number;
}

export interface VectorTextRenderOptions
  extends Omit<TextStyleOptions, 'fontSize' | 'fill' | 'letterSpacing'> {
  fontUrl: string;
  fontSize: number;
  fill: number | string;
  letterSpacing: number;
}

export interface TextDecorationSegment {
  x: number;
  width: number;
  underlineY: number;
  strikethroughY: number;
}

export interface VectorTextTemplate {
  positions: Float32Array;
  indices: Uint32Array;
  decorationSegments: TextDecorationSegment[];
  textureWidth: number;
  textureHeight: number;
}

export interface VectorTextLayer {
  geometry: MeshGeometry;
  mesh: Mesh;
  shader: Shader;
  originalPositions: Float32Array;
}

export interface VectorTextState {
  template: VectorTextTemplate;
  fillLayer: VectorTextLayer;
  strokeLayers: VectorTextLayer[];
  decorationLayers: VectorTextLayer[];
  columns: number;
  textureWidth: number;
  textureHeight: number;
}
