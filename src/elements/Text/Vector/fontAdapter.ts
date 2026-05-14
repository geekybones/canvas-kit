import { type Font, type Glyph, parse } from 'opentype.js';

export type FontPathCommandType = 'M' | 'L' | 'Q' | 'C' | 'Z';

export interface FontPathCommand {
  type: FontPathCommandType;
  values: number[];
}

export interface FontPath {
  commands: FontPathCommand[];
}

export interface FontAdapterGlyph {
  id: number;
  advanceWidth: number;
}

export interface FontAdapterMetrics {
  ascent: number;
  descent: number;
  underlinePosition: number;
  underlineThickness: number;
  strikePosition: number;
}

export interface FontAdapterFont {
  unitsPerEm: number;
  metrics: FontAdapterMetrics;
  stringToGlyphs(text: string): FontAdapterGlyph[];
  getKerningValue(left: FontAdapterGlyph, right: FontAdapterGlyph): number;
  getGlyphPath(glyph: FontAdapterGlyph, fontSize: number): FontPath;
}

const fontCache = new Map<string, Promise<FontAdapterFont>>();

function convertPath(opentypePath: ReturnType<Glyph['getPath']>): FontPath {
  const commands: FontPathCommand[] = [];

  for (const cmd of opentypePath.commands) {
    switch (cmd.type) {
      case 'M':
        commands.push({ type: 'M', values: [cmd.x, cmd.y] });
        break;
      case 'L':
        commands.push({ type: 'L', values: [cmd.x, cmd.y] });
        break;
      case 'Q':
        commands.push({ type: 'Q', values: [cmd.x1, cmd.y1, cmd.x, cmd.y] });
        break;
      case 'C':
        commands.push({ type: 'C', values: [cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y] });
        break;
      case 'Z':
        commands.push({ type: 'Z', values: [] });
        break;
    }
  }

  return { commands };
}

function createFontAdapter(font: Font): FontAdapterFont {
  const { unitsPerEm } = font;

  return {
    unitsPerEm,
    metrics: {
      ascent: font.ascender ?? unitsPerEm * 0.8,
      descent: Math.abs(font.descender ?? unitsPerEm * 0.2),
      underlinePosition: Math.abs(font.tables.post?.underlinePosition ?? unitsPerEm * 0.08),
      underlineThickness: Math.abs(font.tables.post?.underlineThickness ?? unitsPerEm * 0.05),
      strikePosition: font.tables.os2?.yStrikeoutPosition ?? unitsPerEm * 0.3,
    },
    stringToGlyphs(text: string): FontAdapterGlyph[] {
      return font
        .stringToGlyphs(text)
        .filter((g) => g.index >= 0)
        .map((g) => ({ id: g.index, advanceWidth: g.advanceWidth ?? 0 }));
    },
    getKerningValue(left: FontAdapterGlyph, right: FontAdapterGlyph): number {
      const l = font.glyphs.get(left.id);
      const r = font.glyphs.get(right.id);
      if (!l || !r) return 0;
      return font.getKerningValue(l, r) ?? 0;
    },
    getGlyphPath(glyph: FontAdapterGlyph, fontSize: number): FontPath {
      const g = font.glyphs.get(glyph.id);
      if (!g) return { commands: [] };
      return convertPath(g.getPath(0, 0, fontSize));
    },
  };
}

export async function loadFont(fontUrl: string): Promise<FontAdapterFont> {
  const cached = fontCache.get(fontUrl);
  if (cached) return cached;

  const promise = (async () => {
    if (fontUrl.toLowerCase().endsWith('.woff2')) {
      throw new Error(
        `Font "${fontUrl}" is a WOFF2 file. opentype.js does not support WOFF2; use a .woff, .ttf, or .otf font instead.`,
      );
    }

    const response = await fetch(fontUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch font "${fontUrl}". Status: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();

    try {
      const font = parse(buffer);
      return createFontAdapter(font);
    } catch (error) {
      throw new Error(
        `Failed to parse font "${fontUrl}". Use a .woff, .ttf, or .otf file. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  })();

  fontCache.set(fontUrl, promise);
  return promise;
}
