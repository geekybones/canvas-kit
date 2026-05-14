import { describe, expect, it } from 'vitest';

import { computeResizeUpdate } from '@/extensions/interaction/ResizeStrategy';

describe('computeResizeUpdate', () => {
  it('preserves existing single-line text scale during proportional resize', () => {
    const update = computeResizeUpdate(
      'text',
      {
        x: 100,
        y: 80,
        scaleX: 1.6,
        scaleY: 0.75,
        fontSize: 40,
      },
      { xDir: 1, yDir: 1, proportional: true },
      1.25,
      1.25,
      20,
      10,
    );

    expect(update).toMatchObject({
      fontSize: 50,
      scaleX: 1.6,
      scaleY: 0.75,
    });
  });

  it('preserves text scale during proportional resize', () => {
    const update = computeResizeUpdate(
      'text',
      {
        x: 100,
        y: 80,
        scaleX: 0.9,
        scaleY: 1.4,
        fontSize: 30,
      },
      { xDir: -1, yDir: -1, proportional: true },
      1.5,
      1.5,
      260,
      180,
    );

    expect(update).toMatchObject({
      fontSize: 45,
      scaleX: 0.9,
      scaleY: 1.4,
    });
  });
});
