import { Container, Sprite, Texture } from 'pixi.js';
import { BaseElement } from '@/core/BaseElement';
import type { SVGOptions } from '@/elements/SVG/SVGOptions';

export class SVGElement extends BaseElement<SVGOptions> {
  private sprite: Sprite | null = null;
  private blobUrl: string | null = null;

  async init(): Promise<void> {
    this.displayObject = new Container();
    await this.loadSVG();
    this.applyBaseTransform();
    this.centerPivot();
  }

  async update(next: Partial<SVGOptions>): Promise<void> {
    const srcChanged = next.src !== undefined && next.src !== this.options.src;
    Object.assign(this.options, next);

    if (srcChanged) {
      await this.loadSVG();
    } else if (this.sprite) {
      if (next.width !== undefined) this.sprite.width = next.width;
      if (next.height !== undefined) this.sprite.height = next.height;
    }

    this.applyBaseTransform();
    this.centerPivot();
  }

  destroy(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.displayObject.destroy({ children: true });
  }

  private async loadSVG(): Promise<void> {
    this.displayObject.removeChildren();
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }

    const src = this.options.src;
    let imgUrl = src;
    if (src.trim().startsWith('<')) {
      imgUrl = this.svgStringToUrl(src);
      this.blobUrl = imgUrl;
    }

    const img = await this.loadImage(imgUrl);
    const w = this.options.width ?? img.naturalWidth;
    const h = this.options.height ?? img.naturalHeight;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create 2D canvas context for SVG rasterization.');
    }
    ctx.drawImage(img, 0, 0, w, h);

    const texture = Texture.from(offscreen);
    this.sprite = new Sprite(texture);
    this.sprite.width = w;
    this.sprite.height = h;
    this.displayObject.addChild(this.sprite);
  }

  private svgStringToUrl(svgString: string): string {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}
