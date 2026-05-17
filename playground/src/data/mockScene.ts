import type { SerializedElement } from '@geekybones/canvas-kit';

import raw from '@/data/mock.json';
import { parseJsonColors } from '@/utils/colors';
import { prepareSceneElements } from '@/utils/fonts';

const mockScene: SerializedElement[] = prepareSceneElements(
  parseJsonColors(raw) as SerializedElement[],
);

export default mockScene;
