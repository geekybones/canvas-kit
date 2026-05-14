import type { GridManager } from '@/extensions/grid/GridManager';
import type { GridAccessor, GridState } from '@/extensions/grid/types';

const DEFAULT_GRID_STATE: GridState = {
  cellSize: 20,
  majorInterval: 5,
  visible: true,
};

export function createGridAccessor(getManager: () => GridManager | undefined): GridAccessor {
  return {
    setVisible: (visible) => getManager()?.setVisible(visible),
    isVisible: () => getManager()?.getState().visible ?? true,
    getState: () => getManager()?.getState() ?? DEFAULT_GRID_STATE,
    setCellSize: (size) => getManager()?.setCellSize(size),
    setMajorInterval: (interval) => getManager()?.setMajorInterval(interval),
  };
}
