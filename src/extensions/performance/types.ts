export type PerformanceAccessor = {
  retainAsset(url: string): void;
  releaseAsset(url: string): Promise<void>;
  clearAssets(): Promise<void>;
};
