export interface BaseOptions {
  readonly id: string;
  name?: string;
  type: string;
  visible?: boolean;
  selectable?: boolean;
  x?: number;
  y?: number;
  rotationDeg?: number;
  scaleX?: number;
  scaleY?: number;
  zIndex?: number;
  custom?: Record<string, unknown>;
}
