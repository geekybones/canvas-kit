import type { CameraState } from '@/core/Events';

export interface CameraConfig {
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  wheelZoom?: boolean;
}

export type CameraPoint = { x: number; y: number };

export type CameraAccessor = {
  getState(): CameraState;
  setState(next: Partial<CameraState>): void;
  setZoom(zoom: number, anchorX?: number, anchorY?: number): void;
  screenToWorld(screenX: number, screenY: number): CameraPoint;
  worldToScreen(worldX: number, worldY: number): CameraPoint;
};
