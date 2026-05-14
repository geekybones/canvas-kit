import { describe, expect, it } from 'vitest';

import { Text } from '@/elements/Text';

describe('Text element', () => {
  it('creates text element', () => {
    const el = Text.create({
      id: 't1',
      type: 'text',
      text: 'Hello',
    });

    expect(el.getId()).toBe('t1');
    expect(el.getType()).toBe('text');
    expect(el.getOptions().text).toBe('Hello');
  });

  it('supports explicit multiline text', () => {
    const el = Text.create({
      id: 't2',
      type: 'text',
      text: 'Multi\nLine',
    });

    expect(el.getType()).toBe('text');
  });

  it('supports effect options', () => {
    const el = Text.create({
      id: 't2-effect',
      type: 'text',
      text: 'Multi\nLine',
      fontUrl: '/Arial-Black.woff',
      effect: { type: 'Perspective', intensity: 80 },
    });

    expect(el.getOptions().effect?.type).toBe('Perspective');
  });

  it('init runs without error', async () => {
    const el = Text.create({
      id: 't3',
      type: 'text',
      text: 'Test',
    });

    await expect(el.init()).resolves.toBeUndefined();
  });

  it('update patches options', async () => {
    const el = Text.create({
      id: 't4',
      type: 'text',
      text: 'Before',
    });

    await el.init();
    await el.update({ text: 'After' });

    expect(el.getOptions().text).toBe('After');
  });

  it('transform-only scale updates text resolution', async () => {
    const el = Text.create({
      id: 't5',
      type: 'text',
      text: 'Sharp',
    });

    await el.init();
    await el.update({ scaleX: 2, scaleY: 1.5 });

    const textNode = el.getDisplayObject().children[0] as { resolution?: number };
    expect(textNode.resolution).toBe(2);
  });

  it('multiline text transform-only scale updates text resolution', async () => {
    const el = Text.create({
      id: 't6',
      type: 'text',
      text: 'Sharp\nWrap',
    });

    await el.init();
    await el.update({ scaleX: 1.25, scaleY: 2 });

    const textNode = el.getDisplayObject().children[0] as { resolution?: number };
    expect(textNode.resolution).toBe(2);
  });
});
