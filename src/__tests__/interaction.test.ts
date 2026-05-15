import type { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { ElementRegistry } from '@/core/ElementRegistry';
import { CanvasEventBus } from '@/core/Events';
import { HistoryManager } from '@/extensions/history/HistoryManager';
import { InteractionManager } from '@/extensions/interaction/InteractionManager';

type TestOptions = BaseOptions & {
  width?: number;
  height?: number;
  selectable?: boolean;
};

class TestElement {
  private options: TestOptions;
  private readonly displayObject: Container;

  constructor(options: TestOptions) {
    this.options = { ...options };
    this.displayObject = {
      eventMode: 'none',
      cursor: '',
      rotation: 0,
      position: {
        x: 0,
        y: 0,
        set: vi.fn((x = 0, y = x) => {
          const position = this.displayObject.position as { x: number; y: number };
          position.x = x;
          position.y = y;
        }),
      },
      on: vi.fn(),
      off: vi.fn(),
      getBounds: vi.fn(() => ({
        x: this.options.x ?? 0,
        y: this.options.y ?? 0,
        width: this.options.width ?? 100,
        height: this.options.height ?? 100,
      })),
      getLocalBounds: vi.fn(() => ({
        x: 0,
        y: 0,
        width: this.options.width ?? 100,
        height: this.options.height ?? 100,
      })),
      worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: this.options.x ?? 0, ty: this.options.y ?? 0 },
    } as unknown as Container;
    this.displayObject.position.set(options.x ?? 0, options.y ?? 0);
    this.displayObject.rotation = options.rotationDeg ?? 0;
  }

  getId(): string {
    return this.options.id;
  }

  getType(): string {
    return this.options.type;
  }

  getOptions(): TestOptions {
    return { ...this.options };
  }

  getDisplayObject(): Container {
    return this.displayObject;
  }

  async update(next: Partial<TestOptions>): Promise<void> {
    this.options = { ...this.options, ...next };
    this.displayObject.position.set(this.options.x ?? 0, this.options.y ?? 0);
    this.displayObject.rotation = ((this.options.rotationDeg ?? 0) * Math.PI) / 180;
  }
}

function makeElement(id: string, overrides: Partial<TestOptions> = {}): TestElement {
  return new TestElement({
    id,
    type: 'shape:rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 80,
    selectable: true,
    ...overrides,
  });
}

function makeCtx(elements: TestElement[], history?: HistoryManager) {
  const stage = {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Container;
  const canvas = document.createElement('div');
  canvas.tabIndex = 0;
  const registry = new ElementRegistry();
  const events = new CanvasEventBus();

  for (const element of elements) {
    registry.registerFactory(element.getType(), (options) => new TestElement(options) as never);
    registry.add(element as never);
  }

  const ctx = {
    app: {
      getCanvas: () => canvas,
      getPixiApp: () => ({
        stage,
        screen: { width: 800, height: 600 },
      }),
    },
    registry,
    events,
    options: {},
    stage,
    getElement: (id: string) => registry.get(id),
    addElement: vi.fn(async (element) => {
      registry.add(element);
      events.emit('element:added', element.getId());
    }),
    removeElement: vi.fn((id: string) => {
      registry.remove(id);
      events.emit('element:removed', id);
    }),
    getExtension: vi.fn((name: string) => {
      if (name === 'history') return history;
      return undefined;
    }),
    hasExtension: vi.fn((name: string) => name === 'history' && Boolean(history)),
  } as unknown as CanvasContext;

  return { ctx, stage, canvas, registry, events };
}

describe('InteractionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes selection ids, options, and duplicate through the accessor', async () => {
    const first = makeElement('shape-1', { x: 10 });
    const second = makeElement('shape-2', { x: 40 });
    const history = new HistoryManager();
    const { ctx, registry } = makeCtx([first, second], history);
    history.init(ctx);

    const manager = new InteractionManager();
    manager.init(ctx);
    vi.mocked(ctx.getExtension).mockImplementation((name: string) => {
      if (name === 'history') return history as never;
      if (name === 'interaction') return manager as never;
      return undefined;
    });

    manager.accessors?.interaction.select(['shape-1', 'shape-2']);

    expect(manager.accessors?.interaction.getSelectedIds()).toEqual(['shape-1', 'shape-2']);
    expect(manager.accessors?.interaction.getSelectedOptions()).toEqual([
      expect.objectContaining({ id: 'shape-1' }),
      expect.objectContaining({ id: 'shape-2' }),
    ]);

    await manager.accessors?.interaction.duplicate();

    const selectedIds = manager.getSelectedIds();
    expect(selectedIds).toHaveLength(2);
    expect(selectedIds.every((id) => id !== 'shape-1' && id !== 'shape-2')).toBe(true);
    expect(registry.getAll().size).toBe(4);
    expect(history.canUndo()).toBe(true);

    await history.undo();
    expect(registry.getAll().size).toBe(2);
  });

  it('syncs selectable listeners when element interactivity changes', async () => {
    const element = makeElement('shape-1', { selectable: false });
    const { ctx, events } = makeCtx([element]);
    const manager = new InteractionManager();
    manager.init(ctx);

    const displayObject = element.getDisplayObject() as unknown as {
      on: ReturnType<typeof vi.fn>;
      off: ReturnType<typeof vi.fn>;
    };
    const initialPointerDownCount = displayObject.on.mock.calls.filter(
      ([event]) => event === 'pointerdown',
    ).length;

    await element.update({ selectable: true });
    events.emit('element:updated', 'shape-1');

    const enabledPointerDownCount = displayObject.on.mock.calls.filter(
      ([event]) => event === 'pointerdown',
    ).length;
    expect(enabledPointerDownCount).toBeGreaterThan(initialPointerDownCount);

    await element.update({ selectable: false });
    events.emit('element:updated', 'shape-1');

    expect(displayObject.off).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });

  it('preserves multi-selection when dragging an already-selected element', () => {
    const first = makeElement('shape-1', { x: 10 });
    const second = makeElement('shape-2', { x: 40 });
    const { ctx } = makeCtx([first, second]);
    const manager = new InteractionManager();
    manager.init(ctx);

    manager.select(['shape-1', 'shape-2']);

    const displayObject = first.getDisplayObject() as unknown as {
      on: ReturnType<typeof vi.fn>;
    };
    const pointerDownCall = displayObject.on.mock.calls.find(([event]) => event === 'pointerdown');
    expect(pointerDownCall).toBeDefined();

    const onPointerDown = pointerDownCall?.[1] as (e: {
      button: number;
      stopPropagation: () => void;
      nativeEvent: PointerEvent | null;
    }) => void;
    onPointerDown({
      button: 0,
      stopPropagation: vi.fn(),
      nativeEvent: { ctrlKey: false, metaKey: false } as PointerEvent,
    });

    expect(manager.getSelectedIds()).toEqual(['shape-1', 'shape-2']);
  });

  it('selects only the clicked element when it is not already selected', () => {
    const first = makeElement('shape-1', { x: 10 });
    const second = makeElement('shape-2', { x: 40 });
    const { ctx } = makeCtx([first, second]);
    const manager = new InteractionManager();
    manager.init(ctx);

    manager.select('shape-1');

    const displayObject = second.getDisplayObject() as unknown as {
      on: ReturnType<typeof vi.fn>;
    };
    const pointerDownCall = displayObject.on.mock.calls.find(([event]) => event === 'pointerdown');
    expect(pointerDownCall).toBeDefined();

    const onPointerDown = pointerDownCall?.[1] as (e: {
      button: number;
      stopPropagation: () => void;
      nativeEvent: PointerEvent | null;
    }) => void;
    onPointerDown({
      button: 0,
      stopPropagation: vi.fn(),
      nativeEvent: { ctrlKey: false, metaKey: false } as PointerEvent,
    });

    expect(manager.getSelectedIds()).toEqual(['shape-2']);
  });

  it('starts drag instead of deselecting when clicking inside the selection bounds gap', () => {
    const first = makeElement('shape-1', { x: 0, y: 0, width: 40, height: 40 });
    const second = makeElement('shape-2', { x: 0, y: 120, width: 40, height: 40 });
    const { ctx, stage } = makeCtx([first, second]);
    const manager = new InteractionManager();
    manager.init(ctx);

    manager.select(['shape-1', 'shape-2']);

    const boundingBox = (
      manager as unknown as {
        boundingBox: {
          containsGlobalPoint(x: number, y: number): boolean;
        };
      }
    ).boundingBox;
    expect(boundingBox.containsGlobalPoint(20, 80)).toBe(true);

    const stagePointerDown = vi.mocked(stage.on).mock.calls.find(([event]) => event === 'pointerdown');
    expect(stagePointerDown).toBeDefined();

    const onStagePointerDown = stagePointerDown?.[1] as (e: {
      button: number;
      globalX: number;
      globalY: number;
    }) => void;
    onStagePointerDown({ button: 0, globalX: 20, globalY: 80 });

    expect(manager.getSelectedIds()).toEqual(['shape-1', 'shape-2']);
  });

  it('clears removed elements from the current selection', () => {
    const element = makeElement('shape-1');
    const { ctx } = makeCtx([element]);
    const manager = new InteractionManager();
    manager.init(ctx);

    manager.select('shape-1');
    expect(manager.getSelectedIds()).toEqual(['shape-1']);

    ctx.removeElement('shape-1');
    expect(manager.getSelectedIds()).toEqual([]);
  });

  it('detaches handle and selectable listeners on destroy', () => {
    const element = makeElement('shape-1');
    const { ctx } = makeCtx([element]);
    const manager = new InteractionManager();
    manager.init(ctx);

    const handles = (
      manager as unknown as {
        boundingBox: { getHandles(): Array<{ container: { off: ReturnType<typeof vi.fn> } }> };
      }
    ).boundingBox.getHandles();
    const displayObject = element.getDisplayObject() as unknown as {
      off: ReturnType<typeof vi.fn>;
    };

    manager.destroy();

    expect(handles.some((handle) => handle.container.off.mock.calls.length > 0)).toBe(true);
    expect(displayObject.off).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });
});
