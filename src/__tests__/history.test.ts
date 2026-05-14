import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanvasContext } from '@/core/CanvasContext';
import type { Command } from '@/extensions/history/commands/Command';
import { UpdateCommand } from '@/extensions/history/commands/UpdateCommand';
import { HistoryManager } from '@/extensions/history/HistoryManager';

function makeCmd(
  label = 'cmd',
  kind: Command['kind'] = 'move',
): Command & { execCount: number; undoCount: number } {
  const cmd = {
    description: label,
    kind,
    execCount: 0,
    undoCount: 0,
    execute: vi.fn(async () => {
      cmd.execCount++;
    }),
    undo: vi.fn(async () => {
      cmd.undoCount++;
    }),
  };
  return cmd;
}

function makeCtx(): CanvasContext {
  return {
    app: { getCanvas: vi.fn(() => document.createElement('canvas')), getPixiApp: vi.fn() } as never,
    events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as never,
    registry: {} as never,
    options: {},
    stage: {} as never,
    getElement: vi.fn(),
    addElement: vi.fn(),
    removeElement: vi.fn(),
    clearElements: vi.fn(),
    getExtension: vi.fn(),
  } as unknown as CanvasContext;
}

describe('HistoryManager', () => {
  let history: HistoryManager;
  let ctx: CanvasContext;

  beforeEach(() => {
    history = new HistoryManager();
    ctx = makeCtx();
    history.init(ctx);
  });

  it('executes a command and adds to undo stack', async () => {
    const cmd = makeCmd();
    await history.execute(cmd);
    expect(cmd.execCount).toBe(1);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('undo calls cmd.undo and moves to redo stack', async () => {
    const cmd = makeCmd();
    await history.execute(cmd);
    await history.undo();
    expect(cmd.undoCount).toBe(1);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it('redo re-executes command', async () => {
    const cmd = makeCmd();
    await history.execute(cmd);
    await history.undo();
    await history.redo();
    expect(cmd.execCount).toBe(2);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('new execute clears redo stack', async () => {
    const cmd1 = makeCmd('a');
    const cmd2 = makeCmd('b');
    await history.execute(cmd1);
    await history.undo();
    expect(history.canRedo()).toBe(true);
    await history.execute(cmd2);
    expect(history.canRedo()).toBe(false);
  });

  it('undo on empty stack does nothing', async () => {
    await expect(history.undo()).resolves.toBeUndefined();
  });

  it('redo on empty stack does nothing', async () => {
    await expect(history.redo()).resolves.toBeUndefined();
  });

  it('clipboard stores and retrieves items', () => {
    const items = [{ id: 'a', type: 'shape:rectangle' }];
    history.setClipboard(items);
    const retrieved = history.getClipboard();
    expect(retrieved).toEqual(items);
    expect(retrieved).not.toBe(items); // deep copy
    expect(retrieved[0]).not.toBe(items[0]);
  });

  it('accessor exposes awaitable undo redo and clipboard helpers', async () => {
    ctx.getExtension = vi.fn((name: string) =>
      name === 'history' ? history : undefined,
    ) as unknown as CanvasContext['getExtension'];
    const accessor = history.accessors?.history;
    expect(accessor).toBeDefined();
    if (!accessor) {
      throw new Error('Expected history accessor to exist');
    }

    const cmd = makeCmd();
    await history.execute(cmd);

    await accessor.undo();
    await accessor.redo();
    expect(cmd.execCount).toBe(2);
    expect(cmd.undoCount).toBe(1);

    accessor.setClipboard([{ id: 'a', type: 'shape:rectangle' }]);
    expect(accessor.getClipboard()).toEqual([{ id: 'a', type: 'shape:rectangle' }]);
  });

  it('respects max history entries', async () => {
    history = new HistoryManager({ max: 2 });
    history.init(ctx);

    await history.execute(makeCmd('a'));
    await history.execute(makeCmd('b'));
    await history.execute(makeCmd('c'));

    await history.undo();
    await history.undo();
    await history.undo();

    expect(history.canRedo()).toBe(true);
  });

  it('skips untracked commands', async () => {
    history = new HistoryManager({ track: ['add'] });
    history.init(ctx);

    const cmd = makeCmd('move', 'move');
    await history.execute(cmd);

    expect(cmd.execCount).toBe(1);
    expect(history.canUndo()).toBe(false);
  });

  it('tracks layer commands when enabled', async () => {
    const cmd = makeCmd('zOrder', 'zOrder');
    await history.execute(cmd);
    expect(history.canUndo()).toBe(true);
  });

  it('update command emits element:updated on undo and redo', async () => {
    const update = vi.fn(async () => {});
    const get = vi.fn(() => ({ update }));
    ctx = {
      ...ctx,
      registry: { get } as never,
      events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as never,
    };
    history = new HistoryManager();
    history.init(ctx);

    const command = new UpdateCommand(ctx, 'el-1', 'move', { x: 10, y: 20 }, { x: 30, y: 40 });

    await history.execute(command);
    await history.undo();
    await history.redo();

    expect(ctx.events.emit).toHaveBeenCalledWith('element:updated', 'el-1');
  });
});
