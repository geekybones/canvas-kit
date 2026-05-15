import { Assets, Container, Sprite } from 'pixi.js';
import { BaseElement } from '@/core/BaseElement';
import type { CanvasContext } from '@/core/CanvasContext';
import type { ImageOptions } from '@/elements/Image/ImageOptions';
import type { PerformanceManager } from '@/extensions/performance/PerformanceManager';

export class ImageElement extends BaseElement<ImageOptions> {
  private sprite: Sprite | null = null;
  private perf: PerformanceManager | undefined;

  constructor(options: ImageOptions, ctx?: CanvasContext) {
    super(options);
    this.perf = ctx?.getExtension<PerformanceManager>('performance');
  }

  async init(): Promise<void> {
    this.displayObject = new Container();
    this.perf?.cacheManager.retain(this.options.src);
    await this.loadSprite();
    this.applyBaseTransform();
    this.centerPivot();
  }

  async update(next: Partial<ImageOptions>): Promise<void> {
    const oldSrc = this.options.src;
    const srcChanged = next.src !== undefined && next.src !== oldSrc;
    Object.assign(this.options, next);

    if (srcChanged) {
      this.perf?.cacheManager.retain(this.options.src);
      await this.loadSprite();
      void this.perf?.cacheManager.release(oldSrc);
    } else if (this.sprite) {
      if (next.width !== undefined) this.sprite.width = next.width;
      if (next.height !== undefined) this.sprite.height = next.height;
      if (next.tint !== undefined) this.sprite.tint = next.tint;
    }

    this.applyBaseTransform();
    this.centerPivot();
  }

  destroy(): void {
    const src = this.options.src;
    this.displayObject.destroy({ children: true });
    void this.perf?.cacheManager.release(src);
  }

  private async loadSprite(): Promise<void> {
    this.displayObject.removeChildren();
    const texture = await Assets.load(this.options.src);
    this.sprite = new Sprite(texture);

    if (this.options.width !== undefined) this.sprite.width = this.options.width;
    if (this.options.height !== undefined) this.sprite.height = this.options.height;
    if (this.options.tint !== undefined) this.sprite.tint = this.options.tint;

    this.displayObject.addChild(this.sprite);
  }
}
