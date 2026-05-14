import { type Container, Point } from 'pixi.js';
import type { CameraPoint } from '@/extensions/camera/types';

export function screenToWorldPoint(
  worldContainer: Container,
  screenX: number,
  screenY: number,
): CameraPoint {
  const point = worldContainer.toLocal(new Point(screenX, screenY));
  return { x: point.x, y: point.y };
}

export function worldToScreenPoint(
  worldContainer: Container,
  worldX: number,
  worldY: number,
): CameraPoint {
  const point = worldContainer.toGlobal(new Point(worldX, worldY));
  return { x: point.x, y: point.y };
}
