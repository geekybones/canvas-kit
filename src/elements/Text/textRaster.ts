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
    ...(stroke !== undefined && strokeWidth > 0
      ? {
          stroke: withAlpha(stroke, strokeAlpha),
          strokeThickness: strokeWidth,
        }
      : {}),
    ...(lineHeight !== undefined ? { lineHeight } : {}),
  });
}

function withAlpha(color: number | string, alpha: number): string {
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));

  if (typeof color === 'number') {
    const hex = `#${color.toString(16).padStart(6, '0').slice(-6)}`;
    return hexToRgba(hex, normalizedAlpha);
  }

  return hexToRgba(color, normalizedAlpha);
}

function hexToRgba(value: string, alpha: number): string {
  let normalized = value.trim();

  if (normalized.startsWith('#')) {
    normalized = normalized.slice(1);
  }

  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function measureRasterTextLayout(options: TextStyleOptions): CanvasTextMetrics {
  return CanvasTextMetrics.measureText(options.text || ' ', createRasterTextStyle(options));
}

export function measureRasterTextWidth(options: TextStyleOptions): number {
  const metrics = measureRasterTextLayout({
    ...options,
    lineHeight: undefined,
  });
  return Math.max(metrics.width, 1);
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
