export interface SnapConfig {
  grid?: boolean;
  objects?: boolean;
  edges?: boolean;
  guides?: boolean;
  threshold?: number;
  lineColor?: number | string;
  lineAlpha?: number;
  lineWidth?: number;
}

export interface Guide {
  id: string;
  orientation: 'vertical' | 'horizontal';
  position: number;
}

export interface SnapTarget {
  type: 'grid' | 'object' | 'edge' | 'guide';
  reference?: string;
}

export interface SnapResult {
  x: number;
  y: number;
  snapped: boolean;
  xSnapped: boolean;
  ySnapped: boolean;
  lineX?: number;
  lineY?: number;
  xTarget?: SnapTarget;
  yTarget?: SnapTarget;
}

export type SnapAnchor = 'min' | 'center' | 'max';

export type InternalSnapResult = SnapResult & {
  xAnchor?: SnapAnchor;
  yAnchor?: SnapAnchor;
};

export interface ResolveOptions {
  width?: number;
  height?: number;
  exclude?: string[];
  /** When provided, only these element ids are considered as snap candidates. */
  candidateIds?: ReadonlySet<string>;
}

export interface SnapState {
  config: Required<SnapConfig>;
  guides: Guide[];
}

export type SnapAccessor = {
  resolve(x: number, y: number, opts?: ResolveOptions): SnapResult;
  showLines(result: SnapResult): void;
  hideLines(): void;
  addGuide(guide: Guide): void;
  removeGuide(id: string): void;
  clearGuides(): void;
  configure(patch: Partial<SnapConfig>): void;
  getState(): SnapState;
};

export interface SnapLineStyle {
  color: number | string;
  alpha: number;
  width: number;
}

export const DEFAULT_SNAP_CONFIG: Required<SnapConfig> = {
  grid: true,
  objects: true,
  edges: true,
  guides: true,
  threshold: 8,
  lineColor: 0x1a73e8,
  lineAlpha: 0.75,
  lineWidth: 1,
};
