import metadata from '../../assets/fonts/metadata.json';

export type FontFiles = Record<string, { woff: string }>;

export type FontMeta = {
  id: string;
  family: string;
  category: string;
  defaultWeight: number;
  files: FontFiles;
};

export const FONTS: readonly FontMeta[] = (metadata as { fonts: FontMeta[] }).fonts;

const fontFileModules = import.meta.glob('../../assets/fonts/**/*.woff', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function resolveUrl(relativePath: string): string {
  return fontFileModules[`../../assets/fonts/${relativePath}`] ?? '';
}

export function getWoffUrl(font: FontMeta, weight = font.defaultWeight, style = 'normal'): string {
  const variant = font.files[`${weight}-${style}`];
  return variant ? resolveUrl(variant.woff) : '';
}

const fontsByFamily = new Map(FONTS.map((f) => [f.family.toLowerCase(), f]));

export function resolveFontUrlFromFamily(fontFamily: string): string {
  const font = fontsByFamily.get(fontFamily.toLowerCase());
  return font ? getWoffUrl(font) : '';
}
