import { Mesh, MeshGeometry } from 'pixi.js';
import type {
  TextDecorationSegment,
  VectorTextLayer,
  VectorTextState,
} from '@/elements/Text/types';
import { appendGlyphGeometry } from '@/elements/Text/Vector/glyphGeometry';
import { createSolidColorShader } from '@/elements/Text/Vector/shader';

type GlyphGeometryData = {
  positions: number[];
  indices: number[];
};

export function normalizeGeometryPositions(positions: Float32Array): {
  width: number;
  height: number;
  minX: number;
  minY: number;
} {
  if (positions.length === 0) {
    return { width: 1, height: 1, minX: 0, minY: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i] ?? 0;
    const y = positions[i + 1] ?? 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  for (let i = 0; i < positions.length; i += 2) {
    positions[i] = (positions[i] ?? 0) - minX;
    positions[i + 1] = (positions[i + 1] ?? 0) - minY;
  }

  return {
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
    minX,
    minY,
  };
}

export function getDecorationThickness(fontWeight: string | undefined, fontSize: number): number {
  const weightMultiplier = fontWeight === 'bold' ? 1.35 : 1;
  return Math.max(1, fontSize * 0.055 * weightMultiplier);
}

export function buildVectorLayer(
  positions: Float32Array,
  indices: Uint32Array,
  fill: number | string,
  alpha: number,
  originalPositions = positions,
): VectorTextLayer {
  const geometry = new MeshGeometry({ positions, indices });
  const shader = createSolidColorShader(fill, alpha);
  const mesh = new Mesh({ geometry, shader }) as Mesh;

  return {
    geometry,
    mesh,
    shader,
    originalPositions: new Float32Array(originalPositions),
  };
}

export function buildStrokeLayers(
  indices: Uint32Array,
  originalPositions: Float32Array,
  stroke: number | string | undefined,
  strokeWidth: number,
  strokeAlpha: number,
  strokeAlign: 'inside' | 'center' | 'outside',
): VectorTextLayer[] {
  if (stroke === undefined || strokeWidth <= 0 || strokeAlpha <= 0) {
    return [];
  }

  const radiusMultiplier = strokeAlign === 'outside' ? 1 : strokeAlign === 'center' ? 0.5 : 0.25;
  const radius = Math.max(0.5, strokeWidth * radiusMultiplier);
  const copyCount = 8;
  const layers: VectorTextLayer[] = [];

  for (let i = 0; i < copyCount; i++) {
    const angle = (Math.PI * 2 * i) / copyCount;
    const layer = buildVectorLayer(
      new Float32Array(originalPositions),
      new Uint32Array(indices),
      stroke,
      strokeAlpha,
    );

    layer.mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius);

    layers.push(layer);
  }

  return layers;
}

export function buildDecorationLayers(
  segments: TextDecorationSegment[],
  fill: number | string,
  thickness: number,
  underline: boolean | undefined,
  strikethrough: boolean | undefined,
  columns: number,
): VectorTextLayer[] {
  if ((!underline && !strikethrough) || segments.length === 0) {
    return [];
  }

  const meshColumns = Math.max(8, Math.min(64, Math.floor(columns)));
  const layers: VectorTextLayer[] = [];

  const buildLayer = (
    ySelector: (segment: TextDecorationSegment) => number,
  ): VectorTextLayer | null => {
    const positions: number[] = [];
    const indices: number[] = [];

    for (const segment of segments) {
      const quad = createQuadGeometry(
        segment.x,
        ySelector(segment) - thickness / 2,
        segment.width,
        thickness,
        meshColumns,
      );
      appendGlyphGeometry(positions, indices, quad, 0, 0);
    }

    if (positions.length === 0 || indices.length === 0) {
      return null;
    }

    const positionsArray = new Float32Array(positions);
    return buildVectorLayer(positionsArray, new Uint32Array(indices), fill, 1);
  };

  if (underline) {
    const underlineLayer = buildLayer((segment) => segment.underlineY);
    if (underlineLayer) {
      layers.push(underlineLayer);
    }
  }

  if (strikethrough) {
    const strikethroughLayer = buildLayer((segment) => segment.strikethroughY);
    if (strikethroughLayer) {
      layers.push(strikethroughLayer);
    }
  }

  return layers;
}

export function destroyVectorTextState(state: VectorTextState): void {
  const layers = [state.fillLayer, ...state.strokeLayers, ...state.decorationLayers];

  for (const { mesh, geometry, shader } of layers) {
    try {
      mesh.destroy();
    } catch {
      /* already destroyed */
    }
    try {
      geometry.destroy(true);
    } catch {
      /* already destroyed */
    }
    try {
      if (typeof shader.destroy === 'function') shader.destroy();
    } catch {
      /* noop */
    }
  }
}

function createQuadGeometry(
  x: number,
  y: number,
  width: number,
  height: number,
  segments = 1,
): GlyphGeometryData {
  if (segments <= 1) {
    return {
      positions: [x, y, x + width, y, x + width, y + height, x, y + height],
      indices: [0, 1, 2, 0, 2, 3],
    };
  }

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const px = x + width * t;

    positions.push(px, y, px, y + height);
  }

  for (let i = 0; i < segments; i++) {
    const leftTop = i * 2;
    const leftBottom = leftTop + 1;
    const rightTop = leftTop + 2;
    const rightBottom = leftTop + 3;

    indices.push(leftTop, rightTop, rightBottom, leftTop, rightBottom, leftBottom);
  }

  return { positions, indices };
}
