import { CullerPlugin, extensions, Application as PixiApplication } from 'pixi.js';
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
    }
  }

  getPixiApp(): PixiApplication {
    if (!this.app) throw new Error('CanvasKit not initialized — await canvas.ready first');
    return this.app;
  }

  getCanvas(): HTMLCanvasElement {
    if (this.canvasEl) return this.canvasEl;
    return this.container.querySelector('canvas') as HTMLCanvasElement;
  }

  destroy(): void {
    this.destroyed = true;

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
