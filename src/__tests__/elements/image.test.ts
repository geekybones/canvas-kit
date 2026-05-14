import { describe, expect, it } from 'vitest';

import { Image } from '@/elements/Image';

describe('Image element', () => {
  it('creates image element', () => {
    const el = Image.create({
      id: 'img1',
      type: 'image',
      src: 'https://example.com/img.png',
      width: 100,
      height: 80,
    });

    expect(el.getId()).toBe('img1');
    expect(el.getType()).toBe('image');
  });

  it('init runs without error', async () => {
    const el = Image.create({
      id: 'img2',
      type: 'image',
      src: 'test.png',
      width: 100,
      height: 80,
    });

    await expect(el.init()).resolves.toBeUndefined();
  });
});
