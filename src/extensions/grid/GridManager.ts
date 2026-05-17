import { Graphics, type Texture, TilingSprite } from 'pixi.js';
import type { CanvasContext } from '@/core/CanvasContext';
import type { CameraManager } from '@/extensions/camera/CameraManager';
import type { Extension } from '@/extensions/Extension';
import { createGridAccessor } from '@/extensions/grid/accessor';
import type { GridConfig, GridState } from '@/extensions/grid/types';

const DEFAULTS: Required<GridConfig> = {
  cellSize: 20,
  majorInterval: 5,
  visible: true,
  minorLineColor: 0x000000,
  minorLineAlpha: 0.07,
  majorLineColor: 0x000000,
  majorLineAlpha: 0.2,
};

export class GridManager implements Extension {
  readonly name = 'grid';
  accessors?: { grid: ReturnType<typeof createGridAccessor> };
  private cfg: Required<GridConfig>;
  private sprite?: TilingSprite;
  private ctx!: CanvasContext;
  private cleanupFns: Array<() => void> = [];
  private readonly textureCache = new Map<string, Texture>();

  constructor(config: GridConfig = {}) {
    this.cfg = { ...DEFAULTS, ...config };
  }

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.createSprite();
    this.accessors = {
      grid: createGridAccessor(() => ctx.getExtension<GridManager>('grid')),
    };

    const onCameraChanged = (state: { zoom: number; x: number; y: number }) => {
      this.syncCameraTransform(state);
    };
    ctx.events.on('camera:changed', onCameraChanged);
    this.cleanupFns.push(() => ctx.events.off('camera:changed', onCameraChanged));
  }

  private createGridTexture() {
    const pixi = this.ctx.app.getPixiApp();
    const {
      cellSize,
      majorInterval,
      minorLineColor,
      minorLineAlpha,
      majorLineColor,
      majorLineAlpha,
    } = this.cfg;
    const tileSize = cellSize * majorInterval;

    const g = new Graphics();

    // Interior minor lines (skip 0 and majorInterval — those are major borders)
    for (let i = 1; i < majorInterval; i++) {
      const pos = i * cellSize;
      g.moveTo(pos, 0).lineTo(pos, tileSize).moveTo(0, pos).lineTo(tileSize, pos);
    }
    g.stroke({ color: minorLineColor, alpha: minorLineAlpha, width: 1 });

    // Major border lines (top and left edges of the repeating tile)
    g.moveTo(0, 0).lineTo(tileSize, 0).moveTo(0, 0).lineTo(0, tileSize);
    g.stroke({ color: majorLineColor, alpha: majorLineAlpha, width: 1 });

    const texture = pixi.renderer.generateTexture(g);
    g.destroy();
    return texture;
  }

  private getOrCreateTexture(): Texture {
    const key = `${this.cfg.cellSize}:${this.cfg.majorInterval}`;
    const cached = this.textureCache.get(key);
    if (cached) return cached;
    const texture = this.createGridTexture();
    this.textureCache.set(key, texture);
    return texture;
  }

  private createSprite(): void {
    const pixi = this.ctx.app.getPixiApp();
    const texture = this.getOrCreateTexture();
    const { width, height } = pixi.screen;
    this.sprite = new TilingSprite({ texture, width, height });
    this.sprite.zIndex = -1000;
    this.sprite.visible = this.cfg.visible;
    pixi.stage.addChild(this.sprite);
    const cameraState = this.ctx.getExtension<CameraManager>('camera')?.getState() ?? {
      zoom: 1,
      x: 0,
      y: 0,
    };
    this.syncCameraTransform(cameraState);
  }

  private updateTexture(): void {
    if (!this.sprite) return;
    const oldTexture = this.sprite.texture;
    const newTexture = this.getOrCreateTexture();
    if (oldTexture !== newTexture) {
      // Remove the old entry from cache and free its GPU memory
      for (const [key, tex] of this.textureCache) {
        if (tex === oldTexture) {
          this.textureCache.delete(key);
          break;
        }
      }
      oldTexture.destroy(true);
      this.sprite.texture = newTexture;
    }
    const cameraState = this.ctx.getExtension<CameraManager>('camera')?.getState() ?? {
      zoom: 1,
      x: 0,
      y: 0,
    };
    this.syncCameraTransform(cameraState);
  }

  private syncVisibility(): void {
    if (this.sprite) {
      this.sprite.visible = this.cfg.visible;
    }
  }

  private syncCameraTransform({ zoom, x, y }: { zoom: number; x: number; y: number }): void {
    if (!this.sprite) return;
    this.sprite.tileScale.set(zoom);
    const tilePixels = this.cfg.cellSize * this.cfg.majorInterval * zoom;
    this.sprite.tilePosition.x = x % tilePixels;
    this.sprite.tilePosition.y = y % tilePixels;
  }

  getState(): GridState {
    return {
      cellSize: this.cfg.cellSize,
      majorInterval: this.cfg.majorInterval,
      visible: this.cfg.visible,
    };
  }

  setVisible(visible: boolean): void {
    this.cfg.visible = visible;
    this.syncVisibility();
  }

  setCellSize(size: number): void {
    this.cfg.cellSize = size;
    this.updateTexture();
  }

  setMajorInterval(interval: number): void {
    this.cfg.majorInterval = interval;
    this.updateTexture();
  }

  destroy(): void {
    for (const cleanup of this.cleanupFns) cleanup();
    this.cleanupFns = [];
    this.sprite?.destroy(true);
    this.sprite = undefined;
    for (const texture of this.textureCache.values()) {
      texture.destroy(true);
    }
    this.textureCache.clear();
  }
}
