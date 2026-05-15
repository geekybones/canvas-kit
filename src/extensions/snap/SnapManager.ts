import type { CanvasContext } from '@/core/CanvasContext';
import { getCanvasWorldBounds, getElementWorldBounds } from '@/core/canvasBounds';
import type { CameraManager } from '@/extensions/camera/CameraManager';
import type { Extension } from '@/extensions/Extension';
import type { GridManager } from '@/extensions/grid/GridManager';
import { createSnapAccessor } from '@/extensions/snap/accessor';
import { SnapLines } from '@/extensions/snap/SnapLines';
import { resolveSnap } from '@/extensions/snap/SnapResolver';
import {
  DEFAULT_SNAP_CONFIG,
  type Guide,
  type InternalSnapResult,
  type ResolveOptions,
  type SnapConfig,
  type SnapResult,
  type SnapState,
} from '@/extensions/snap/types';

export class SnapManager implements Extension {
  readonly name = 'snap';
  accessors?: { snap: ReturnType<typeof createSnapAccessor> };
  private cfg: Required<SnapConfig>;
  private ctx!: CanvasContext;
  private guides = new Map<string, Guide>();
  private lines?: SnapLines;

  constructor(config: SnapConfig = {}) {
    this.cfg = { ...DEFAULT_SNAP_CONFIG, ...config };
  }

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    const pixi = ctx.app.getPixiApp();
    this.lines = new SnapLines(pixi.stage, {
      color: this.cfg.lineColor,
      alpha: this.cfg.lineAlpha,
      width: this.cfg.lineWidth,
    });
    this.accessors = {
      snap: createSnapAccessor(() => ctx.getExtension<SnapManager>('snap')),
    };
  }

  // ─── Main API ─────────────────────────────────────────────────────────────

  resolve(x: number, y: number, opts: ResolveOptions = {}): InternalSnapResult {
    return resolveSnap(
      this.cfg,
      this.guides,
      this.ctx.registry,
      () => this.getGridCellSize(),
      (id) => {
        const element = this.ctx.registry.get(id);
        return element ? getElementWorldBounds(this.ctx, element) : null;
      },
      x,
      y,
      opts,
    );
  }

  showLines(result: SnapResult): void {
    const visibleBounds = getCanvasWorldBounds(this.ctx);
    const { lineX, lineY } = this.toScreenLinePositions(result.lineX, result.lineY);
    const topLeft = this.toScreenPoint(visibleBounds.x, visibleBounds.y);
    const bottomRight = this.toScreenPoint(
      visibleBounds.x + visibleBounds.width,
      visibleBounds.y + visibleBounds.height,
    );
    this.lines?.update(
      lineX,
      lineY,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y,
      topLeft.x,
      topLeft.y,
    );
  }

  hideLines(): void {
    this.lines?.hide();
  }

  getThreshold(): number {
    return this.cfg.threshold;
  }

  // ─── Guide management ─────────────────────────────────────────────────────

  addGuide(guide: Guide): void {
    this.guides.set(guide.id, guide);
  }

  removeGuide(id: string): void {
    this.guides.delete(id);
  }

  clearGuides(): void {
    this.guides.clear();
  }

  // ─── Runtime config ───────────────────────────────────────────────────────

  configure(patch: Partial<SnapConfig>): void {
    Object.assign(this.cfg, patch);
    this.lines?.setStyle({
      color: this.cfg.lineColor,
      alpha: this.cfg.lineAlpha,
      width: this.cfg.lineWidth,
    });
  }

  getState(): SnapState {
    return {
      config: { ...this.cfg },
      guides: [...this.guides.values()].map((guide) => ({ ...guide })),
    };
  }

  private getGridCellSize(): number {
    const grid = this.ctx.getExtension<GridManager>('grid');
    return grid?.getState().cellSize ?? 20;
  }

  private toScreenLinePositions(
    lineX: number | undefined,
    lineY: number | undefined,
  ): { lineX: number | undefined; lineY: number | undefined } {
    return {
      lineX: lineX === undefined ? undefined : this.toScreenPoint(lineX, 0).x,
      lineY: lineY === undefined ? undefined : this.toScreenPoint(0, lineY).y,
    };
  }

  private toScreenPoint(x: number, y: number): { x: number; y: number } {
    const camera = this.ctx.getExtension<CameraManager>('camera');
    if (!camera) {
      return { x, y };
    }
    return camera.worldToScreen(x, y);
  }

  destroy(): void {
    this.guides.clear();
    this.lines?.destroy();
    this.lines = undefined;
  }
}
