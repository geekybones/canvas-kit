import { vi } from 'vitest';

vi.mock('pixi.js', () => {
  function makeContainer() {
    const children: unknown[] = [];
    const container = {
      children,
      zIndex: 0,
      eventMode: 'none',
      cursor: '',
      visible: true,
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      position: {
        x: 0,
        y: 0,
        set: vi.fn((x = 0, y = x) => {
          container.position.x = x;
          container.position.y = y;
          container.x = x;
          container.y = y;
        }),
      },
      scale: {
        x: 1,
        y: 1,
        set: vi.fn((x = 1, y = x) => {
          container.scale.x = x;
          container.scale.y = y;
          container.scaleX = x;
          container.scaleY = y;
        }),
      },
      pivot: { x: 0, y: 0, set: vi.fn() },
      hitArea: null,
      sortableChildren: false,
      addChild: vi.fn((child: unknown) => {
        children.push(child);
        if (typeof child === 'object' && child) {
          (child as { parent?: unknown }).parent = container;
        }
        return child;
      }),
      removeChild: vi.fn((child: unknown) => {
        const i = children.indexOf(child);
        if (i >= 0) children.splice(i, 1);
        if (typeof child === 'object' && child) {
          (child as { parent?: unknown }).parent = undefined;
        }
        return child;
      }),
      removeChildren: vi.fn(() => {
        for (const child of children) {
          if (typeof child === 'object' && child) {
            (child as { parent?: unknown }).parent = undefined;
          }
        }
        children.length = 0;
        return [];
      }),
      toLocal: vi.fn((point: { x: number; y: number }) => ({
        x: (point.x - container.x) / (container.scale.x || 1),
        y: (point.y - container.y) / (container.scale.y || 1),
      })),
      toGlobal: vi.fn((point: { x: number; y: number }) => ({
        x: point.x * container.scale.x + container.x,
        y: point.y * container.scale.y + container.y,
      })),
      getBounds: vi.fn(() => ({ x: container.x, y: container.y, width: 100, height: 100 })),
      getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    return container;
  }

  function makeApplication() {
    return {
      init: vi.fn().mockResolvedValue(undefined),
      stage: { ...makeContainer(), sortableChildren: false, hitArea: null },
      screen: { width: 800, height: 600 },
      canvas: Object.assign(document.createElement('canvas'), { setAttribute: vi.fn() }),
      renderer: { extract: { canvas: vi.fn(() => document.createElement('canvas')) } },
      ticker: { add: vi.fn(), remove: vi.fn() },
      destroy: vi.fn(),
    };
  }

  function makeGraphics() {
    return {
      ...makeContainer(),
      rect: vi.fn().mockReturnThis(),
      roundRect: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
      star: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      bezierCurveTo: vi.fn().mockReturnThis(),
      quadraticCurveTo: vi.fn().mockReturnThis(),
      closePath: vi.fn().mockReturnThis(),
      fill: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
    };
  }

  function makeText() {
    return {
      ...makeContainer(),
      text: '',
      style: {},
      getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 200, height: 40 })),
    };
  }

  function makeSprite() {
    return {
      ...makeContainer(),
      texture: null,
      width: 100,
      height: 100,
      anchor: { set: vi.fn() },
      getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    };
  }

  function makeTilingSprite({
    texture,
    width,
    height,
  }: { texture?: unknown; width?: number; height?: number } = {}) {
    return {
      ...makeContainer(),
      texture: texture ?? null,
      width: width ?? 100,
      height: height ?? 100,
      tileScale: { x: 1, y: 1, set: vi.fn() },
      tilePosition: { x: 0, y: 0 },
    };
  }

  function makeTextStyle(opts?: Record<string, unknown>) {
    return { ...opts };
  }

  function makeMeshGeometry() {
    const posData = new Float32Array(204); // 51*4
    const uvData = new Float32Array(204);
    const buffer = { data: posData, update: vi.fn() };
    return {
      positions: posData,
      uvs: uvData,
      indices: new Uint32Array(300),
      getBuffer: vi.fn(() => buffer),
      destroy: vi.fn(),
    };
  }

  function makeMesh() {
    return {
      ...makeContainer(),
      texture: null,
      geometry: makeMeshGeometry(),
      getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 200, height: 40 })),
    };
  }

  // jsdom doesn't have URL.createObjectURL
  if (typeof URL.createObjectURL === 'undefined') {
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock'),
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
  }

  const Assets = {
    load: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    unload: vi.fn().mockResolvedValue(undefined),
  };

  const Texture = {
    from: vi.fn().mockReturnValue({ width: 100, height: 100, destroy: vi.fn() }),
  };

  const RenderTexture = {
    create: vi.fn(() => ({ width: 200, height: 40, destroy: vi.fn() })),
  };

  class Point {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
  }

  class Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  }

  return {
    Application: vi.fn().mockImplementation(makeApplication),
    Container: vi.fn().mockImplementation(makeContainer),
    Graphics: vi.fn().mockImplementation(makeGraphics),
    Text: vi.fn().mockImplementation(makeText),
    TextStyle: vi.fn().mockImplementation(makeTextStyle),
    Sprite: vi.fn().mockImplementation(makeSprite),
    TilingSprite: vi.fn().mockImplementation(makeTilingSprite),
    MeshGeometry: vi.fn().mockImplementation(makeMeshGeometry),
    Mesh: vi.fn().mockImplementation(makeMesh),
    Assets,
    Texture,
    RenderTexture,
    Point,
    Rectangle,
    EventEmitter: class {
      on = vi.fn();
      off = vi.fn();
      emit = vi.fn();
    },
  };
});
