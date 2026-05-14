export interface GridConfig {
  cellSize?: number;
  majorInterval?: number;
  visible?: boolean;
  minorLineColor?: number;
  minorLineAlpha?: number;
  majorLineColor?: number;
  majorLineAlpha?: number;
}

export type GridState = {
  cellSize: number;
  majorInterval: number;
  visible: boolean;
};

export type GridAccessor = {
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  getState(): GridState;
  setCellSize(size: number): void;
  setMajorInterval(interval: number): void;
};
