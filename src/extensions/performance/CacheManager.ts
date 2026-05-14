import { Assets } from 'pixi.js';

export class CacheManager {
  private readonly trackedUrls = new Map<string, number>();

  retain(url: string): void {
    this.trackedUrls.set(url, (this.trackedUrls.get(url) ?? 0) + 1);
  }

  async release(url: string): Promise<void> {
    const count = this.trackedUrls.get(url);
    if (count === undefined) return;

    if (count <= 1) {
      this.trackedUrls.delete(url);
      try {
        await Assets.unload(url);
      } catch {
        // Texture may not have been loaded via Assets
      }
    } else {
      this.trackedUrls.set(url, count - 1);
    }
  }

  async clear(): Promise<void> {
    const urls = [...this.trackedUrls.keys()];
    this.trackedUrls.clear();
    await Promise.all(
      urls.map(async (url) => {
        try {
          await Assets.unload(url);
        } catch {
          // Texture may not have been loaded via Assets
        }
      }),
    );
  }
}
