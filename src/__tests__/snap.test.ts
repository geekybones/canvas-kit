import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanvasContext } from '@/core/CanvasContext';
import { ElementRegistry } from '@/core/ElementRegistry';
import { SnapManager } from '@/extensions/snap/SnapManager';

function makeElement(id: string, bounds: { x: number; y: number; width: number; height: number }) {
  return {
    getId: () => id,
    getDisplayObject: () => ({
      getBounds: () => bounds,
    }),
  };
}

function makeCtx(
  registry: ElementRegistry,
  getExtension: CanvasContext['getExtension'] = () => undefined,
): CanvasContext {
  const stage = new Container();
  const pixiApp = {
    stage,
    screen: { width: 800, height: 600 },
  };

  return {
    app: {
      getPixiApp: () => pixiApp,
    } as CanvasContext['app'],
    events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as never,
    registry,
    options: {},
    stage,
    getElement: (id: string) => registry.get(id),
    addElement: vi.fn(),
    removeElement: vi.fn(),
    clearElements: vi.fn(),
    getExtension,
    hasExtension: vi.fn(),
  };
}

describe('SnapManager', () => {
  let registry: ElementRegistry;
  let manager: SnapManager;
  let ctx: CanvasContext;

  beforeEach(() => {
    registry = new ElementRegistry();
    manager = new SnapManager();
    ctx = makeCtx(registry);
    manager.init(ctx);
  });

  it('prefers guides over object and grid snap', () => {
    registry.add(makeElement('box-1', { x: 100, y: 100, width: 100, height: 100 }) as never);
    manager.addGuide({ id: 'guide-1', orientation: 'vertical', position: 204 });

    const result = manager.resolve(198, 30, { width: 20, height: 20 });

    expect(result.xSnapped).toBe(true);
    expect(result.x).toBe(194);
    expect(result.xTarget).toEqual({ type: 'guide', reference: 'guide-1' });
  });

  it('supports excluding object targets during resolution', () => {
    registry.add(makeElement('box-1', { x: 100, y: 100, width: 100, height: 100 }) as never);

    const included = manager.resolve(196, 10, { width: 20, height: 20 });
    expect(included.xSnapped).toBe(true);
    expect(included.xTarget).toEqual({ type: 'edge', reference: 'box-1' });

    manager.configure({ grid: false });
    const excluded = manager.resolve(196, 10, { width: 20, height: 20, exclude: ['box-1'] });
    expect(excluded.xSnapped).toBe(false);
    expect(excluded.x).toBe(196);
  });

  it('falls back to grid snapping when grid extension is unavailable', () => {
    const result = manager.resolve(23, 41);

    expect(result.x).toBe(20);
    expect(result.y).toBe(40);
    expect(result.xTarget).toEqual({ type: 'grid' });
    expect(result.yTarget).toEqual({ type: 'grid' });
  });

  it('uses the closest element anchor for grid snapping', () => {
    const result = manager.resolve(7, 0, { width: 12, height: 10 });

    expect(result.x).toBe(8);
    expect(result.xAnchor).toBe('max');
    expect(result.xTarget).toEqual({ type: 'grid' });
  });

  it('uses the grid extension cell size when available', () => {
    const gridCtx = makeCtx(registry, ((name: string) =>
      name === 'grid'
        ? ({
            getState: () => ({
              cellSize: 50,
              majorInterval: 5,
              visible: true,
            }),
          } as never)
        : undefined) as CanvasContext['getExtension']);
    const gridSnap = new SnapManager();
    gridSnap.init(gridCtx);

    const result = gridSnap.resolve(46, 74);

    expect(result.x).toBe(50);
    expect(result.y).toBe(74);
    expect(result.xTarget).toEqual({ type: 'grid' });
    expect(result.yTarget).toBeUndefined();
  });

  it('exposes a readable cloned state', () => {
    manager.addGuide({ id: 'guide-1', orientation: 'horizontal', position: 120 });
    manager.configure({
      threshold: 12,
      guides: false,
      lineColor: 0xff00ff,
      lineAlpha: 0.5,
      lineWidth: 2,
    });

    const state = manager.getState();
    expect(state).toEqual({
      config: {
        grid: true,
        objects: true,
        edges: true,
        guides: false,
        threshold: 12,
        lineColor: 0xff00ff,
        lineAlpha: 0.5,
        lineWidth: 2,
      },
      guides: [{ id: 'guide-1', orientation: 'horizontal', position: 120 }],
    });

    const guide = state.guides[0];
    expect(guide).toBeDefined();
    if (!guide) return;

    state.config.threshold = 999;
    guide.position = 5;

    expect(manager.getState().config.threshold).toBe(12);
    expect(manager.getState().guides[0]?.position).toBe(120);
  });

  it('sizes snap lines from the current screen dimensions', () => {
    const result = {
      x: 100,
      y: 50,
      snapped: true,
      xSnapped: true,
      ySnapped: true,
      lineX: 100,
      lineY: 50,
    };

    manager.showLines(result);

    const lines = (
      manager as never as {
        lines?: {
          vLine: { lineTo: ReturnType<typeof vi.fn> };
          hLine: { lineTo: ReturnType<typeof vi.fn> };
          container: { visible: boolean };
        };
      }
    ).lines;
    expect(lines?.vLine.lineTo).toHaveBeenCalledWith(100, 600);
    expect(lines?.hLine.lineTo).toHaveBeenCalledWith(800, 50);
    expect(lines?.container.visible).toBe(true);

    ctx.app.getPixiApp().screen.width = 1024;
    ctx.app.getPixiApp().screen.height = 768;

    manager.showLines(result);

    expect(lines?.vLine.lineTo).toHaveBeenLastCalledWith(100, 768);
    expect(lines?.hLine.lineTo).toHaveBeenLastCalledWith(1024, 50);

    manager.hideLines();
    expect(lines?.container.visible).toBe(false);
  });

  it('applies configured snap-line styling', () => {
    manager.configure({ lineColor: 0xff6b6b, lineAlpha: 0.9, lineWidth: 2 });

    manager.showLines({
      x: 100,
      y: 50,
      snapped: true,
      xSnapped: true,
      ySnapped: false,
      lineX: 100,
    });

    const lines = (manager as never as { lines?: { vLine: { stroke: ReturnType<typeof vi.fn> } } })
      .lines;
    expect(lines?.vLine.stroke).toHaveBeenLastCalledWith({
      color: 0xff6b6b,
      alpha: 0.9,
      width: 2,
    });
  });

  it('projects snap lines through the camera when enabled', () => {
    const cameraCtx = makeCtx(registry, ((name: string) =>
      name === 'camera'
        ? ({
            screenToWorld: (x: number, y: number) => ({ x: (x - 10) / 2, y: (y - 20) / 2 }),
            worldToScreen: (x: number, y: number) => ({ x: x * 2 + 10, y: y * 2 + 20 }),
          } as never)
        : undefined) as CanvasContext['getExtension']);
    const cameraSnap = new SnapManager();
    cameraSnap.init(cameraCtx);

    cameraSnap.showLines({
      x: 100,
      y: 50,
      snapped: true,
      xSnapped: true,
      ySnapped: true,
      lineX: 100,
      lineY: 50,
    });

    const lines = (
      cameraSnap as never as {
        lines?: {
          vLine: { lineTo: ReturnType<typeof vi.fn> };
          hLine: { moveTo: ReturnType<typeof vi.fn> };
        };
      }
    ).lines;
    expect(lines?.vLine.lineTo).toHaveBeenLastCalledWith(210, 600);
    expect(lines?.hLine.moveTo).toHaveBeenLastCalledWith(0, 120);
  });
});
