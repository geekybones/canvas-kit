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

export const loadedFonts = new Set<string>();
export const pendingFonts = new Set<string>();

const pendingPromises = new Map<string, Promise<void>>();

export function preloadFont(font: FontMeta, onLoaded?: () => void): Promise<void> {
  if (loadedFonts.has(font.id)) return Promise.resolve();
  const existing = pendingPromises.get(font.id);
  if (existing) return existing;
  const url = getWoffUrl(font);
  if (!url) return Promise.resolve();
  pendingFonts.add(font.id);
  const promise = new FontFace(font.family, `url(${url})`)
    .load()
    .then((face) => {
      document.fonts.add(face);
      loadedFonts.add(font.id);
      onLoaded?.();
    })
    .catch(() => {
      pendingFonts.delete(font.id);
      pendingPromises.delete(font.id);
    })
    .finally(() => pendingPromises.delete(font.id));
  pendingPromises.set(font.id, promise);
  return promise;
}
