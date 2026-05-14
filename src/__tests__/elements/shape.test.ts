import { describe, expect, it } from 'vitest';

import { Shape } from '@/elements/Shape';

describe('Shape elements', () => {
  it('creates rectangle', () => {
    const el = Shape.create(Shape.Rectangle, {
      id: 's1',
      type: 'shape:rectangle',
      width: 100,
      height: 50,
      fill: 0xff0000,
    });

    expect(el.getId()).toBe('s1');
    expect(el.getType()).toBe('shape:rectangle');
  });

  it('creates circle', () => {
    const el = Shape.create(Shape.Circle, {
      id: 's2',
      type: 'shape:circle',
      radius: 40,
      fill: 0x00ff00,
    });

    expect(el.getType()).toBe('shape:circle');
  });

  it('creates star', () => {
    const el = Shape.create(Shape.Star, {
      id: 's3',
      type: 'shape:star',
      points: 5,
      width: 100,
      height: 100,
      fill: 0xffff00,
    });

    expect(el.getType()).toBe('shape:star');
  });

  it('creates line', () => {
    const el = Shape.create(Shape.Line, {
      id: 's4',
      type: 'shape:line',
      width: 100,
      stroke: 0x000000,
    });

    expect(el.getType()).toBe('shape:line');
  });

  it('rectangle init runs without error', () => {
    const el = Shape.create(Shape.Rectangle, {
      id: 's5',
      type: 'shape:rectangle',
      width: 80,
      height: 60,
    });

    expect(() => el.init()).not.toThrow();
  });

  it('rectangle update patches options', () => {
    const el = Shape.create(Shape.Rectangle, {
      id: 's6',
      type: 'shape:rectangle',
      width: 80,
      height: 60,
    });

    el.init();
    el.update({ width: 120 });

    expect(el.getOptions().width).toBe(120);
  });

  it('register adds custom type', () => {
    Shape.register('shape:custom', (opts) =>
      Shape.create(Shape.Rectangle, {
        ...opts,
        type: 'shape:rectangle',
        width: 80,
        height: 40,
      }),
    );

    const el = Shape.factories.get('shape:custom')?.({
      id: 'custom-1',
      type: 'shape:custom',
    });

    expect(el?.getType()).toBe('shape:rectangle');
  });
});
