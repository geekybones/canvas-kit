import type { FederatedPointerEvent } from 'pixi.js';
import { Container } from 'pixi.js';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { KeyboardShortcuts } from '@/core/KeyboardShortcuts';
import type { CameraManager } from '@/extensions/camera/CameraManager';
import type { Extension } from '@/extensions/Extension';
import type { HistoryManager } from '@/extensions/history/HistoryManager';
import { createInteractionAccessor } from '@/extensions/interaction/accessor';
import { BoundingBox } from '@/extensions/interaction/BoundingBox';
import {
  copySelected,
  deleteSelected,
  duplicateSelection,
  pasteSelected,
  recordGroupUpdate,
} from '@/extensions/interaction/InteractionActions';
import {
  startElementDrag,
  startResize,
  startRotate,
} from '@/extensions/interaction/InteractionGestures';
import {
  detachSelectableElement,
  syncSelectableElement,
} from '@/extensions/interaction/InteractionSelectionBindings';
import {
  getSelectedElements,
  getSelectedOptions,
  onStagePointerDown,
  setSelection,
  updateBoundingBox,
} from '@/extensions/interaction/InteractionSelectionState';
import type {
  InteractionActionsContext,
  InteractionGesturesContext,
  InteractionSelectionBindingsContext,
  InteractionSelectionStateContext,
  SelectableBinding,
  StartState,
} from '@/extensions/interaction/types';
import type { SnapManager } from '@/extensions/snap/SnapManager';

export class InteractionManager implements Extension {
  readonly name = 'interaction';
  accessors?: { interaction: ReturnType<typeof createInteractionAccessor> };
  private ctx!: CanvasContext;
  private overlayLayer!: Container;
  private boundingBox!: BoundingBox;
  private selectedIds = new Set<string>();
  private shortcuts!: KeyboardShortcuts;
  private cleanupFns: Array<() => void> = [];
  private activeGestureCleanup: (() => void) | undefined;
  private readonly selectableBindings = new Map<string, SelectableBinding>();
  private clipboard: BaseOptions[] = [];
  private selectionStateContext!: InteractionSelectionStateContext;
  private selectionBindingsContext!: InteractionSelectionBindingsContext;
  private gesturesContext!: InteractionGesturesContext;
  private actionsContext!: InteractionActionsContext;

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.accessors = {
      interaction: createInteractionAccessor({
        ctx,
        getManager: () => ctx.getExtension<InteractionManager>('interaction'),
      }),
    };

    this.overlayLayer = new Container();
    this.overlayLayer.zIndex = Number.MAX_SAFE_INTEGER;
    this.overlayLayer.eventMode = 'passive';
    ctx.app.getPixiApp().stage.addChild(this.overlayLayer);

    this.boundingBox = new BoundingBox(this.overlayLayer, ctx.options);
    this.createContexts();
    this.setupHandleEvents();

    const selection = this.getSelectionBindingsContext();
    for (const id of ctx.registry.getAll().keys()) {
      syncSelectableElement(selection, id);
    }

    const onElementAdded = (id: string) => {
      syncSelectableElement(this.getSelectionBindingsContext(), id);
    };
    ctx.events.on('element:added', onElementAdded);
    this.cleanupFns.push(() => ctx.events.off('element:added', onElementAdded));

    const onElementRemoved = (id: string) => {
      this.selectedIds.delete(id);
      detachSelectableElement(this.getSelectionBindingsContext(), id);
      updateBoundingBox(this.getSelectionStateContext());
    };
    ctx.events.on('element:removed', onElementRemoved);
    this.cleanupFns.push(() => ctx.events.off('element:removed', onElementRemoved));

    const onElementUpdated = (id: string) => {
      syncSelectableElement(this.getSelectionBindingsContext(), id);
      if (this.selectedIds.has(id)) {
        updateBoundingBox(this.getSelectionStateContext());
      }
    };
    ctx.events.on('element:updated', onElementUpdated);
    this.cleanupFns.push(() => ctx.events.off('element:updated', onElementUpdated));

    const stage = ctx.app.getPixiApp().stage;
    const handleStagePointerDown = (e: FederatedPointerEvent) => {
      onStagePointerDown(
        {
          ...this.getSelectionStateContext(),
          startElementDrag: (event) => {
            this.registerGestureCleanup(startElementDrag(this.gesturesContext, event));
          },
        },
        e,
      );
    };
    stage.on('pointerdown', handleStagePointerDown);
    this.cleanupFns.push(() => stage.off('pointerdown', handleStagePointerDown));

    this.shortcuts = new KeyboardShortcuts(ctx.app.getCanvas());
    this.shortcuts.register('delete', () => {
      void deleteSelected(this.actionsContext);
    });
    this.shortcuts.register('backspace', () => {
      void deleteSelected(this.actionsContext);
    });
    this.shortcuts.register('ctrl+c', () => copySelected(this.actionsContext));
    this.shortcuts.register('ctrl+v', () => {
      void pasteSelected(this.actionsContext);
    });
    this.shortcuts.register('ctrl+d', () => {
      void duplicateSelection(this.actionsContext);
    });
  }

  private setupHandleEvents(): void {
    for (const handle of this.boundingBox.getHandles()) {
      const handler = handle.handler;
      const position = handle.position;

      if (handler === 'delete') {
        this.attachHandlePointerDown(handle.container, (e) => {
          if (this.isPanBlocked()) return;
          e.stopPropagation();
          void deleteSelected(this.actionsContext);
        });
      } else if (handler === 'duplicate') {
        this.attachHandlePointerDown(handle.container, (e) => {
          if (this.isPanBlocked()) return;
          e.stopPropagation();
          void duplicateSelection(this.actionsContext);
        });
      } else if (handler === 'transform') {
        this.attachHandlePointerDown(handle.container, (e) => {
          if (this.isPanBlocked()) return;
          e.stopPropagation();
          this.registerGestureCleanup(startResize(this.gesturesContext, e, position));
        });
      } else if (handler === 'rotate') {
        this.attachHandlePointerDown(handle.container, (e) => {
          if (this.isPanBlocked()) return;
          e.stopPropagation();
          this.registerGestureCleanup(startRotate(this.gesturesContext, e));
        });
      } else if (typeof handler === 'function') {
        this.attachHandlePointerDown(handle.container, (e) => {
          if (this.isPanBlocked()) return;
          e.stopPropagation();
          handler({ selectedIds: [...this.selectedIds] });
        });
      }
    }
  }

  private attachHandlePointerDown(
    container: {
      on(event: 'pointerdown', handler: (e: FederatedPointerEvent) => void): void;
      off(event: 'pointerdown', handler: (e: FederatedPointerEvent) => void): void;
    },
    handler: (e: FederatedPointerEvent) => void,
  ): void {
    container.on('pointerdown', handler);
    this.cleanupFns.push(() => container.off('pointerdown', handler));
  }

  private isPanBlocked(): boolean {
    const camera = this.getCameraManager();
    return Boolean(camera?.isPanModifierActive() || camera?.isPanning());
  }

  private registerGestureCleanup(cleanup: () => void): void {
    // Abort any in-flight gesture before starting a new one.
    this.activeGestureCleanup?.();
    this.activeGestureCleanup = cleanup;
  }

  setOverlayVisible(visible: boolean): void {
    if (visible) this.boundingBox.show();
    else this.boundingBox.hide();
  }

  select(idOrIds: string | readonly string[] | null): void {
    if (idOrIds === null) {
      setSelection(this.getSelectionStateContext(), null);
      return;
    }

    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const nextSelectedIds: string[] = [];

    for (const id of ids) {
      if (this.ctx.registry.get(id)) {
        nextSelectedIds.push(id);
      }
    }

    setSelection(this.getSelectionStateContext(), nextSelectedIds);
  }

  async duplicate(): Promise<void> {
    await duplicateSelection(this.actionsContext);
  }

  getSelectedIds(): readonly string[] {
    return [...this.selectedIds];
  }

  getSelectedOptions(): BaseOptions[] {
    return getSelectedOptions(this.getSelectionStateContext());
  }

  private getHistoryManager(): HistoryManager | undefined {
    return this.ctx.getExtension<HistoryManager>('history');
  }

  private getCameraManager(): CameraManager | undefined {
    return this.ctx.getExtension<CameraManager>('camera');
  }

  private getSnapManager(): SnapManager | undefined {
    return this.ctx.getExtension<SnapManager>('snap');
  }

  private recordGroupUpdate(
    elements: readonly BaseElement<BaseOptions>[],
    beforeStates: Map<string, StartState | BaseOptions>,
    kind: 'move' | 'resize' | 'rotate',
  ): void {
    recordGroupUpdate(this.actionsContext, elements, beforeStates, kind);
  }

  destroy(): void {
    this.activeGestureCleanup?.();
    this.activeGestureCleanup = undefined;
    for (const id of this.selectableBindings.keys()) {
      detachSelectableElement(this.getSelectionBindingsContext(), id);
    }
    this.shortcuts?.destroy();
    for (const cleanup of this.cleanupFns) cleanup();
    this.cleanupFns = [];
    this.boundingBox?.destroy();
  }

  private createContexts(): void {
    this.selectionStateContext = {
      ctx: this.ctx,
      boundingBox: this.boundingBox,
      selectedIds: this.selectedIds,
      isPanBlocked: () => this.isPanBlocked(),
    };

    this.gesturesContext = {
      ctx: this.ctx,
      boundingBox: this.boundingBox,
      getCameraManager: () => this.getCameraManager(),
      getSnapManager: () => this.getSnapManager(),
      getSelectedIds: () => this.getSelectedIds(),
      getSelectedElements: () => getSelectedElements(this.selectionStateContext),
      updateBoundingBox: () => updateBoundingBox(this.selectionStateContext),
      recordGroupUpdate: (elements, beforeStates, kind) =>
        this.recordGroupUpdate(elements, beforeStates, kind),
    };

    this.selectionBindingsContext = {
      ctx: this.ctx,
      boundingBox: this.boundingBox,
      selectedIds: this.selectedIds,
      selectableBindings: this.selectableBindings,
      isPanBlocked: () => this.isPanBlocked(),
      startElementDrag: (e) => {
        this.registerGestureCleanup(startElementDrag(this.gesturesContext, e));
      },
    };

    this.actionsContext = {
      ctx: this.ctx,
      getHistoryManager: () => this.getHistoryManager(),
      getSelectedIds: () => this.getSelectedIds(),
      getSelectedElements: () => getSelectedElements(this.selectionStateContext),
      getSelectedOptions: () => getSelectedOptions(this.selectionStateContext),
      setSelection: (ids) => setSelection(this.selectionStateContext, ids),
      getClipboard: () => this.clipboard,
      setClipboard: (items) => {
        this.clipboard = items;
      },
    };
  }

  private getSelectionStateContext(): InteractionSelectionStateContext {
    return this.selectionStateContext;
  }

  private getSelectionBindingsContext(): InteractionSelectionBindingsContext {
    return this.selectionBindingsContext;
  }
}
