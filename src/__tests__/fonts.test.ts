import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFontsAccessor } from '@/extensions/fonts/accessor';
import { FontManager } from '@/extensions/fonts/FontManager';

type MockFontFace = {
  family: string;
  source: string;
  load: ReturnType<typeof vi.fn>;
};

describe('FontManager', () => {
  const originalFontFace = globalThis.FontFace;
  const originalFonts = document.fonts;

  beforeEach(() => {
    const loadedFonts: MockFontFace[] = [];
    function makeFontFace(family: string, source: string) {
      return { family, source, load: vi.fn().mockResolvedValue(undefined) };
    }
    const MockFontFaceImpl = vi.fn(makeFontFace);

    Object.defineProperty(globalThis, 'FontFace', {
      value: MockFontFaceImpl,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(document, 'fonts', {
      value: { add: vi.fn((font: MockFontFace) => loadedFonts.push(font)) },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'FontFace', {
      value: originalFontFace,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(document, 'fonts', {
      value: originalFonts,
      configurable: true,
    });
  });

  it('loads a font and marks it as loaded', async () => {
    const manager = new FontManager();

    await manager.load('Manrope', '/fonts/manrope.ttf');

    expect(manager.isLoaded('Manrope')).toBe(true);
    expect(manager.getLoadedFonts()).toEqual(['Manrope']);
  });

  it('deduplicates repeated loads for the same family and url', async () => {
    let resolveLoad: (() => void) | undefined;
    const loadSpy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    function makeFontFaceWithSpy(family: string, source: string) {
      return { family, source, load: loadSpy };
    }
    const MockFontFaceImpl = vi.fn(makeFontFaceWithSpy);
    Object.defineProperty(globalThis, 'FontFace', {
      value: MockFontFaceImpl,
      configurable: true,
      writable: true,
    });

    const manager = new FontManager();
    const first = manager.load('Manrope', '/fonts/manrope.ttf');
    const second = manager.load('Manrope', '/fonts/manrope.ttf');

    expect(MockFontFaceImpl).toHaveBeenCalledTimes(1);
    expect(loadSpy).toHaveBeenCalledTimes(1);

    resolveLoad?.();
    await Promise.all([first, second]);
    expect(manager.getLoadedFonts()).toEqual(['Manrope']);
  });

  it('rejects loading the same family from a different url', async () => {
    const manager = new FontManager();

    await manager.load('Manrope', '/fonts/manrope.ttf');
    await expect(manager.load('Manrope', '/fonts/manrope-alt.ttf')).rejects.toThrow(
      'already loaded',
    );
  });

  it('preloadFont loads a font given family and url', async () => {
    const manager = new FontManager();

    await manager.preloadFont('Manrope', '/fonts/manrope.ttf');

    expect(manager.isLoaded('Manrope')).toBe(true);
  });

  it('preloadFont no-ops when family or url is missing', async () => {
    const manager = new FontManager();
    const loadSpy = vi.spyOn(manager, 'load');

    await manager.preloadFont(undefined, '/fonts/manrope.ttf');
    await manager.preloadFont('Manrope', undefined);

    expect(loadSpy).not.toHaveBeenCalled();
  });
});

describe('createFontsAccessor', () => {
  it('throws when fonts extension is unavailable', async () => {
    const accessor = createFontsAccessor(() => undefined);

    await expect(accessor.load('Manrope', '/fonts/manrope.ttf')).rejects.toThrow(
      'Fonts extension is disabled',
    );
    expect(accessor.isLoaded('Manrope')).toBe(false);
    expect(accessor.getLoadedFonts()).toEqual([]);
  });
});
