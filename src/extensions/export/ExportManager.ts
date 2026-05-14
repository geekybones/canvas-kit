import { Rectangle } from 'pixi.js';
import type { CanvasContext } from '@/core/CanvasContext';
import type { Extension } from '@/extensions/Extension';
import { createExportAccessor } from '@/extensions/export/accessor';
import type { ExportMode, ExportOptions, ExportQuality } from '@/extensions/export/types';
import type { InteractionManager } from '@/extensions/interaction/InteractionManager';

type ExportFormat = 'png' | 'base64';

type ExportCanvas = {
  toDataURL(type?: string): string;
  toBlob(callback: BlobCallback, type?: string): void;
};

type RectLike = { x: number; y: number; width: number; height: number };

export class ExportManager implements Extension {
  readonly name = 'export';
  accessors?: { export: ReturnType<typeof createExportAccessor> };
  private ctx!: CanvasContext;

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.accessors = {
      export: createExportAccessor(() => ctx.getExtension<ExportManager>('export')),
    };
  }

  async render(format: ExportFormat, options: ExportOptions = {}): Promise<Blob | string> {
    if (format === 'base64') {
      return await this.withHiddenOverlay(async () =>
        this.renderBase64(this.extractCanvas(options)),
      );
    }

    if (format === 'png') {
      return await this.withHiddenOverlay(async () => this.renderPng(this.extractCanvas(options)));
    }

    throw new Error(`Unknown export format: "${format}"`);
  }

  private async withHiddenOverlay<T>(work: () => Promise<T> | T): Promise<T> {
    const interaction = this.ctx.getExtension<InteractionManager>('interaction');
    interaction?.setOverlayVisible(false);

    try {
      return await work();
    } finally {
      interaction?.setOverlayVisible(true);
    }
  }

  private extractCanvas(options: ExportOptions): ExportCanvas {
    const pixiApp = this.ctx.app.getPixiApp();
    const canvas = pixiApp.renderer.extract.canvas({
      target: pixiApp.stage,
      frame: this.getExportFrame(options.mode ?? 'content', options.margin ?? 0),
      resolution: this.getExportResolution(options),
      clearColor: options.backgroundColor ?? this.ctx.options.backgroundColor ?? 'transparent',
      antialias: options.antialias ?? true,
    });

    if (!canvas.toDataURL || !canvas.toBlob) {
      throw new Error('Extracted canvas does not support export methods');
    }

    return {
      toDataURL: (type) => canvas.toDataURL?.(type) ?? '',
      toBlob: (callback, type) => {
        canvas.toBlob?.(callback, type);
      },
    };
  }

  private getExportResolution(options: ExportOptions): number {
    if (typeof options.resolution === 'number') {
      return Math.max(1, options.resolution);
    }

    return this.getQualityResolution(options.quality ?? 'standard');
  }

  private getQualityResolution(quality: ExportQuality): number {
    if (quality === 'ultra') return 3;
    if (quality === 'hd') return 2;
    return 1;
  }

  private getExportFrame(mode: ExportMode, margin: number): Rectangle {
    const pixiApp = this.ctx.app.getPixiApp();

    if (mode === 'viewport') {
      return new Rectangle(0, 0, pixiApp.screen.width, pixiApp.screen.height);
    }

    return this.boundsToFrame(this.getContentBounds(), margin);
  }

  private getContentBounds(): RectLike {
    const boundsList = Array.from(this.ctx.registry.getAll().values())
      .filter((element) => element.getOptions().visible !== false)
      .map((element) => element.getDisplayObject().getBounds())
      .filter((bounds) => bounds.width > 0 && bounds.height > 0);

    const [first, ...rest] = boundsList;

    if (!first) {
      const pixiApp = this.ctx.app.getPixiApp();
      return { x: 0, y: 0, width: pixiApp.screen.width, height: pixiApp.screen.height };
    }

    let minX = first.x;
    let minY = first.y;
    let maxX = first.x + first.width;
    let maxY = first.y + first.height;

    for (const bounds of rest) {
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  private boundsToFrame(bounds: RectLike, margin: number): Rectangle {
    const safeMargin = Math.max(0, margin);
    const x = Math.floor(bounds.x - safeMargin);
    const y = Math.floor(bounds.y - safeMargin);
    const right = Math.ceil(bounds.x + bounds.width + safeMargin);
    const bottom = Math.ceil(bounds.y + bounds.height + safeMargin);

    return new Rectangle(x, y, Math.max(1, right - x), Math.max(1, bottom - y));
  }

  private renderBase64(canvas: ExportCanvas): string {
    return canvas.toDataURL('image/png');
  }

  private async renderPng(canvas: ExportCanvas): Promise<Blob> {
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('Failed to export PNG'));
      }, 'image/png');
    });
  }
}
