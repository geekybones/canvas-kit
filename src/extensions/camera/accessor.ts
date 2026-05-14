import type { CameraManager } from '@/extensions/camera/CameraManager';
import type { CameraAccessor } from '@/extensions/camera/types';

export function createCameraAccessor(getManager: () => CameraManager | undefined): CameraAccessor {
  return {
    getState: () => getManager()?.getState() ?? { zoom: 1, x: 0, y: 0 },
    setState: (next) => getManager()?.setState(next),
    setZoom: (zoom, anchorX, anchorY) => getManager()?.setZoom(zoom, anchorX, anchorY),
    screenToWorld: (screenX, screenY) =>
      getManager()?.screenToWorld(screenX, screenY) ?? { x: 0, y: 0 },
    worldToScreen: (worldX, worldY) =>
      getManager()?.worldToScreen(worldX, worldY) ?? { x: 0, y: 0 },
  };
}
