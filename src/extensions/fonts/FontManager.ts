import type { CanvasContext } from '@/core/CanvasContext';
import type { Extension } from '@/extensions/Extension';
import { createFontsAccessor } from '@/extensions/fonts/accessor';

type PendingFontLoad = {
  url: string;
  promise: Promise<void>;
};

export class FontManager implements Extension {
  readonly name = 'fonts';
  accessors?: { fonts: ReturnType<typeof createFontsAccessor> };
  private readonly loaded = new Map<string, string>();
  private readonly pending = new Map<string, PendingFontLoad>();

  init(ctx: CanvasContext): void {
    this.accessors = {
      fonts: createFontsAccessor(() => ctx.getExtension<FontManager>('fonts')),
    };
  }

  async load(family: string, url: string): Promise<void> {
    const loadedUrl = this.loaded.get(family);
    if (loadedUrl) {
      if (loadedUrl !== url) {
        throw new Error(
          `Font family "${family}" is already loaded from "${loadedUrl}", cannot load "${url}".`,
        );
      }
      return;
    }

    const pendingLoad = this.pending.get(family);
    if (pendingLoad) {
      if (pendingLoad.url !== url) {
        throw new Error(
          `Font family "${family}" is already loading from "${pendingLoad.url}", cannot load "${url}".`,
        );
      }
      return pendingLoad.promise;
    }

    const promise = this.loadFontFace(family, url);
    this.pending.set(family, { url, promise });
    return promise;
  }

  isLoaded(family: string): boolean {
    return this.loaded.has(family);
  }

  getLoadedFonts(): readonly string[] {
    return [...this.loaded.keys()];
  }

  private async loadFontFace(family: string, url: string): Promise<void> {
    try {
      const font = new FontFace(family, `url(${url})`);
      await font.load();
      document.fonts.add(font);
      this.loaded.set(family, url);
    } finally {
      this.pending.delete(family);
    }
  }
}
