import { ARROW_BOTH_SIDES_SVG } from '@/extensions/interaction/icons/arrowBothSides';
import { COPY_SVG } from '@/extensions/interaction/icons/copy';
import { MOVE_SVG } from '@/extensions/interaction/icons/move';
import { ROTATE_SVG } from '@/extensions/interaction/icons/rotate';
import { TRASH_SVG } from '@/extensions/interaction/icons/trash';

export type IconKey = 'trash' | 'duplicate' | 'rotate' | 'arrowBothSides' | 'move';

export const ICONS: Record<IconKey, string> = {
  trash: TRASH_SVG,
  duplicate: COPY_SVG,
  rotate: ROTATE_SVG,
  arrowBothSides: ARROW_BOTH_SIDES_SVG,
  move: MOVE_SVG,
};

export function getBuiltinIcon(key: IconKey): string {
  return ICONS[key];
}

export function isIconKey(value: string): value is IconKey {
  return value in ICONS;
}
