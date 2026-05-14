export type FontsAccessor = {
  load(family: string, url: string): Promise<void>;
  isLoaded(family: string): boolean;
  getLoadedFonts(): readonly string[];
};
