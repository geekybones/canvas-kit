import { Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import type { CanvasContext } from '@/core/CanvasContext';
import { CanvasEventBus } from '@/core/Events';
import { GridManager } from '@/extensions/grid/GridManager';

function makeCtx(screen = { width: 800, height: 600 }) {
  const stage = new Container();
  const events = new CanvasEventBus();
  const app = {
    getPixiApp: () => ({
      stage,
      screen,
      renderer: {
        generateTexture: vi.fn(() => ({ destroy: vi.fn() })),
      },
    }),
  };

  const ctx = {
    app,
    events,
    registry: {
      get: vi.fn(),
      getAll: vi.fn(() => new Map()),
    },
    options: {},
    stage,
    getElement: vi.fn(),
    addElement: vi.fn(),
    removeElement: vi.fn(),
    getExtension: vi.fn(),
    hasExtension: vi.fn(),
  } as unknown as CanvasContext;

  return { ctx, stage, events };
}

describe('GridManager', () => {
  it('toggles visible state', () => {
    const { ctx } = makeCtx();
    const manager = new GridManager({ visible: true });

    manager.init(ctx);
    expect(manager.getState().visible).toBe(true);

    manager.setVisible(false);
    expect(manager.getState().visible).toBe(false);

    manager.setVisible(true);
    expect(manager.getState().visible).toBe(true);
  });

  it('updates cell size and major interval state', () => {
    const { ctx } = makeCtx();
    const manager = new GridManager({ cellSize: 20, majorInterval: 5 });

    manager.init(ctx);
    manager.setCellSize(24);
    manager.setMajorInterval(4);

    expect(manager.getState()).toEqual({
      cellSize: 24,
      majorInterval: 4,
      visible: true,
    });
  });

  it('reacts to camera changes by updating tile scale and position', () => {
    const { ctx, events } = makeCtx();
    const manager = new GridManager({ cellSize: 20, majorInterval: 5 });

    manager.init(ctx);
    const sprite = (
      manager as unknown as {
        sprite?: {
          tileScale: { set: ReturnType<typeof vi.fn> };
          tilePosition: { x: number; y: number };
        };
      }
    ).sprite;
    expect(sprite).toBeDefined();
    if (!sprite) {
      throw new Error('Expected grid sprite to be created');
    }

    events.emit('camera:changed', { zoom: 2, x: 30, y: 50 });

    expect(sprite.tileScale.set).toHaveBeenCalledWith(2);
    expect(sprite.tilePosition.x).toBe(30 % (20 * 5 * 2));
    expect(sprite.tilePosition.y).toBe(50 % (20 * 5 * 2));
  });

  it('destroy unsubscribes from camera changes and destroys the sprite', () => {
    const { ctx, events } = makeCtx();
    const offSpy = vi.spyOn(events, 'off');
    const manager = new GridManager();

    manager.init(ctx);
    const sprite = (
      manager as unknown as {
        sprite?: {
          destroy: ReturnType<typeof vi.fn>;
          tileScale: { set: ReturnType<typeof vi.fn> };
        };
      }
    ).sprite;
    expect(sprite).toBeDefined();
    if (!sprite) {
      throw new Error('Expected grid sprite to be created');
    }
    const tileScaleSpy = sprite.tileScale.set;

    manager.destroy();
    expect(sprite.destroy).toHaveBeenCalledWith(true);
    expect(offSpy).toHaveBeenCalled();

    tileScaleSpy.mockClear();
    events.emit('camera:changed', { zoom: 3, x: 10, y: 10 });
    expect(tileScaleSpy).not.toHaveBeenCalled();
  });
});
