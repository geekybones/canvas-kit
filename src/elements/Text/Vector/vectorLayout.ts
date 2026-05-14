import type { TextDecorationSegment, VectorTextRenderOptions } from '@/elements/Text/types';
import type {
  FontAdapterFont,
  FontAdapterGlyph,
  FontAdapterMetrics,
} from '@/elements/Text/Vector/fontAdapter';

export type LayoutLine = {
  text: string;
  width: number;
};

export type LineLayout = {
  x: number;
  width: number;
  baselineY: number;
};

export type ScaledFontMetrics = {
  ascent: number;
  descent: number;
  underlineOffset: number;
  underlineThickness: number;
  strikePosition: number;
};

export function scaleFontMetrics(
  metrics: FontAdapterMetrics,
  fontSize: number,
  unitsPerEm: number,
): ScaledFontMetrics {
  const scale = fontSize / unitsPerEm;

  return {
    ascent: metrics.ascent * scale,
    descent: metrics.descent * scale,
    underlineOffset: metrics.underlinePosition * scale,
    underlineThickness: Math.max(1, metrics.underlineThickness * scale),
    strikePosition: metrics.strikePosition * scale,
  };
}

export function buildDecorationSegments(
  lineLayouts: LineLayout[],
  metrics: ScaledFontMetrics,
): TextDecorationSegment[] {
  return lineLayouts
    .filter((line) => line.width > 0)
    .map((line) => ({
      x: line.x,
      width: line.width,
      underlineY: line.baselineY + metrics.underlineOffset,
      strikethroughY: line.baselineY - metrics.strikePosition,
    }));
}

export function getAlignedOffsetX(
  align: VectorTextRenderOptions['align'],
  layoutWidth: number,
  lineWidth: number,
): number {
  switch (align) {
    case 'center':
      return Math.max((layoutWidth - lineWidth) / 2, 0);
    case 'right':
      return Math.max(layoutWidth - lineWidth, 0);
    default:
      return 0;
  }
}

export function layoutTextLines(
  text: string,
  font: FontAdapterFont,
  fontSize: number,
  letterSpacing: number,
): LayoutLine[] {
  const paragraphs = text.split('\n');
  const lines: LayoutLine[] = [];

  for (const paragraph of paragraphs) {
    lines.push({
      text: paragraph,
      width: measureTextWidth(paragraph, font, fontSize, letterSpacing),
    });
  }

  return lines.length > 0
    ? lines
    : [{ text: ' ', width: measureTextWidth(' ', font, fontSize, letterSpacing) }];
}

function measureTextWidth(
  text: string,
  font: FontAdapterFont,
  fontSize: number,
  letterSpacing: number,
): number {
  if (text.length === 0) return 0;

  const glyphs = font.stringToGlyphs(text);
  let width = 0;
  let previousGlyph: FontAdapterGlyph | null = null;

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];

    if (!glyph) {
      continue;
    }

    if (previousGlyph) {
      const kerning = font.getKerningValue(previousGlyph, glyph);
      width += (kerning * fontSize) / font.unitsPerEm;
    }

    width += ((glyph.advanceWidth ?? 0) * fontSize) / font.unitsPerEm;

    if (i < glyphs.length - 1) {
      width += letterSpacing;
    }

    previousGlyph = glyph;
  }

  return width;
}
