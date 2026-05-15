import type { MeshEffect } from '@/elements/Text/types';
import { Arch } from '@/elements/Text/Vector/effects/Arch';
import { Bridge } from '@/elements/Text/Vector/effects/Bridge';
import { Bulge } from '@/elements/Text/Vector/effects/Bulge';
import { Cone } from '@/elements/Text/Vector/effects/Cone';
import { Curved } from '@/elements/Text/Vector/effects/Curved';
import { Downward } from '@/elements/Text/Vector/effects/Downward';
import { Normal } from '@/elements/Text/Vector/effects/Normal';
import { Perspective } from '@/elements/Text/Vector/effects/Perspective';
import { Pinch } from '@/elements/Text/Vector/effects/Pinch';
import { Pointed } from '@/elements/Text/Vector/effects/Pointed';
import { Upward } from '@/elements/Text/Vector/effects/Upward';
import { Valley } from '@/elements/Text/Vector/effects/Valley';

export const BUILTIN_EFFECTS: Record<string, MeshEffect> = {
  Arch,
  Bridge,
  Bulge,
  Cone,
  Curved,
  Downward,
  Normal,
  Perspective,
  Pinch,
  Pointed,
  Upward,
  Valley,
};
