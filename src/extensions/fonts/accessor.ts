import type { FontManager } from '@/extensions/fonts/FontManager';
import type { FontsAccessor } from '@/extensions/fonts/types';

export function createFontsAccessor(getManager: () => FontManager | undefined): FontsAccessor {
  return {
    load: async (family, url) => {
      const fontManager = getManager();
      if (!fontManager) {
        throw new Error('Fonts extension is disabled');
      }
      return fontManager.load(family, url);
    },
    isLoaded: (family) => getManager()?.isLoaded(family) ?? false,
    getLoadedFonts: () => getManager()?.getLoadedFonts() ?? [],
  };
}
