import { Color } from 'pixi.js';
import { Application } from '@/canvas/Application';
import {
  addManyWithHistory,
  addWithHistory,
  clearElements,
  getElementSnapshot,
  removeWithHistory,
  updateWithHistory,
} from '@/canvas/CanvasKitActions';
import type { CameraState } from '@/core/Events';
import type { CanvasKitOptions } from '@/canvas/CanvasKitOptions';
import type { CameraConfig } from '@/extensions/camera/types';
import { loadElements } from '@/canvas/ElementLoader';
import { loadExtensions } from '@/canvas/ExtensionLoader';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { constrainElementToCanvas, isCanvasConstraintEnabled } from '@/core/canvasBounds';
import { ElementRegistry } from '@/core/ElementRegistry';
import { CanvasEventBus, type CanvasEventMap } from '@/core/Events';
import { TextElement } from '@/elements/Text/TextElement';
import { createAlignmentAccessor } from '@/extensions/alignment/accessor';
import type { AlignmentAccessor } from '@/extensions/alignment/types';
import { createCameraAccessor } from '@/extensions/camera/accessor';
import type { CameraAccessor } from '@/extensions/camera/types';
import { createContextMenuAccessor } from '@/extensions/contextMenu/accessor';
import type { ContextMenuAccessor } from '@/extensions/contextMenu/types';
import { createExportAccessor } from '@/extensions/export/accessor';
import type { ExportAccessor } from '@/extensions/export/types';
import { createFontsAccessor } from '@/extensions/fonts/accessor';
import type { FontManager } from '@/extensions/fonts/FontManager';
import type { FontsAccessor } from '@/extensions/fonts/types';
import { createGridAccessor } from '@/extensions/grid/accessor';
import type { GridAccessor } from '@/extensions/grid/types';
import { createHistoryAccessor } from '@/extensions/history/accessor';
import type { HistoryManager } from '@/extensions/history/HistoryManager';
import type { HistoryAccessor, HistoryTrack } from '@/extensions/history/types';
import { createInteractionAccessor } from '@/extensions/interaction/accessor';
import type { InteractionAccessor } from '@/extensions/interaction/types';
import { createLayeringAccessor } from '@/extensions/layering/accessor';
import type { LayeringAccessor } from '@/extensions/layering/types';
import { createPerformanceAccessor } from '@/extensions/performance/accessor';
import type { PerformanceAccessor } from '@/extensions/performance/types';
import { createSerializerAccessor } from '@/extensions/serialization/accessor';
import type { SerializationManager } from '@/extensions/serialization/SerializationManager';
import type { SerializedElement, SerializerAccessor } from '@/extensions/serialization/types';
import { createSnapAccessor } from '@/extensions/snap/accessor';
import type { SnapAccessor } from '@/extensions/snap/types';
import type { ElementPatch } from '@/types/Elements';

export class CanvasKit {
  public readonly ready: Promise<void>;
  readonly history: HistoryAccessor;
  readonly alignment: AlignmentAccessor;
  readonly layer: LayeringAccessor;
  readonly interaction: InteractionAccessor;
  readonly camera: CameraAccessor;
  readonly contextMenu: ContextMenuAccessor;
  readonly export: ExportAccessor;
  readonly fonts: FontsAccessor;
  readonly grid: GridAccessor;
  readonly performance: PerformanceAccessor;
  readonly serializer: SerializerAccessor;
  readonly snap: SnapAccessor;

  private readonly app: Application;
  private readonly registry: ElementRegistry;
  private readonly events: CanvasEventBus;
  private canvasKitOptions: CanvasKitOptions;
  private readonly extensions = new Map<string, unknown>();
  private ctx!: CanvasContext;
  private destroyed = false;

  constructor(container: HTMLElement, options: CanvasKitOptions = {}) {
    this.canvasKitOptions = options;
    this.events = new CanvasEventBus();
    this.registry = new ElementRegistry();
    this.history = createHistoryAccessor(() => this.getHistoryManager());
    this.alignment = createAlignmentAccessor(() => this.getExtension('alignment'));
    this.layer = createLayeringAccessor(() => this.getExtension('layering'));
    this.interaction = createInteractionAccessor({
      ctx: { getElement: (id) => this.registry.get(id) },
      getManager: () => this.getExtension('interaction'),
    });
    this.camera = createCameraAccessor(() => this.getExtension('camera'));
    this.contextMenu = createContextMenuAccessor(() => this.getExtension('contextMenu'));
    this.export = createExportAccessor(() => this.getExtension('export'));
    this.fonts = createFontsAccessor(() => this.getExtension('fonts'));
    this.grid = createGridAccessor(() => this.getExtension('grid'));
    this.performance = createPerformanceAccessor(() => this.getExtension('performance'));
    this.serializer = createSerializerAccessor(() => this.getSerializationManager());
    this.snap = createSnapAccessor(() => this.getExtension('snap'));
    this.app = new Application(container, {
      width: options.width,
      height: options.height,
      backgroundColor: options.backgroundColor,
      preference: options.preference,
    });
    this.ready = this.app.ready.then(async () => {
      if (this.destroyed) return;
      await this.initExtensions();
    });
  }

  private async initExtensions(): Promise<void> {
    loadElements(this.registry);
    this.ctx = this.buildContext();
    await loadExtensions({
      ctx: this.ctx,
      options: this.canvasKitOptions,
      extensions: this.extensions,
      target: this,
    });
  }

  private buildContext(): CanvasContext {
    return {
      app: this.app,
      registry: this.registry,
      events: this.events,
      options: this.canvasKitOptions,
      stage: this.app.getPixiApp().stage,
      getElement: (id) => this.registry.get(id),
      addElement: (el) => this.addElement(el),
      removeElement: (id) => this.removeElement(id),
      clearElements: () => clearElements(this.registry, (id) => this.removeElement(id)),
      getExtension: <T>(name: string) => this.extensions.get(name) as T | undefined,
      hasExtension: (name: string) => this.extensions.has(name),
    };
  }

  private async addElement(element: BaseElement<BaseOptions>): Promise<void> {
    const existing = this.registry.get(element.getId());
    if (existing) {
      await existing.update(element.getOptions());
      this.events.emit('element:updated', element.getId());
    } else {
      const screen = this.app.getPixiApp().screen;
      element.applyDefaultPosition(screen.width / 2, screen.height / 2);
      await element.init();
      this.registry.add(element);
      this.app.getPixiApp().stage.addChild(element.getDisplayObject());
      this.events.emit('element:added', element.getId());
    }
  }

  private removeElement(id: string): void {
    const el = this.registry.remove(id);
    if (el) {
      this.app.getPixiApp().stage.removeChild(el.getDisplayObject());
      el.destroy();
      this.events.emit('element:removed', id);
    }
  }

  private async updateElement(
    el: BaseElement<BaseOptions>,
    next: Partial<BaseOptions>,
  ): Promise<void> {
    if (el instanceof TextElement && ('fontFamily' in next || 'fontUrl' in next)) {
      const fontsExt = this.ctx.getExtension<FontManager>('fonts');
      if (fontsExt) {
        const opts = el.getOptions() as { fontFamily?: string; fontUrl?: string };
        const patch = next as { fontFamily?: string; fontUrl?: string };
        await fontsExt.preloadFont(
          patch.fontFamily ?? opts.fontFamily,
          patch.fontUrl ?? opts.fontUrl,
        );
      }
    }
    await el.update(next);
    if (isCanvasConstraintEnabled(this.ctx) && this.shouldConstrainAfterUpdate(next)) {
      await constrainElementToCanvas(this.ctx, el);
    }
    this.events.emit('element:updated', el.getId());
  }

  private shouldConstrainAfterUpdate(next: Partial<BaseOptions>): boolean {
    const keys = Object.keys(next);
    return keys.some(
      (key) =>
        key === 'x' ||
        key === 'y' ||
        key === 'scaleX' ||
        key === 'scaleY' ||
        key === 'rotationDeg' ||
        key === 'width' ||
        key === 'height',
    );
  }

  private getUpdateKind(
    el: BaseElement<BaseOptions>,
    next: Partial<BaseOptions>,
  ): Exclude<HistoryTrack, 'add' | 'remove'> | null {
    const keys = Object.keys(next) as Array<keyof BaseOptions>;

    if (keys.length === 0) {
      return null;
    }

    if (keys.every((key) => key === 'x' || key === 'y')) {
      return 'move';
    }

    if (keys.every((key) => key === 'rotationDeg')) {
      return 'rotate';
    }

    if (keys.every((key) => key === 'zIndex')) {
      return 'zOrder';
    }

    if (el.getType() === 'text') {
      return 'text';
    }

    if (keys.some((key) => key === 'scaleX' || key === 'scaleY')) {
      return 'resize';
    }

    return null;
  }

  private getHistoryManager(): HistoryManager | undefined {
    return this.extensions.get('history') as HistoryManager | undefined;
  }

  private getSerializationManager(): SerializationManager | undefined {
    return this.extensions.get('serialization') as SerializationManager | undefined;
  }

  private getActionsContext() {
    return {
      registry: this.registry,
      getHistoryManager: () => this.getHistoryManager(),
      getSerializationManager: () => this.getSerializationManager(),
      addElement: (element: BaseElement<BaseOptions>) => this.addElement(element),
      removeElement: (id: string) => this.removeElement(id),
      updateElement: (element: BaseElement<BaseOptions>, next: Partial<BaseOptions>) =>
        this.updateElement(element, next),
      getUpdateKind: (element: BaseElement<BaseOptions>, next: Partial<BaseOptions>) =>
        this.getUpdateKind(element, next),
    };
  }

  add(element: BaseElement<BaseOptions>): Promise<string> {
    return addWithHistory(this.getActionsContext(), element);
  }

  addMany(elements: readonly BaseElement<BaseOptions>[]): Promise<string[]> {
    return addManyWithHistory(this.getActionsContext(), elements);
  }

  remove(id: string): Promise<void> {
    return removeWithHistory(this.getActionsContext(), id);
  }

  update(id: string, next: ElementPatch, options?: { track?: boolean }): Promise<void> {
    return updateWithHistory(
      this.getActionsContext(),
      id,
      next as Partial<BaseOptions>,
      options?.track !== false,
    );
  }

  clear(): void {
    clearElements(this.registry, (id) => this.removeElement(id));
  }

  getIds(): string[] {
    return [...this.registry.getAll().keys()];
  }

  getAll(): SerializedElement[] {
    const serializer = this.getSerializationManager();
    return [...this.registry.getAll().values()].map((el) =>
      serializer ? serializer.serialize(el) : (el.getOptions() as SerializedElement),
    );
  }

  get(id: string, raw?: false): SerializedElement | undefined;
  get(id: string, raw: true): BaseElement<BaseOptions> | undefined;
  get(id: string, raw = false): unknown {
    if (raw) {
      return this.registry.get(id);
    }

    return getElementSnapshot(this.registry, () => this.getSerializationManager(), id);
  }

  getExtension<T>(name: string): T | undefined {
    return this.extensions.get(name) as T | undefined;
  }

  /**
   * Hot-patch supported options without recreating the canvas.
   * Handles: backgroundColor, grid config, snap config, camera config,
   * and constrainToCanvas. Extension enable/disable flags still require
   * a full recreation.
   */
  configure(patch: Partial<CanvasKitOptions>): void {
    if (this.destroyed || !this.ctx) return;

    if (patch.backgroundColor !== undefined) {
      this.canvasKitOptions.backgroundColor = patch.backgroundColor;
      const pixi = this.app.getPixiApp();
      pixi.renderer.background.color = new Color(patch.backgroundColor).toNumber();
    }

    if (patch.constrainToCanvas !== undefined) {
      this.canvasKitOptions.constrainToCanvas = patch.constrainToCanvas;
    }

    if (patch.extensions) {
      const ext = patch.extensions;

      if (typeof ext.grid === 'object') {
        const grid = this.extensions.get('grid') as
          | {
              setCellSize?: (n: number) => void;
              setMajorInterval?: (n: number) => void;
              setVisible?: (v: boolean) => void;
            }
          | undefined;
        if (grid) {
          if (ext.grid.cellSize !== undefined) grid.setCellSize?.(ext.grid.cellSize);
          if (ext.grid.majorInterval !== undefined) grid.setMajorInterval?.(ext.grid.majorInterval);
          if (ext.grid.visible !== undefined) grid.setVisible?.(ext.grid.visible);
        }
      }

      if (typeof ext.snap === 'object') {
        const snap = this.extensions.get('snap') as
          | { configure?: (p: typeof ext.snap) => void }
          | undefined;
        snap?.configure?.(ext.snap);
      }

      if (typeof ext.camera === 'object') {
        const camera = this.extensions.get('camera') as
          | { setState?: (s: Partial<CameraState>) => void }
          | undefined;
        const cam = ext.camera as CameraConfig & Partial<CameraState>;
        const state: Partial<CameraState> = {};
        if (cam.zoom !== undefined) state.zoom = cam.zoom;
        if (cam.x !== undefined) state.x = cam.x;
        if (cam.y !== undefined) state.y = cam.y;
        if (Object.keys(state).length > 0) {
          camera?.setState?.(state);
        }
        if (this.canvasKitOptions.extensions) {
          const current = this.canvasKitOptions.extensions.camera;
          this.canvasKitOptions.extensions.camera = {
            ...(typeof current === 'object' ? current : {}),
            ...ext.camera,
          };
        }
      }
    }
  }

  get width(): number {
    return this.app.width;
  }

  get height(): number {
    return this.app.height;
  }

  resize(width: number, height: number): void {
    this.app.resize(width, height);
  }

  async warmup(): Promise<void> {
    await this.ready;
    if (this.destroyed) return;
    await this.app.warmup();
  }

  on<K extends keyof CanvasEventMap>(
    event: K,
    listener: (...args: CanvasEventMap[K]) => void,
  ): this {
    this.events.on(event, listener);
    return this;
  }

  off<K extends keyof CanvasEventMap>(
    event: K,
    listener: (...args: CanvasEventMap[K]) => void,
  ): this {
    this.events.off(event, listener);
    return this;
  }

  destroy(): void {
    this.destroyed = true;
    for (const ext of this.extensions.values()) {
      (ext as { destroy?: () => void } | undefined)?.destroy?.();
    }
    this.extensions.clear();
    // Call each element's own destroy() so custom cleanup runs (blob URLs, shaders, etc.)
    for (const el of this.registry.getAll().values()) {
      el.destroy();
    }
    this.registry.clear();
    this.app.destroy();
  }
}
