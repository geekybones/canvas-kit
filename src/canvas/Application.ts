import {
  CullerPlugin,
  extensions,
  Graphics,
  Application as PixiApplication,
  RenderTexture,
  Sprite,
} from 'pixi.js';
import 'pixi.js/prepare';

export interface ApplicationConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  preference?: 'webgl' | 'webgpu' | Array<'webgl' | 'webgpu'>;
}

export class Application {
  private app!: PixiApplication;
  public readonly ready: Promise<void>;
  private destroyed = false;
  private initialized = false;
  private canvasEl: HTMLCanvasElement | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly config: ApplicationConfig = {},
  ) {
    this.ready = this.initAsync();
  }

  private async initAsync(): Promise<void> {
    this.app = new PixiApplication();

    extensions.add(CullerPlugin);

    await this.app.init({
      preference: this.config.preference ?? ['webgpu', 'webgl'],
      width: this.config.width ?? 1920,
      height: this.config.height ?? 1080,
      background: this.config.backgroundColor ?? '#ffffff',
      antialias:
        typeof window === 'undefined' ||
        !('ontouchstart' in window && navigator.maxTouchPoints > 1) ||
        window.devicePixelRatio >= 2,
      autoDensity: true,
      resolution: typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1,
      gcActive: true,
      gcMaxUnusedTime: 120_000,
      gcFrequency: 60_000,
    });

    this.canvasEl = this.app.canvas as HTMLCanvasElement;
    this.container.appendChild(this.canvasEl);

    this.canvasEl.setAttribute('tabindex', '0');
    this.canvasEl.style.outline = 'none';

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    if (this.destroyed) {
      this.destroy();
      return;
    }

    this.initialized = true;
  }

  getPixiApp(): PixiApplication {
    if (!this.initialized || this.destroyed) {
      throw new Error('CanvasKit not initialized — await canvas.ready first');
    }
    return this.app;
  }

  getCanvas(): HTMLCanvasElement {
    if (this.canvasEl) return this.canvasEl;
    return this.container.querySelector('canvas') as HTMLCanvasElement;
  }

  get width(): number {
    if (this.destroyed || !this.initialized) {
      return this.config.width ?? 1920;
    }
    return this.app.screen.width;
  }

  get height(): number {
    if (this.destroyed || !this.initialized) {
      return this.config.height ?? 1080;
    }
    return this.app.screen.height;
  }

  resize(width: number, height: number): void {
    if (this.destroyed || !this.initialized) return;
    this.app.renderer.resize(width, height);
  }

  async warmup(): Promise<void> {
    if (this.destroyed || !this.initialized) return;

    const stage = this.app.stage;

    // Cover the three main PixiJS shader/pipeline paths:
    // Graphics fill, Graphics stroke, and the texture batch renderer (used by images and text)
    const g = new Graphics();
    g.rect(0, 0, 1, 1).fill({ color: 0x000000 });
    g.rect(0, 0, 1, 1).stroke({ color: 0x000000, width: 1 });

    const texture = RenderTexture.create({ width: 1, height: 1 });
    const sprite = new Sprite(texture);

    stage.addChild(g, sprite);

    // Pre-upload geometry and textures to the GPU before the first real render.
    // The prepare plugin (imported at the top of this file) adds renderer.prepare.
    type PrepareRenderer = { prepare?: { upload(obj: unknown): Promise<void> } };
    await (this.app.renderer as unknown as PrepareRenderer).prepare?.upload(stage);

    this.app.render();

    stage.removeChild(g, sprite);
    g.destroy();
    sprite.destroy();
    texture.destroy();
  }

  destroy(): void {
    this.destroyed = true;
    this.initialized = false;

    const canvas = this.canvasEl;
    if (canvas?.parentNode === this.container) {
      this.container.removeChild(canvas);
    }
    this.canvasEl = null;

    if (this.app && (this.app as unknown as { renderer?: unknown }).renderer) {
      this.app.destroy({ releaseGlobalResources: true });
    }
  }
}
