import type {
  VectorTextRenderOptions,
  VectorTextState,
  VectorTextTemplate,
} from '@/elements/Text/types';
import type { FontAdapterGlyph } from '@/elements/Text/Vector/fontAdapter';
import { loadFont } from '@/elements/Text/Vector/fontAdapter';
import {
  appendGlyphGeometry,
  buildGlyphGeometry,
  getCurveQuality,
} from '@/elements/Text/Vector/glyphGeometry';
import {
  buildDecorationLayers,
  buildStrokeLayers,
  buildVectorLayer,
  getDecorationThickness,
  normalizeGeometryPositions,
} from '@/elements/Text/Vector/vectorLayers';
import {
  buildDecorationSegments,
  getAlignedOffsetX,
  type LineLayout,
  layoutTextLines,
  scaleFontMetrics,
} from '@/elements/Text/Vector/vectorLayout';
import {
  applySyntheticItalic,
  getSyntheticBoldOffsets,
} from '@/elements/Text/Vector/vectorStyleTransforms';

const vectorTemplateCache = new Map<string, Promise<VectorTextTemplate>>();

export function clearVectorTemplateCache(): void {
  vectorTemplateCache.clear();
}

export async function buildVectorTextState(
  opts: VectorTextRenderOptions,
  columns: number,
): Promise<VectorTextState> {
  const template = await getVectorTextTemplate(opts);
  return buildStateFromTemplate(template, opts, columns);
}

function buildStateFromTemplate(
  template: VectorTextTemplate,
  opts: VectorTextRenderOptions,
  columns: number,
): VectorTextState {
  const {
    fill,
    stroke,
    strokeWidth = 0,
    strokeAlpha = 1,
    strokeAlign = 'center',
    fontWeight,
  } = opts;
  const fillLayer = buildVectorLayer(
    new Float32Array(template.positions),
    new Uint32Array(template.indices),
    fill,
    1,
    template.positions,
  );
  const strokeLayers = buildStrokeLayers(
    template.indices,
    template.positions,
    stroke,
    strokeWidth,
    strokeAlpha,
    strokeAlign,
  );
  const decorationLayers = buildDecorationLayers(
    template.decorationSegments,
    fill,
    getDecorationThickness(fontWeight, opts.fontSize),
    opts.underline,
    opts.strikethrough,
    columns,
  );

  return {
    template,
    fillLayer,
    strokeLayers,
    decorationLayers,
    columns: Math.max(1, Math.floor(columns)),
    textureWidth: template.textureWidth,
    textureHeight: template.textureHeight,
  };
}

async function getVectorTextTemplate(opts: VectorTextRenderOptions): Promise<VectorTextTemplate> {
  const key = getVectorTextTemplateKey(opts);
  const cached = vectorTemplateCache.get(key);

  if (cached) {
    return cached;
  }

  const pending = buildVectorTextTemplate(opts).catch((error: unknown) => {
    vectorTemplateCache.delete(key);
    throw error;
  });
  vectorTemplateCache.set(key, pending);
  return pending;
}

async function buildVectorTextTemplate(opts: VectorTextRenderOptions): Promise<VectorTextTemplate> {
  const {
    text,
    fontUrl,
    fontSize,
    fontWeight,
    fontStyle,
    letterSpacing = 0,
    align = 'left',
    lineHeight,
  } = opts;

  const safeText = text && text.length > 0 ? text : ' ';
  const font = await loadFont(fontUrl);
  const quality = getCurveQuality(fontSize);
  const lines = layoutTextLines(safeText, font, fontSize, letterSpacing);
  const lineHeightPx = lineHeight ?? fontSize * 1.2;
  const layoutWidth = Math.max(...lines.map((line) => line.width), 1);
  const lineLayouts: LineLayout[] = [];
  const finalPositions: number[] = [];
  const finalIndices: number[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    if (!line) {
      continue;
    }

    const lineGlyphs = font.stringToGlyphs(line.text);
    let cursorX = getAlignedOffsetX(align, layoutWidth, line.width);
    lineLayouts.push({
      x: cursorX,
      width: line.width,
      baselineY: lineIndex * lineHeightPx,
    });

    let previousGlyph: FontAdapterGlyph | null = null;

    for (let glyphIndex = 0; glyphIndex < lineGlyphs.length; glyphIndex++) {
      const glyph = lineGlyphs[glyphIndex];

      if (!glyph) {
        continue;
      }

      if (previousGlyph) {
        const kerning = font.getKerningValue(previousGlyph, glyph);
        cursorX += (kerning * fontSize) / font.unitsPerEm;
      }

      const glyphGeometry = buildGlyphGeometry(fontUrl, font, glyph, fontSize, quality);
      const styledGlyphGeometry = applySyntheticItalic(glyphGeometry, fontStyle);

      for (const boldOffset of getSyntheticBoldOffsets(fontWeight, fontSize)) {
        appendGlyphGeometry(
          finalPositions,
          finalIndices,
          styledGlyphGeometry,
          cursorX + boldOffset.x,
          lineIndex * lineHeightPx + boldOffset.y,
        );
      }

      cursorX += ((glyph.advanceWidth ?? 0) * fontSize) / font.unitsPerEm;

      if (glyphIndex < lineGlyphs.length - 1) {
        cursorX += letterSpacing;
      }

      previousGlyph = glyph;
    }
  }

  const positions = new Float32Array(finalPositions);
  const indices = new Uint32Array(finalIndices);
  const bounds = normalizeGeometryPositions(positions);
  const normalizedLineLayouts = lineLayouts.map((line) => ({
    x: line.x - bounds.minX,
    width: line.width,
    baselineY: line.baselineY - bounds.minY,
  }));
  const metrics = scaleFontMetrics(font.metrics, fontSize, font.unitsPerEm);

  return {
    positions,
    indices,
    decorationSegments: buildDecorationSegments(normalizedLineLayouts, metrics),
    textureWidth: bounds.width,
    textureHeight: bounds.height,
  };
}

function getVectorTextTemplateKey(opts: VectorTextRenderOptions): string {
  return JSON.stringify({
    text: opts.text,
    fontUrl: opts.fontUrl,
    fontSize: opts.fontSize,
    fontWeight: opts.fontWeight ?? 'normal',
    fontStyle: opts.fontStyle ?? 'normal',
    letterSpacing: opts.letterSpacing,
    align: opts.align ?? 'left',
    lineHeight: opts.lineHeight ?? null,
  });
}
