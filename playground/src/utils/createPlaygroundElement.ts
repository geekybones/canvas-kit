import type { CanvasKit } from '@geekybones/canvas-kit';
import { Image, Shape, Text } from '@geekybones/canvas-kit';

import { makePlaceholderImage } from '@/utils/makePlaceholderImage';

export type AddElementKind = 'text' | 'image' | 'rect' | 'ellipse' | 'line';

export async function createPlaygroundElement(canvas: CanvasKit, kind: AddElementKind) {
  if (kind === 'text') {
    const id = await canvas.add(
      Text.create({
        id: crypto.randomUUID(),
        type: 'text',
        name: 'Text',
        text: 'Hello CanvasKit',
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#0F172A',
      }),
    );
    canvas.interaction?.select(id);
    return;
  }

  if (kind === 'image') {
    const id = await canvas.add(
      Image.create({
        id: crypto.randomUUID(),
        type: 'image',
        name: 'Image',
        src: makePlaceholderImage('Demo Image'),
        width: 280,
        height: 180,
      }),
    );
    canvas.interaction?.select(id);
    return;
  }

  if (kind === 'rect') {
    const id = await canvas.add(
      Shape.create(Shape.Rectangle, {
        name: 'Rectangle',
        width: 180,
        height: 120,
        fill: 0x7c5cff,
        fillAlpha: 0.16,
        stroke: 0x7c5cff,
        strokeWidth: 1,
        borderRadius: 16,
      }),
    );
    canvas.interaction?.select(id);
    return;
  }

  if (kind === 'ellipse') {
    const id = await canvas.add(
      Shape.create(Shape.Circle, {
        name: 'Ellipse',
        width: 160,
        height: 160,
        fill: 0xffb020,
        fillAlpha: 0.9,
      }),
    );
    canvas.interaction?.select(id);
    return;
  }

  const id = await canvas.add(
    Shape.create(Shape.Line, {
      name: 'Line',
      width: 220,
      stroke: 0x0f172a,
      strokeWidth: 3,
    }),
  );
  canvas.interaction?.select(id);
}
