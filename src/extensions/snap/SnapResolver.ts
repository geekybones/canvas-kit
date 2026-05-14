import type { Bounds } from 'pixi.js';
import type { ElementRegistry } from '@/core/ElementRegistry';
import type {
  Guide,
  InternalSnapResult,
  ResolveOptions,
  SnapAnchor,
  SnapConfig,
  SnapTarget,
} from '@/extensions/snap/types';

interface AxisSnap {
  value: number;
  linePos: number;
  target: SnapTarget;
  anchor: SnapAnchor;
}

interface AxisSnapCandidate {
  snap: AxisSnap | null;
  distance: number;
}

export function resolveSnap(
  config: Required<SnapConfig>,
  guides: ReadonlyMap<string, Guide>,
  registry: ElementRegistry,
  getGridCellSize: () => number,
  getElementBounds: (id: string) => Bounds | null,
  x: number,
  y: number,
  opts: ResolveOptions = {},
): InternalSnapResult {
  const { width = 0, height = 0, exclude = [] } = opts;
  const { threshold } = config;

  const xMid = x + width / 2;
  const xMax = x + width;
  const yMid = y + height / 2;
  const yMax = y + height;

  let snapX: AxisSnap | undefined;
  let snapY: AxisSnap | undefined;

  if (config.guides && guides.size > 0) {
    snapX = resolveGuideAxis(
      guides,
      'vertical',
      { value: x, anchor: 'min' },
      { value: xMid, anchor: 'center' },
      { value: xMax, anchor: 'max' },
      x,
      threshold,
    );
    snapY = resolveGuideAxis(
      guides,
      'horizontal',
      { value: y, anchor: 'min' },
      { value: yMid, anchor: 'center' },
      { value: yMax, anchor: 'max' },
      y,
      threshold,
    );
  }

  if (config.objects || config.edges) {
    const excludeSet = new Set(exclude);
    for (const [id] of registry.getAll()) {
      if (excludeSet.has(id)) continue;
      const bounds = getElementBounds(id);
      if (!bounds) continue;

      if (!snapX) {
        const hit = resolveObjectAxis(
          config,
          { value: x, anchor: 'min' },
          { value: xMid, anchor: 'center' },
          { value: xMax, anchor: 'max' },
          x,
          bounds.x,
          bounds.x + bounds.width / 2,
          bounds.x + bounds.width,
          threshold,
          id,
        );
        if (hit) snapX = hit;
      }

      if (!snapY) {
        const hit = resolveObjectAxis(
          config,
          { value: y, anchor: 'min' },
          { value: yMid, anchor: 'center' },
          { value: yMax, anchor: 'max' },
          y,
          bounds.y,
          bounds.y + bounds.height / 2,
          bounds.y + bounds.height,
          threshold,
          id,
        );
        if (hit) snapY = hit;
      }

      if (snapX && snapY) break;
    }
  }

  if (config.grid) {
    const cell = getGridCellSize();
    if (!snapX) {
      snapX = resolveGridAxis(
        cell,
        threshold,
        { value: x, anchor: 'min' },
        { value: xMid, anchor: 'center' },
        { value: xMax, anchor: 'max' },
        x,
      );
    }
    if (!snapY) {
      snapY = resolveGridAxis(
        cell,
        threshold,
        { value: y, anchor: 'min' },
        { value: yMid, anchor: 'center' },
        { value: yMax, anchor: 'max' },
        y,
      );
    }
  }

  return {
    x: snapX?.value ?? x,
    y: snapY?.value ?? y,
    snapped: !!(snapX || snapY),
    xSnapped: !!snapX,
    ySnapped: !!snapY,
    lineX: snapX?.linePos,
    lineY: snapY?.linePos,
    xTarget: snapX?.target,
    yTarget: snapY?.target,
    xAnchor: snapX?.anchor,
    yAnchor: snapY?.anchor,
  };
}

function resolveGridAxis(
  cellSize: number,
  threshold: number,
  anchor1: { value: number; anchor: SnapAnchor },
  anchor2: { value: number; anchor: SnapAnchor },
  anchor3: { value: number; anchor: SnapAnchor },
  base: number,
): AxisSnap | undefined {
  let best: AxisSnapCandidate = { snap: null, distance: Infinity };

  best = updateGridAxisSnap(best, cellSize, threshold, anchor1, base);
  best = updateGridAxisSnap(best, cellSize, threshold, anchor2, base);
  best = updateGridAxisSnap(best, cellSize, threshold, anchor3, base);

  return best.snap ?? undefined;
}

function resolveGuideAxis(
  guides: ReadonlyMap<string, Guide>,
  orientation: Guide['orientation'],
  anchor1: { value: number; anchor: SnapAnchor },
  anchor2: { value: number; anchor: SnapAnchor },
  anchor3: { value: number; anchor: SnapAnchor },
  base: number,
  threshold: number,
): AxisSnap | undefined {
  let best: AxisSnapCandidate = { snap: null, distance: Infinity };

  for (const guide of guides.values()) {
    if (guide.orientation !== orientation) continue;
    best = updateBestAxisSnap(best, guide.position, threshold, anchor1, guide.id, base, 'guide');
    best = updateBestAxisSnap(best, guide.position, threshold, anchor2, guide.id, base, 'guide');
    best = updateBestAxisSnap(best, guide.position, threshold, anchor3, guide.id, base, 'guide');
  }

  return best.snap ?? undefined;
}

function resolveObjectAxis(
  config: Required<SnapConfig>,
  anchor1: { value: number; anchor: SnapAnchor },
  anchor2: { value: number; anchor: SnapAnchor },
  anchor3: { value: number; anchor: SnapAnchor },
  base: number,
  edge1: number,
  center: number,
  edge2: number,
  threshold: number,
  elementId: string,
): AxisSnap | null {
  let best: AxisSnapCandidate = { snap: null, distance: Infinity };

  if (config.edges) {
    best = updateBestAxisSnap(best, edge1, threshold, anchor1, elementId, base, 'edge');
    best = updateBestAxisSnap(best, edge1, threshold, anchor2, elementId, base, 'edge');
    best = updateBestAxisSnap(best, edge1, threshold, anchor3, elementId, base, 'edge');
    best = updateBestAxisSnap(best, edge2, threshold, anchor1, elementId, base, 'edge');
    best = updateBestAxisSnap(best, edge2, threshold, anchor2, elementId, base, 'edge');
    best = updateBestAxisSnap(best, edge2, threshold, anchor3, elementId, base, 'edge');
  }

  if (config.objects) {
    best = updateBestAxisSnap(best, center, threshold, anchor1, elementId, base, 'object');
    best = updateBestAxisSnap(best, center, threshold, anchor2, elementId, base, 'object');
    best = updateBestAxisSnap(best, center, threshold, anchor3, elementId, base, 'object');
  }

  return best.snap;
}

function updateBestAxisSnap(
  current: AxisSnapCandidate,
  targetPos: number,
  threshold: number,
  source: { value: number; anchor: SnapAnchor },
  reference: string,
  base: number,
  type: SnapTarget['type'],
): AxisSnapCandidate {
  const distance = Math.abs(source.value - targetPos);
  if (distance > threshold || distance >= current.distance) {
    return current;
  }

  return {
    distance,
    snap: {
      value: base + (targetPos - source.value),
      linePos: targetPos,
      target: { type, reference },
      anchor: source.anchor,
    },
  };
}

function updateGridAxisSnap(
  current: AxisSnapCandidate,
  cellSize: number,
  threshold: number,
  source: { value: number; anchor: SnapAnchor },
  base: number,
): AxisSnapCandidate {
  const gridPos = Math.round(source.value / cellSize) * cellSize;
  const distance = Math.abs(source.value - gridPos);
  if (distance > threshold || distance >= current.distance) {
    return current;
  }

  return {
    distance,
    snap: {
      value: base + (gridPos - source.value),
      linePos: gridPos,
      target: { type: 'grid' },
      anchor: source.anchor,
    },
  };
}
