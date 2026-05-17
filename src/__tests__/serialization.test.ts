import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanvasContext } from '@/core/CanvasContext';
import { ElementRegistry } from '@/core/ElementRegistry';
import { Image } from '@/elements/Image';
import { Shape } from '@/elements/Shape';
import { Text } from '@/elements/Text';
import { SerializationManager } from '@/extensions/serialization/SerializationManager';
import type { SerializedElement } from '@/extensions/serialization/types';

function makeCtx(registry: ElementRegistry): CanvasContext {
  const addElement = vi.fn(async (element) => {
    registry.add(element);
  });
  const removeElement = vi.fn((id: string) => {
    registry.remove(id);
  });
  return {
    app: {} as never,
    events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as never,
    registry,
    options: {},
    stage: {} as never,
    getElement: (id: string) => registry.get(id),
    addElement,
    removeElement,
    clearElements: () => {
      for (const id of [...registry.getAll().keys()]) {
        registry.remove(id);
      }
    },
    getExtension: vi.fn(),
  } as unknown as CanvasContext;
}

describe('SerializationManager', () => {
  let mgr: SerializationManager;
  let registry: ElementRegistry;

  beforeEach(() => {
    registry = new ElementRegistry();
    const ctx = makeCtx(registry);
    mgr = new SerializationManager();
    mgr.init(ctx);
  });

  it('serializes a text element', async () => {
    const el = Text.create({
      id: 'txt1',
      type: 'text',
      text: 'Hello world',
      fontSize: 24,
    });
    await el.init();

    const serialized = mgr.serialize(el);
    expect(serialized.id).toBe('txt1');
    expect(serialized.type).toBe('text');
    expect(serialized.text).toBe('Hello world');
    expect(serialized.fontSize).toBe(24);
  });

  it('serializes a Rectangle element', () => {
    const el = Shape.create(Shape.Rectangle, {
      id: 'rect1',
      width: 100,
      height: 50,
      fill: 0xff0000,
    });
    el.init();

    const serialized = mgr.serialize(el);
    expect(serialized.id).toBe('rect1');
    expect(serialized.width).toBe(100);
    expect(serialized.fill).toBe(0xff0000);
  });

  it('serializes an Image element', async () => {
    const el = Image.create({
      id: 'img1',
      type: 'image',
      src: 'test.png',
      width: 200,
      height: 150,
    });
    await el.init();

    const serialized = mgr.serialize(el);
    expect(serialized.src).toBe('test.png');
  });

  it('serializeAll returns array of all elements', async () => {
    const el1 = Text.create({ id: 't1', type: 'text', text: 'A' });
    const el2 = Shape.create(Shape.Circle, { id: 'c1', radius: 30 });
    await el1.init();
    el2.init();
    registry.add(el1);
    registry.add(el2);

    const all = mgr.serializeAll();
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.id)).toContain('t1');
    expect(all.map((s) => s.id)).toContain('c1');
  });

  it('throws when serializing an element without an adapter', async () => {
    const unsupported = {
      getType: () => 'custom:missing',
      getOptions: () => ({ id: 'x1', type: 'custom:missing' }),
    } as unknown as Parameters<SerializationManager['serialize']>[0];

    expect(() => mgr.serialize(unsupported)).toThrow('No serialization adapter registered');
  });

  it('throws when deserializing an element with missing type', async () => {
    await expect(mgr.appendAll([{ id: 'bad' } as unknown as SerializedElement])).rejects.toThrow(
      'missing "type"',
    );
  });

  it('throws when deserializing an element with an unknown adapter', async () => {
    await expect(
      mgr.appendAll([{ id: 'bad', type: 'custom:missing' } as unknown as SerializedElement]),
    ).rejects.toThrow('No serialization adapter registered for "custom:missing"');
  });

  it('throws when registering a duplicate adapter type', () => {
    expect(() =>
      mgr.registerAdapter({
        type: 'text',
        serialize: (element) => element.getOptions(),
        deserialize: (data) => Text.create(data as never),
      }),
    ).toThrow('A serialization adapter is already registered for "text"');
  });

  it('replaceAll restores the previous scene when deserialization fails', async () => {
    registry.registerFactory('shape:rectangle', (options) =>
      Shape.create(Shape.Rectangle, options as never),
    );
    const existing = Shape.create(Shape.Rectangle, {
      id: 'r1',
      width: 50,
      height: 40,
      fill: 0xff0000,
    });
    existing.init();
    registry.add(existing);

    await expect(
      mgr.replaceAll([{ id: 'bad', type: 'custom:missing' } as unknown as SerializedElement]),
    ).rejects.toThrow('No serialization adapter registered for "custom:missing"');

    const restored = registry.get('r1')?.getOptions() as { width?: number } | undefined;
    expect(restored?.width).toBe(50);
  });

  it('replaceAll surfaces both import and restore failures', async () => {
    registry.registerFactory('shape:rectangle', (options) =>
      Shape.create(Shape.Rectangle, options as never),
    );
    const existing = Shape.create(Shape.Rectangle, {
      id: 'r1',
      width: 50,
      height: 40,
      fill: 0xff0000,
    });
    existing.init();
    registry.add(existing);

    registry.registerFactory('shape:rectangle', () => {
      throw new Error('restore failed');
    });

    await expect(
      mgr.replaceAll([{ id: 'bad', type: 'custom:missing' } as unknown as SerializedElement]),
    ).rejects.toThrow(
      'Failed to replace scene and restore the previous scene. Import error: No serialization adapter registered for "custom:missing". Restore error: restore failed.',
    );
  });
});
