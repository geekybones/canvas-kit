import { Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import type { CanvasContext } from '@/core/CanvasContext';
import { CanvasEventBus } from '@/core/Events';
import { CameraManager } from '@/extensions/camera/CameraManager';

function makeCtx(screen = { width: 800, height: 600 }) {
  const canvas = document.createElement('canvas');
  const stage = new Container();

  const addChildSpy = vi.spyOn(stage, 'addChild');
  const events = new CanvasEventBus();
  const emitSpy = vi.spyOn(events, 'emit');

  const ctx = {
    app: {
      getCanvas: () => canvas,
      getPixiApp: () => ({
        stage,
        screen,
      }),
    },
    events,
    registry: {
      get: vi.fn(),
    },
    options: {},
    stage,
    getElement: vi.fn(),
    addElement: vi.fn(),
    removeElement: vi.fn(),
    clearElements: vi.fn(),
    getExtension: vi.fn(),
    hasExtension: vi.fn(),
  } as unknown as CanvasContext;

  return { ctx, canvas, stage, addChildSpy, emitSpy };
}

describe('CameraManager', () => {
  it('clamps zoom to configured min and max', () => {
    const { ctx } = makeCtx();
    const manager = new CameraManager({ minZoom: 0.5, maxZoom: 2 });

    manager.init(ctx);

    manager.setZoom(10);
    expect(manager.getZoom()).toBe(2);

    manager.setZoom(0.1);
    expect(manager.getZoom()).toBe(0.5);
  });

  it('screenToWorld and worldToScreen round-trip with zoom and pan', () => {
    const { ctx } = makeCtx();
    const manager = new CameraManager();

    manager.init(ctx);
    manager.setZoom(2, 0, 0);

    const screenPoint = { x: 120, y: 90 };
    const worldPoint = manager.screenToWorld(screenPoint.x, screenPoint.y);
    const roundTrip = manager.worldToScreen(worldPoint.x, worldPoint.y);

    expect(roundTrip.x).toBeCloseTo(screenPoint.x, 6);
    expect(roundTrip.y).toBeCloseTo(screenPoint.y, 6);
  });

  it('setState resets zoom and position and emits once', () => {
    const { ctx, emitSpy } = makeCtx();
    const manager = new CameraManager();

    manager.init(ctx);
    manager.setZoom(2, 0, 0);
    emitSpy.mockClear();

    manager.setState({ zoom: 1, x: 0, y: 0 });

    expect(manager.getZoom()).toBe(1);
    expect(manager.getState()).toEqual({ zoom: 1, x: 0, y: 0 });
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith('camera:changed', { zoom: 1, x: 0, y: 0 });
  });

  it('reparents new elements into the world container on element:added', () => {
    const { ctx, addChildSpy } = makeCtx();
    const manager = new CameraManager();
    const displayObject = new Container();
    const element = {
      getDisplayObject: () => displayObject,
    };

    manager.init(ctx);
    const worldAddChildSpy = vi.spyOn(manager.worldContainer, 'addChild');
    ctx.registry.get = vi.fn(() => element) as unknown as typeof ctx.registry.get;

    ctx.events.emit('element:added', 'shape-1');

    expect(addChildSpy).toHaveBeenCalledWith(manager.worldContainer);
    expect(worldAddChildSpy).toHaveBeenCalledWith(displayObject);
    expect(manager.worldContainer.children).toContain(displayObject);
  });

  it('does not attach wheel zoom when wheel zoom is disabled', () => {
    const { ctx, canvas } = makeCtx();
    const addEventListenerSpy = vi.spyOn(canvas, 'addEventListener');
    const manager = new CameraManager({ wheelZoom: false });

    manager.init(ctx);

    expect(addEventListenerSpy.mock.calls.some(([eventName]) => eventName === 'wheel')).toBe(false);
  });
});
