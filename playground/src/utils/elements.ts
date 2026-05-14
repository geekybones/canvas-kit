import type {
  ElementOptions,
  ImageOptions,
  LineOptions,
  RectangleOptions,
  ShapeOptions,
  TextOptions,
} from '@geekybones/canvas-kit';
import { ICONS } from '@/icons/icons';

export const TEXT_EFFECTS = [
  'Arch',
  'Bridge',
  'Bulge',
  'Cone',
  'Curved',
  'Downward',
  'Perspective',
  'Pinch',
  'Pointed',
  'Upward',
  'Valley',
] as const;

export function getElementIcon(type: unknown): unknown {
  switch (type) {
    case 'text':
      return ICONS.text;
    case 'shape:circle':
      return ICONS.ellipse;
    case 'shape:line':
      return ICONS.line;
    case 'image':
      return ICONS.image;
    default:
      return ICONS.rect;
  }
}

export function typeLabel(type: unknown): string {
  switch (type) {
    case 'text':
      return 'Text';
    case 'shape:rectangle':
      return 'Rectangle';
    case 'shape:circle':
      return 'Ellipse';
    case 'shape:line':
      return 'Line';
    case 'shape:star':
      return 'Star';
    case 'image':
      return 'Image';
    default:
      return typeof type === 'string' ? type : 'Layer';
  }
}

export function isText(options: ElementOptions | null | undefined): options is TextOptions {
  return options?.type === 'text';
}

export function isShape(options: ElementOptions | null | undefined): options is ShapeOptions {
  return typeof options?.type === 'string' && options.type.startsWith('shape:');
}

export function isImage(options: ElementOptions | null | undefined): options is ImageOptions {
  return options?.type === 'image';
}

export function isRectangle(
  options: ElementOptions | null | undefined,
): options is RectangleOptions {
  return options?.type === 'shape:rectangle';
}

export function isLine(options: ElementOptions | null | undefined): options is LineOptions {
  return options?.type === 'shape:line';
}
