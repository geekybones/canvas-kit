import earcut from 'earcut';
import type {
  FontAdapterFont,
  FontAdapterGlyph,
  FontPath,
} from '@/elements/Text/Vector/fontAdapter';

type Point = { x: number; y: number };
type Contour = Point[];

type GlyphGeometry = {
  positions: number[];
  indices: number[];
};

type CurveQuality = {
  quadraticSteps: number;
  cubicSteps: number;
};

const glyphGeometryCache = new Map<string, GlyphGeometry>();

export function getCurveQuality(fontSize: number): CurveQuality {
  const safeFontSize = Math.max(1, fontSize);

  return {
    quadraticSteps: Math.max(8, Math.min(24, Math.ceil(safeFontSize / 8))),
    cubicSteps: Math.max(12, Math.min(36, Math.ceil(safeFontSize / 6))),
  };
}

function signedArea(contour: Contour): number {
  let area = 0;

  for (let i = 0; i < contour.length; i++) {
    const p = contour[i];
    const q = contour[(i + 1) % contour.length];

    if (!p || !q) {
      continue;
    }

    area += p.x * q.y - q.x * p.y;
  }

  return area / 2;
}

function pointInPolygon(point: Point, polygon: Contour): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];

    if (!pi || !pj) {
      continue;
    }

    const intersects =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function pushQuadratic(
  contour: Contour,
  from: Point,
  cx: number,
  cy: number,
  x: number,
  y: number,
  steps: number,
): Point {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;

    contour.push({
      x: mt * mt * from.x + 2 * mt * t * cx + t * t * x,
      y: mt * mt * from.y + 2 * mt * t * cy + t * t * y,
    });
  }

  return { x, y };
}

function pushCubic(
  contour: Contour,
  from: Point,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x: number,
  y: number,
  steps: number,
): Point {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;

    contour.push({
      x: mt * mt * mt * from.x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x,
      y: mt * mt * mt * from.y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y,
    });
  }

  return { x, y };
}

function pathToContours(path: FontPath, quality: CurveQuality): Contour[] {
  const contours: Contour[] = [];

  let current: Contour | null = null;
  let currentPoint: Point = { x: 0, y: 0 };

  for (const command of path.commands) {
    switch (command.type) {
      case 'M': {
        const [x = 0, y = 0] = command.values;
        if (current && current.length >= 3) {
          contours.push(current);
        }

        current = [{ x, y }];
        currentPoint = { x, y };

        break;
      }

      case 'L': {
        const [x = 0, y = 0] = command.values;
        if (!current) current = [];

        current.push({ x, y });
        currentPoint = { x, y };

        break;
      }

      case 'Q': {
        const [x1 = 0, y1 = 0, x = 0, y = 0] = command.values;
        if (!current) current = [];

        currentPoint = pushQuadratic(current, currentPoint, x1, y1, x, y, quality.quadraticSteps);

        break;
      }

      case 'C': {
        const [x1 = 0, y1 = 0, x2 = 0, y2 = 0, x = 0, y = 0] = command.values;
        if (!current) current = [];

        currentPoint = pushCubic(current, currentPoint, x1, y1, x2, y2, x, y, quality.cubicSteps);

        break;
      }

      case 'Z': {
        if (current && current.length >= 3) {
          const first = current[0];
          const last = current[current.length - 1];

          if (first && last && first.x === last.x && first.y === last.y) {
            current.pop();
          }

          if (current.length >= 3) {
            contours.push(current);
          }
        }

        current = null;

        break;
      }

      default:
        break;
    }
  }

  if (current && current.length >= 3) {
    contours.push(current);
  }

  return contours;
}

function triangulateContours(contours: Contour[]): GlyphGeometry {
  const cleanContours = contours.filter((c) => c.length >= 3);

  if (cleanContours.length === 0) {
    return { positions: [], indices: [] };
  }

  const sortedContours = [...cleanContours].sort((a, b) => {
    return Math.abs(signedArea(b)) - Math.abs(signedArea(a));
  });

  const used = new Set<Contour>();
  const positions: number[] = [];
  const indices: number[] = [];

  for (const outer of sortedContours) {
    if (used.has(outer)) continue;

    const outerArea = Math.abs(signedArea(outer));

    const holes = sortedContours.filter((candidate) => {
      if (candidate === outer || used.has(candidate)) return false;

      const candidateArea = Math.abs(signedArea(candidate));

      if (candidateArea >= outerArea) return false;

      const firstPoint = candidate[0];

      return firstPoint ? pointInPolygon(firstPoint, outer) : false;
    });

    used.add(outer);

    for (const hole of holes) {
      used.add(hole);
    }

    const flat: number[] = [];
    const holeIndices: number[] = [];

    for (const p of outer) {
      flat.push(p.x, p.y);
    }

    let vertexOffset = outer.length;

    for (const hole of holes) {
      holeIndices.push(vertexOffset);

      for (const p of hole) {
        flat.push(p.x, p.y);
      }

      vertexOffset += hole.length;
    }

    const localIndices = earcut(flat, holeIndices, 2);
    const globalVertexOffset = positions.length / 2;

    positions.push(...flat);

    for (const index of localIndices) {
      indices.push(globalVertexOffset + index);
    }
  }

  return { positions, indices };
}

export function buildGlyphGeometry(
  fontUrl: string,
  font: FontAdapterFont,
  glyph: FontAdapterGlyph,
  fontSize: number,
  quality: CurveQuality,
): GlyphGeometry {
  const glyphIndex = glyph.id;

  const cacheKey = [fontUrl, glyphIndex, fontSize, quality.quadraticSteps, quality.cubicSteps].join(
    ':',
  );

  const cached = glyphGeometryCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const glyphPath = font.getGlyphPath(glyph, fontSize);
  const contours = pathToContours(glyphPath, quality);
  const geometry = triangulateContours(contours);

  glyphGeometryCache.set(cacheKey, geometry);

  return geometry;
}

export function appendGlyphGeometry(
  targetPositions: number[],
  targetIndices: number[],
  glyphGeometry: GlyphGeometry,
  offsetX: number,
  offsetY = 0,
): void {
  if (glyphGeometry.positions.length === 0 || glyphGeometry.indices.length === 0) {
    return;
  }

  const vertexOffset = targetPositions.length / 2;

  for (let i = 0; i < glyphGeometry.positions.length; i += 2) {
    const x = glyphGeometry.positions[i] ?? 0;
    const y = glyphGeometry.positions[i + 1] ?? 0;

    targetPositions.push(x + offsetX, y + offsetY);
  }

  for (const index of glyphGeometry.indices) {
    targetIndices.push(vertexOffset + index);
  }
}
