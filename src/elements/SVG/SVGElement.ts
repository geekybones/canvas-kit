import { Container, DOMAdapter, Sprite, Texture } from 'pixi.js';
import { BaseElement } from '@/core/BaseElement';
import type { SVGOptions } from '@/elements/SVG/SVGOptions';

export class SVGElement extends BaseElement<SVGOptions> {
  private sprite: Sprite | null = null;
  private currentTexture: Texture | null = null;
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
    this.currentTexture?.destroy(true);
    this.currentTexture = null;
    this.displayObject.destroy({ children: true });
  }

  private async loadSVG(): Promise<void> {
    // Destroy previous resources before creating new ones
    this.sprite?.destroy();
    this.sprite = null;
    this.currentTexture?.destroy(true);
    this.currentTexture = null;
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

    const offscreen = DOMAdapter.get().createCanvas(w, h);
    const ctx = (offscreen as HTMLCanvasElement).getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create 2D canvas context for SVG rasterization.');
    }
    ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);

    const texture = Texture.from(offscreen as HTMLCanvasElement);
    this.currentTexture = texture;
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
      const img = DOMAdapter.get().createImage();
      img.onload = () => resolve(img as HTMLImageElement);
      img.onerror = reject;
      img.src = url;
    });
  }
}
