import type { Bounds } from 'pixi.js';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { combineBounds, getCanvasWorldBounds, getElementWorldBounds } from '@/core/canvasBounds';
import { createAlignmentAccessor } from '@/extensions/alignment/accessor';
import type { AlignmentMode } from '@/extensions/alignment/types';
import type { Extension } from '@/extensions/Extension';
import { CompositeCommand } from '@/extensions/history/commands/CompositeCommand';
import { UpdateCommand } from '@/extensions/history/commands/UpdateCommand';
import type { HistoryManager } from '@/extensions/history/HistoryManager';
import type { InteractionManager } from '@/extensions/interaction/InteractionManager';

type ElementWithBounds = {
  element: BaseElement<BaseOptions>;
  bounds: Bounds;
};

export class AlignmentManager implements Extension {
  readonly name = 'alignment';
  accessors?: { alignment: ReturnType<typeof createAlignmentAccessor> };
  private ctx!: CanvasContext;

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.accessors = {
      alignment: createAlignmentAccessor(
        () => ctx.getExtension<AlignmentManager>('alignment') as AlignmentManager | undefined,
      ),
    };
  }

  async align(mode: AlignmentMode, ids?: readonly string[]): Promise<void> {
    const targetElements = this.getTargetElements(ids);
    const targets = targetElements.map((element) => ({
      element,
      bounds: getElementWorldBounds(this.ctx, element),
    }));
    if (targets.length === 0) {
      return;
    }

    const referenceBounds = this.getReferenceBounds(targets);
    const updates = targets
      .map(({ element, bounds }) => {
        const patch = this.getAlignmentPatch(mode, bounds, referenceBounds, element.getOptions());
        if (!patch) {
          return null;
        }

        return {
          element,
          patch,
        };
      })
      .filter(
        (item): item is { element: BaseElement<BaseOptions>; patch: Partial<BaseOptions> } =>
          item !== null,
      );

    if (updates.length === 0) {
      return;
    }

    const history = this.getHistoryManager();
    if (!history?.shouldTrack('align')) {
      for (const { element, patch } of updates) {
        await element.update(patch);
        this.ctx.events.emit('element:updated', element.getId());
      }
      return;
    }

    const commands = updates
      .map(({ element, patch }) =>
        UpdateCommand.create(this.ctx, element.getId(), 'align', element.getOptions(), patch),
      )
      .filter((command): command is UpdateCommand => command !== null);

    if (commands.length === 0) {
      return;
    }

    await history.execute(new CompositeCommand('Align objects', 'align', commands));
  }

  private getTargetElements(ids?: readonly string[]): BaseElement<BaseOptions>[] {
    const targetIds =
      ids && ids.length > 0
        ? [...ids]
        : (this.ctx.getExtension<InteractionManager>('interaction')?.getSelectedIds() ?? []);

    return targetIds
      .map((id) => this.ctx.registry.get(id))
      .filter((element): element is BaseElement<BaseOptions> => Boolean(element));
  }

  private getReferenceBounds(targets: readonly ElementWithBounds[]): Bounds {
    if (targets.length === 1) {
      return getCanvasWorldBounds(this.ctx);
    }

    return combineBounds(targets.map((item) => item.bounds));
  }

  private getAlignmentPatch(
    mode: AlignmentMode,
    bounds: Bounds,
    groupBounds: Bounds,
    options: BaseOptions,
  ): Partial<BaseOptions> | null {
    const next: Partial<BaseOptions> = {};

    if (mode === 'left' || mode === 'center' || mode === 'right') {
      const currentAnchorX = this.getAnchorX(mode, bounds);
      const targetAnchorX = this.getAnchorX(mode, groupBounds);
      const dx = targetAnchorX - currentAnchorX;
      if (dx !== 0) {
        next.x = (options.x ?? 0) + dx;
      }
    }

    if (mode === 'top' || mode === 'middle' || mode === 'bottom') {
      const currentAnchorY = this.getAnchorY(mode, bounds);
      const targetAnchorY = this.getAnchorY(mode, groupBounds);
      const dy = targetAnchorY - currentAnchorY;
      if (dy !== 0) {
        next.y = (options.y ?? 0) + dy;
      }
    }

    return Object.keys(next).length > 0 ? next : null;
  }

  private getAnchorX(mode: 'left' | 'center' | 'right', bounds: Bounds): number {
    if (mode === 'left') return bounds.x;
    if (mode === 'right') return bounds.x + bounds.width;
    return bounds.x + bounds.width / 2;
  }

  private getAnchorY(mode: 'top' | 'middle' | 'bottom', bounds: Bounds): number {
    if (mode === 'top') return bounds.y;
    if (mode === 'bottom') return bounds.y + bounds.height;
    return bounds.y + bounds.height / 2;
  }

  private getHistoryManager(): HistoryManager | undefined {
    return this.ctx.getExtension<HistoryManager>('history');
  }
}
