import type { FederatedPointerEvent } from 'pixi.js';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { buildDuplicateOptions, getMaxElementZIndex } from '@/core/duplicateOptions';
import { createContextMenuAccessor } from '@/extensions/contextMenu/accessor';
import { renderDefaultContextMenu } from '@/extensions/contextMenu/MenuRenderer';
import type { ContextMenuEvent, ContextMenuOpenOptions } from '@/extensions/contextMenu/types';
import type { Extension } from '@/extensions/Extension';
import { AddCommand } from '@/extensions/history/commands/AddCommand';
import { RemoveCommand } from '@/extensions/history/commands/RemoveCommand';
import type { HistoryManager } from '@/extensions/history/HistoryManager';
import type { InteractionManager } from '@/extensions/interaction/InteractionManager';
import type { LayerManager } from '@/extensions/layering/LayerManager';
import type { SerializationManager } from '@/extensions/serialization/SerializationManager';
import type { SerializedElement } from '@/extensions/serialization/types';

export class ContextMenuManager implements Extension {
  readonly name = 'contextMenu';
  accessors?: { contextMenu: ReturnType<typeof createContextMenuAccessor> };
  private ctx!: CanvasContext;
  private menuEl: HTMLElement | null = null;
  private cleanupFns: Array<() => void> = [];
  private readonly elementListeners = new Map<
    string,
    {
      displayObject: {
        on(event: 'pointerdown' | 'rightclick', handler: (e: FederatedPointerEvent) => void): void;
        off(event: 'pointerdown' | 'rightclick', handler: (e: FederatedPointerEvent) => void): void;
      };
      onPointerDown: (e: FederatedPointerEvent) => void;
      onRightClick: (e: FederatedPointerEvent) => void;
    }
  >();

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.accessors = {
      contextMenu: createContextMenuAccessor(() =>
        ctx.getExtension<ContextMenuManager>('contextMenu'),
      ),
    };

    const canvas = ctx.app.getCanvas();
    const onCanvasContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    canvas.addEventListener('contextmenu', onCanvasContextMenu);
    this.cleanupFns.push(() => canvas.removeEventListener('contextmenu', onCanvasContextMenu));

    const onElementAdded = (id: string) => {
      this.syncElementListeners(id);
    };
    ctx.events.on('element:added', onElementAdded);
    this.cleanupFns.push(() => ctx.events.off('element:added', onElementAdded));

    const onElementUpdated = (id: string) => {
      this.syncElementListeners(id);
    };
    ctx.events.on('element:updated', onElementUpdated);
    this.cleanupFns.push(() => ctx.events.off('element:updated', onElementUpdated));

    const onElementRemoved = (id: string) => {
      this.detachElementListeners(id);
    };
    ctx.events.on('element:removed', onElementRemoved);
    this.cleanupFns.push(() => ctx.events.off('element:removed', onElementRemoved));

    const onDocumentClick = () => this.close();
    const onDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeyDown);
    this.cleanupFns.push(
      () => document.removeEventListener('click', onDocumentClick),
      () => document.removeEventListener('keydown', onDocumentKeyDown),
    );
  }

  open(id: string, options: ContextMenuOpenOptions): void {
    this.close();

    const el = this.ctx.registry.get(id);
    if (!el) return;

    const targetIds = this.resolveTargetIds(id);
    const selected = targetIds.map((targetId) => this.serializeElement(targetId));
    const originalEvent =
      options.originalEvent ??
      new MouseEvent('contextmenu', {
        clientX: options.position.x,
        clientY: options.position.y,
      });

    const actions = {
      delete: () => {
        const history = this.ctx.getExtension<HistoryManager>('history');
        if (history) {
          void history.execute(new RemoveCommand(this.ctx, [...targetIds]));
        } else {
          for (const targetId of targetIds) this.ctx.removeElement(targetId);
        }
        this.close();
      },
      duplicate: () => {
        void this.duplicateElements(targetIds);
        this.close();
      },
      bringToFront: () => {
        this.getLayerManager()?.bringToFront([...targetIds]);
        this.close();
      },
      sendToBack: () => {
        this.getLayerManager()?.sendToBack([...targetIds]);
        this.close();
      },
      bringForward: () => {
        this.getLayerManager()?.bringForward(targetIds[0] ?? '');
        this.close();
      },
      sendBackward: () => {
        this.getLayerManager()?.sendBackward(targetIds[0] ?? '');
        this.close();
      },
      normalizeZIndex: () => {
        this.getLayerManager()?.normalizeZIndex();
        this.close();
      },
    };

    const payload: ContextMenuEvent = {
      selected,
      position: options.position,
      originalEvent,
      actions,
    };

    const contextMenuConfig =
      typeof this.ctx.options.extensions?.contextMenu === 'object'
        ? this.ctx.options.extensions.contextMenu
        : undefined;
    const userHandler = contextMenuConfig?.onElement;
    if (userHandler) {
      userHandler(payload);
      return;
    }

    this.menuEl = renderDefaultContextMenu(payload);
  }

  close(): void {
    if (this.menuEl) {
      this.menuEl.remove();
      this.menuEl = null;
    }
  }

  private getLayerManager(): LayerManager | undefined {
    return this.ctx.getExtension<LayerManager>('layering');
  }

  private getInteractionManager(): InteractionManager | undefined {
    return this.ctx.getExtension<InteractionManager>('interaction');
  }

  private resolveTargetIds(id: string): string[] {
    const interaction = this.getInteractionManager();
    const selectedIds = interaction ? [...interaction.getSelectedIds()] : [];
    if (!selectedIds.includes(id)) {
      interaction?.select(id);
      return [id];
    }
    return selectedIds.length ? selectedIds : [id];
  }

  private async duplicateElements(ids: readonly string[]): Promise<void> {
    const snapshots = ids
      .map((id) => this.ctx.registry.get(id)?.getOptions())
      .filter((options): options is BaseOptions => options !== undefined)
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    if (!snapshots.length) {
      return;
    }

    const duplicates = buildDuplicateOptions(snapshots, getMaxElementZIndex(this.ctx.registry) + 1);

    const history = this.ctx.getExtension<HistoryManager>('history');
    if (history) {
      await history.execute(new AddCommand(this.ctx, duplicates));
    } else {
      for (const duplicate of duplicates) {
        await this.ctx.addElement(this.ctx.registry.createFromOptions(duplicate));
      }
    }

    this.getInteractionManager()?.select(duplicates.map((duplicate) => duplicate.id));
  }
  private serializeElement(id: string): SerializedElement {
    const element = this.ctx.registry.get(id);
    const serializer = this.ctx.getExtension<SerializationManager>('serialization');
    if (!element) {
      return { id, type: 'shape:rectangle' };
    }

    return serializer?.serialize(element) ?? (element.getOptions() as SerializedElement);
  }

  private detachElementListeners(id: string): void {
    const listenerSet = this.elementListeners.get(id);
    if (!listenerSet) return;

    listenerSet.displayObject.off('pointerdown', listenerSet.onPointerDown);
    listenerSet.displayObject.off('rightclick', listenerSet.onRightClick);
    this.elementListeners.delete(id);
  }

  private syncElementListeners(id: string): void {
    const element = this.ctx.registry.get(id);
    if (!element || element.getOptions().selectable === false) {
      this.detachElementListeners(id);
      return;
    }
    if (this.elementListeners.has(id)) {
      return;
    }

    const displayObject = element.getDisplayObject();
    const openFromPointer = (e: FederatedPointerEvent) => {
      e.stopPropagation();
      const nativeEvent = e.nativeEvent as MouseEvent;
      this.open(id, {
        position: { x: nativeEvent.clientX, y: nativeEvent.clientY },
        originalEvent: nativeEvent,
      });
    };
    const onPointerDown = (e: FederatedPointerEvent) => {
      if (e.button !== 2) return;
      openFromPointer(e);
    };
    const onRightClick = (e: FederatedPointerEvent) => {
      openFromPointer(e);
    };

    displayObject.on('pointerdown', onPointerDown);
    displayObject.on('rightclick', onRightClick);
    this.elementListeners.set(id, { displayObject, onPointerDown, onRightClick });
  }

  destroy(): void {
    this.close();
    for (const id of this.elementListeners.keys()) {
      this.detachElementListeners(id);
    }
    for (const cleanup of this.cleanupFns) cleanup();
    this.cleanupFns = [];
  }
}
