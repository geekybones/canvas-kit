import type { SnapManager } from '@/extensions/snap/SnapManager';
import { DEFAULT_SNAP_CONFIG, type SnapAccessor, type SnapState } from '@/extensions/snap/types';

const EMPTY_STATE: SnapState = {
  config: { ...DEFAULT_SNAP_CONFIG },
  guides: [],
};

export function createSnapAccessor(getManager: () => SnapManager | undefined): SnapAccessor {
  return {
    resolve: (x, y, opts) => {
      const snap = getManager();
      if (!snap) {
        return {
          x,
          y,
          snapped: false,
          xSnapped: false,
          ySnapped: false,
        };
      }
      const result = snap.resolve(x, y, opts);
      return {
        x: result.x,
        y: result.y,
        snapped: result.snapped,
        xSnapped: result.xSnapped,
        ySnapped: result.ySnapped,
        lineX: result.lineX,
        lineY: result.lineY,
        xTarget: result.xTarget,
        yTarget: result.yTarget,
      };
    },
    showLines: (result) => getManager()?.showLines(result),
    hideLines: () => getManager()?.hideLines(),

    addGuide: (guide) => getManager()?.addGuide(guide),
    removeGuide: (id) => getManager()?.removeGuide(id),
    clearGuides: () => getManager()?.clearGuides(),

    configure: (patch) => getManager()?.configure(patch),
    getState: () => getManager()?.getState() ?? EMPTY_STATE,
  };
}
