import { CanvasTextMetrics, Text, TextStyle } from 'pixi.js';
import type { TextStyleOptions } from '@/elements/Text/types';

export function createRasterTextNode(options: TextStyleOptions): Text {
  return new Text({
    text: options.text,
    style: createRasterTextStyle(options),
  });
}

export function createRasterTextStyle(options: TextStyleOptions): TextStyle {
  const {
    fontFamily = 'Arial',
    fontSize = 24,
    fill = 0x000000,
    stroke,
    strokeWidth = 0,
    strokeAlpha = 1,
    fontWeight = 'normal',
    fontStyle = 'normal',
    letterSpacing = 0,
    align = 'left',
    lineHeight,
  } = options;

  return new TextStyle({
    fontFamily,
    fontSize,
    fill,
    fontWeight: fontWeight as 'normal' | 'bold',
    fontStyle: fontStyle as 'normal' | 'italic' | 'oblique',
    letterSpacing,
    align,
    padding: Math.ceil(fontSize * 0.3),
    ...(stroke !== undefined && strokeWidth > 0
      ? { stroke: { color: stroke, alpha: strokeAlpha, width: strokeWidth } }
      : {}),
    ...(lineHeight !== undefined ? { lineHeight } : {}),
  });
}

export function measureRasterTextLayout(options: TextStyleOptions): CanvasTextMetrics {
  return CanvasTextMetrics.measureText(options.text || ' ', createRasterTextStyle(options));
}

export function updateRasterTextResolution(
  textNode: Text | null,
  scaleX: number,
  scaleY: number,
): void {
  if (!textNode) return;

  const dpr = window.devicePixelRatio ?? 1;
  const maxScale = Math.max(Math.abs(scaleX), Math.abs(scaleY), 1);
  textNode.resolution = dpr * maxScale;
}
