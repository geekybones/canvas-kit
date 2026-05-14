import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import type { Extension } from '@/extensions/Extension';
import { LayerCommand } from '@/extensions/history/commands/LayerCommand';
import type { HistoryManager } from '@/extensions/history/HistoryManager';
import { createLayeringAccessor } from '@/extensions/layering/accessor';

export class LayerManager implements Extension {
  readonly name = 'layering';
  accessors?: { layer: ReturnType<typeof createLayeringAccessor> };
  private ctx!: CanvasContext;
  private cleanupFns: Array<() => void> = [];

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.accessors = {
      layer: createLayeringAccessor(() => ctx.getExtension<LayerManager>('layering')),
    };

    const onElementAdded = (id: string) => {
      const el = ctx.registry.get(id);
      if (el) this.assignTopZIndex(el);
    };
    ctx.events.on('element:added', onElementAdded);
    this.cleanupFns.push(() => ctx.events.off('element:added', onElementAdded));
  }

  private assignTopZIndex(el: BaseElement<BaseOptions>): void {
    if ((el.getOptions().zIndex ?? 0) > 0) {
      return;
    }
    const max = this.getMaxZIndex();
    el.setZIndex(max + 1);
  }

  private getMaxZIndex(): number {
    let max = 0;
    for (const el of this.ctx.registry.getAll().values()) {
      const z = el.getDisplayObject().zIndex;
      if (z > max) max = z;
    }
    return max;
  }

  private getSortedElements(): BaseElement<BaseOptions>[] {
    return [...this.ctx.registry.getAll().values()].sort(
      (a, b) => a.getDisplayObject().zIndex - b.getDisplayObject().zIndex,
    );
  }

  private getLayerSnapshots(
    elements = this.getSortedElements(),
  ): Array<{ id: string; zIndex: number }> {
    return elements.map((el) => ({
      id: el.getId(),
      zIndex: el.getDisplayObject().zIndex,
    }));
  }

  private emitLayerChange(ids: readonly string[]): void {
    for (const id of ids) {
      this.ctx.events.emit('element:updated', id);
    }
    this.ctx.events.emit('layer:changed');
  }

  private getHistoryManager(): HistoryManager | undefined {
    return this.ctx.getExtension<HistoryManager>('history');
  }

  private trackLayerChange(mutate: () => void): void {
    const history = this.getHistoryManager();
    const before = this.getLayerSnapshots();
    mutate();
    const after = this.getLayerSnapshots();
    const changedIds = this.getChangedLayerIds(before, after);

    if (changedIds.length === 0) {
      return;
    }

    if (history?.shouldTrack('zOrder')) {
      history.record(new LayerCommand(this.ctx, before, after));
    }
    this.emitLayerChange(changedIds);
  }

  private getChangedLayerIds(
    before: readonly { id: string; zIndex: number }[],
    after: readonly { id: string; zIndex: number }[],
  ): string[] {
    const beforeMap = new Map(before.map((item) => [item.id, item.zIndex]));
    return after.filter((item) => beforeMap.get(item.id) !== item.zIndex).map((item) => item.id);
  }

  private normalizeIds(idOrIds: string | readonly string[]): string[] {
    return typeof idOrIds === 'string' ? [idOrIds] : [...idOrIds];
  }

  private reorderGroup(idOrIds: string | readonly string[], placement: 'front' | 'back'): void {
    const ids = this.normalizeIds(idOrIds);
    this.trackLayerChange(() => {
      const sorted = this.getSortedElements();
      const moving = sorted.filter((el) => ids.includes(el.getId()));
      const staying = sorted.filter((el) => !ids.includes(el.getId()));
      const ordered = placement === 'front' ? [...staying, ...moving] : [...moving, ...staying];

      let z = 1;
      for (const el of ordered) el.setZIndex(z++);
    });
  }

  bringToFront(idOrIds: string | readonly string[]): void {
    this.reorderGroup(idOrIds, 'front');
  }

  sendToBack(idOrIds: string | readonly string[]): void {
    this.reorderGroup(idOrIds, 'back');
  }

  private swapWithNeighbor(id: string, direction: 'forward' | 'backward'): void {
    this.trackLayerChange(() => {
      const sorted = this.getSortedElements();
      const index = sorted.findIndex((el) => el.getId() === id);
      const neighborIndex = direction === 'forward' ? index + 1 : index - 1;
      if (index < 0 || neighborIndex < 0 || neighborIndex >= sorted.length) {
        return;
      }

      const current = sorted[index];
      const neighbor = sorted[neighborIndex];
      if (!current || !neighbor) return;

      const currentZ = current.getDisplayObject().zIndex;
      current.setZIndex(neighbor.getDisplayObject().zIndex);
      neighbor.setZIndex(currentZ);
    });
  }

  bringForward(id: string): void {
    this.swapWithNeighbor(id, 'forward');
  }

  sendBackward(id: string): void {
    this.swapWithNeighbor(id, 'backward');
  }

  normalizeZIndex(): void {
    this.trackLayerChange(() => {
      const sorted = this.getSortedElements();
      sorted.forEach((el, i) => {
        el.setZIndex(i + 1);
      });
    });
  }

  destroy(): void {
    for (const cleanup of this.cleanupFns) cleanup();
    this.cleanupFns = [];
  }
}
