export type PerformanceAccessor = {
  markDirty(id: string): void;
  isDirty(id: string): boolean;
  flushDirty(): readonly string[];
  clearDirty(): void;
  retainAsset(url: string): void;
  releaseAsset(url: string): Promise<void>;
  clearAssets(): Promise<void>;
};
