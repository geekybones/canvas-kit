import { Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { ElementRegistry } from '@/core/ElementRegistry';
import { CanvasEventBus } from '@/core/Events';
import { AlignmentManager } from '@/extensions/alignment/AlignmentManager';
import type { Extension } from '@/extensions/Extension';
import { HistoryManager } from '@/extensions/history/HistoryManager';

type TestOptions = BaseOptions;

class TestElement {
  private options: TestOptions;
  private displayObject: Container;

  constructor(
    options: TestOptions,
    bounds: { x: number; y: number; width: number; height: number },
  ) {
    this.options = { ...options };
    this.displayObject = new Container();
    this.displayObject.position.set(options.x ?? 0, options.y ?? 0);
    this.displayObject.getBounds = vi.fn(
      () =>
        ({
          x: bounds.x + (this.options.x ?? 0),
          y: bounds.y + (this.options.y ?? 0),
          width: bounds.width,
          height: bounds.height,
        }) as never,
    ) as never;
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
  }
}

function makeCtx(
  elements: TestElement[],
  selectedIds: readonly string[],
  history?: HistoryManager,
  screen: { width: number; height: number } = { width: 800, height: 600 },
): CanvasContext {
  const registry = new ElementRegistry();
  for (const element of elements) {
    registry.add(element as never);
  }

  const events = new CanvasEventBus();
  const getExtension = vi.fn((name: string) => {
    if (name === 'interaction') {
      return {
        getSelectedIds: () => selectedIds,
      } as unknown as Extension;
    }

    if (name === 'history') {
      return history as Extension | undefined;
    }

    return undefined;
  }) as CanvasContext['getExtension'];

  return {
    app: {
      getCanvas: () => document.createElement('canvas'),
      getPixiApp: () => ({ stage: new Container(), screen }),
    } as never,
    registry,
    events,
    options: {},
    stage: new Container(),
    getElement: (id) => registry.get(id),
    addElement: vi.fn(),
    removeElement: vi.fn(),
    clearElements: vi.fn(),
    getExtension,
    hasExtension: vi.fn(),
  };
}

describe('AlignmentManager', () => {
  it('aligns selected elements to the left edge of the selection bounds', async () => {
    const first = new TestElement(
      { id: 'a', type: 'shape:rectangle', x: 0, y: 0 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const second = new TestElement(
      { id: 'b', type: 'shape:rectangle', x: 200, y: 0 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const manager = new AlignmentManager();
    const ctx = makeCtx([first, second], ['a', 'b']);

    manager.init(ctx);
    await manager.align('left');

    expect(first.getOptions().x).toBe(0);
    expect(second.getOptions().x).toBe(0);
  });

  it('aligns a single element against the canvas bounds', async () => {
    const element = new TestElement(
      { id: 'a', type: 'shape:rectangle', x: 100, y: 50 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const manager = new AlignmentManager();
    const ctx = makeCtx([element], ['a'], undefined, { width: 800, height: 600 });

    manager.init(ctx);
    await manager.align('right');

    expect(element.getOptions().x).toBe(750);
  });

  it('uses explicit ids instead of current selection', async () => {
    const first = new TestElement(
      { id: 'a', type: 'shape:rectangle', x: 0, y: 0 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const second = new TestElement(
      { id: 'b', type: 'shape:rectangle', x: 200, y: 100 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const manager = new AlignmentManager();
    const ctx = makeCtx([first, second], ['a']);

    manager.init(ctx);
    await manager.align('top', ['a', 'b']);

    expect(first.getOptions().y).toBe(0);
    expect(second.getOptions().y).toBe(0);
  });

  it('records alignment as one history step when history tracking is enabled', async () => {
    const first = new TestElement(
      { id: 'a', type: 'shape:rectangle', x: 0, y: 0 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const second = new TestElement(
      { id: 'b', type: 'shape:rectangle', x: 200, y: 100 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const history = new HistoryManager({ track: ['align'] });
    const ctx = makeCtx([first, second], ['a', 'b'], history);
    history.init(ctx);

    const manager = new AlignmentManager();
    manager.init(ctx);

    await manager.align('top');

    expect(history.canUndo()).toBe(true);
    await history.undo();
    expect(first.getOptions().y).toBe(0);
    expect(second.getOptions().y).toBe(100);
  });

  it('does not create history for a no-op alignment', async () => {
    const first = new TestElement(
      { id: 'a', type: 'shape:rectangle', x: 0, y: 0 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const second = new TestElement(
      { id: 'b', type: 'shape:rectangle', x: 0, y: 100 },
      { x: -50, y: -50, width: 100, height: 100 },
    );
    const history = new HistoryManager({ track: ['align'] });
    const ctx = makeCtx([first, second], ['a', 'b'], history);
    history.init(ctx);

    const manager = new AlignmentManager();
    manager.init(ctx);

    await manager.align('left');

    expect(history.canUndo()).toBe(false);
  });
});
