import { ICONS } from '@/icons/icons';
import type { AddElementKind } from '@/utils/createPlaygroundElement';

export const TOOL_BUTTONS: ReadonlyArray<{
  key: AddElementKind;
  label: string;
  icon: unknown;
}> = [
  { key: 'text', label: 'Text', icon: ICONS.text },
  { key: 'image', label: 'Image', icon: ICONS.image },
  { key: 'rect', label: 'Rectangle', icon: ICONS.rect },
  { key: 'ellipse', label: 'Ellipse', icon: ICONS.ellipse },
  { key: 'line', label: 'Line', icon: ICONS.line },
];
