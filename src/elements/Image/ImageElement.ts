import { Assets, Container, Sprite } from 'pixi.js';
import { BaseElement } from '@/core/BaseElement';
import type { ImageOptions } from '@/elements/Image/ImageOptions';

export class ImageElement extends BaseElement<ImageOptions> {
  private sprite: Sprite | null = null;

  async init(): Promise<void> {
    this.displayObject = new Container();
    await this.loadSprite();
    this.applyBaseTransform();
    this.centerPivot();
  }

  async update(next: Partial<ImageOptions>): Promise<void> {
    const srcChanged = next.src !== undefined && next.src !== this.options.src;
    Object.assign(this.options, next);

    if (srcChanged) {
      await this.loadSprite();
    } else if (this.sprite) {
      if (next.width !== undefined) this.sprite.width = next.width;
      if (next.height !== undefined) this.sprite.height = next.height;
      if (next.tint !== undefined) this.sprite.tint = next.tint;
    }

    this.applyBaseTransform();
    this.centerPivot();
  }

  destroy(): void {
    this.displayObject.destroy({ children: true });
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
