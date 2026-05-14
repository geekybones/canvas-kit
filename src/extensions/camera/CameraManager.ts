import { Container } from 'pixi.js';
import type { CanvasContext } from '@/core/CanvasContext';
import type { CameraState } from '@/core/Events';
import { createCameraAccessor } from '@/extensions/camera/accessor';
import {
  attachPanControls,
  attachPinchZoom,
  attachWheelZoom,
  createCameraShortcuts,
} from '@/extensions/camera/CameraControls';
import { screenToWorldPoint, worldToScreenPoint } from '@/extensions/camera/CameraTransforms';
import type { CameraConfig } from '@/extensions/camera/types';
import type { Extension } from '@/extensions/Extension';

const DEFAULTS: Required<CameraConfig> = {
  zoom: 1,
  minZoom: 0.1,
  maxZoom: 20,
  zoomStep: 0.1,
  wheelZoom: true,
};

export class CameraManager implements Extension {
  readonly name = 'camera';
  accessors?: { camera: ReturnType<typeof createCameraAccessor> };
  private cfg: Required<CameraConfig>;
  private ctx!: CanvasContext;
  readonly worldContainer: Container;
  private zoom: number;
  private shortcuts?: ReturnType<typeof createCameraShortcuts>;
  private panModifierActive = false;
  private panning = false;
  private cleanupFns: Array<() => void> = [];

  constructor(config: CameraConfig = {}) {
    this.cfg = { ...DEFAULTS, ...config };
    this.zoom = this.cfg.zoom;
    this.worldContainer = new Container();
    this.worldContainer.label = 'world';
    this.worldContainer.sortableChildren = true;
    this.worldContainer.zIndex = 0;
  }

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.accessors = {
      camera: createCameraAccessor(() => ctx.getExtension<CameraManager>('camera')),
    };
    const pixi = ctx.app.getPixiApp();

    pixi.stage.addChild(this.worldContainer);

    const onElementAdded = (id: string) => {
      const el = ctx.registry.get(id);
      if (!el) return;
      const dObj = el.getDisplayObject();
      // addChild auto-removes from previous parent in PixiJS v8
      if (dObj.parent !== this.worldContainer) {
        this.worldContainer.addChild(dObj);
      }
    };
    ctx.events.on('element:added', onElementAdded);
    this.cleanupFns.push(() => ctx.events.off('element:added', onElementAdded));

    this.setupKeyboard();
    this.setupWheel();
    this.setupPinch();
    this.setupPan();

    if (this.zoom !== 1) {
      const cx = pixi.screen.width / 2;
      const cy = pixi.screen.height / 2;
      this.applyZoom(this.zoom, cx, cy);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  getZoom(): number {
    return this.zoom;
  }

  isPanModifierActive(): boolean {
    return this.panModifierActive;
  }

  isPanning(): boolean {
    return this.panning;
  }

  getState(): CameraState {
    return { zoom: this.zoom, x: this.worldContainer.x, y: this.worldContainer.y };
  }

  setState(next: Partial<CameraState>): void {
    const zoom = next.zoom ?? this.zoom;
    const clampedZoom = Math.min(this.cfg.maxZoom, Math.max(this.cfg.minZoom, zoom));
    this.zoom = clampedZoom;
    this.worldContainer.scale.set(clampedZoom);
    this.setWorldPosition(next.x ?? this.worldContainer.x, next.y ?? this.worldContainer.y);
  }

  setZoom(zoom: number, anchorX?: number, anchorY?: number): void {
    const pixi = this.ctx.app.getPixiApp();
    this.applyZoom(zoom, anchorX ?? pixi.screen.width / 2, anchorY ?? pixi.screen.height / 2);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return screenToWorldPoint(this.worldContainer, screenX, screenY);
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return worldToScreenPoint(this.worldContainer, worldX, worldY);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private applyZoom(newZoom: number, anchorX: number, anchorY: number, emit = true): void {
    const clamped = Math.min(this.cfg.maxZoom, Math.max(this.cfg.minZoom, newZoom));
    const worldAnchor = this.screenToWorld(anchorX, anchorY);

    this.zoom = clamped;
    this.worldContainer.scale.set(clamped);
    const anchorAfterZoom = this.worldToScreen(worldAnchor.x, worldAnchor.y);
    this.setWorldPosition(
      this.worldContainer.x + (anchorX - anchorAfterZoom.x),
      this.worldContainer.y + (anchorY - anchorAfterZoom.y),
      emit,
    );
  }

  private setWorldPosition(x: number, y: number, emit = true): void {
    this.worldContainer.position.set(x, y);
    if (emit) {
      this.emitChanged();
    }
  }

  private emitChanged(): void {
    this.ctx.events.emit('camera:changed', this.getState());
  }

  private setupKeyboard(): void {
    const canvas = this.ctx.app.getCanvas();
    this.shortcuts = createCameraShortcuts(canvas, {
      zoomIn: () => this.stepZoom(1),
      zoomOut: () => this.stepZoom(-1),
      reset: () => this.setState({ zoom: 1, x: 0, y: 0 }),
    });
  }

  private setupWheel(): void {
    const canvas = this.ctx.app.getCanvas();
    this.cleanupFns.push(
      attachWheelZoom(
        canvas,
        this.cfg.wheelZoom,
        () => this.zoom,
        (zoom, anchorX, anchorY) => this.applyZoom(zoom, anchorX, anchorY),
      ),
    );
  }

  private setupPinch(): void {
    const canvas = this.ctx.app.getCanvas();
    this.cleanupFns.push(
      ...attachPinchZoom(
        canvas,
        () => this.zoom,
        (zoom, anchorX, anchorY) => this.applyZoom(zoom, anchorX, anchorY),
      ),
    );
  }

  private setupPan(): void {
    const canvas = this.ctx.app.getCanvas();
    this.cleanupFns.push(
      ...attachPanControls({
        canvas,
        getPanModifierActive: () => this.panModifierActive,
        setPanModifierActive: (active) => {
          this.panModifierActive = active;
        },
        getPanning: () => this.panning,
        setPanning: (active) => {
          this.panning = active;
        },
        getWorldPosition: () => ({ x: this.worldContainer.x, y: this.worldContainer.y }),
        setWorldPosition: (x, y) => this.setWorldPosition(x, y),
      }),
    );
  }

  private stepZoom(direction: 1 | -1, anchorX?: number, anchorY?: number): void {
    const factor = 1 + this.cfg.zoomStep;
    const nextZoom = direction > 0 ? this.zoom * factor : this.zoom / factor;
    this.setZoom(nextZoom, anchorX, anchorY);
  }

  destroy(): void {
    this.shortcuts?.destroy();
    for (const cleanup of this.cleanupFns) cleanup();
    this.cleanupFns = [];
    // worldContainer children are elements managed by CanvasKit; app.destroy() cleans them up
  }
}
