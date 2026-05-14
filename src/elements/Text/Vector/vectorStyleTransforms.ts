type GlyphGeometryData = {
  positions: number[];
  indices: number[];
};

type Offset2D = {
  x: number;
  y: number;
};

function getGlyphBounds(positions: readonly number[]): { minY: number; maxY: number } {
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 1; i < positions.length; i += 2) {
    const y = positions[i] ?? 0;
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  return { minY, maxY };
}

export function applySyntheticItalic(
  glyphGeometry: GlyphGeometryData,
  fontStyle: string | undefined,
): GlyphGeometryData {
  if (fontStyle !== 'italic' && fontStyle !== 'oblique') {
    return glyphGeometry;
  }

  const { positions, indices } = glyphGeometry;
  const bounds = getGlyphBounds(positions);
  const shear = fontStyle === 'oblique' ? 0.14 : 0.22;
  const transformed = new Array<number>(positions.length);

  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i] ?? 0;
    const y = positions[i + 1] ?? 0;
    transformed[i] = x + (bounds.maxY - y) * shear;
    transformed[i + 1] = y;
  }

  return { positions: transformed, indices };
}

export function getSyntheticBoldOffsets(
  fontWeight: string | undefined,
  fontSize: number,
): Offset2D[] {
  if (fontWeight !== 'bold') {
    return [{ x: 0, y: 0 }];
  }

  const radius = Math.max(0.22, Math.min(0.55, fontSize * 0.009));

  return [
    { x: 0, y: 0 },
    { x: -radius, y: 0 },
    { x: radius, y: 0 },
    { x: 0, y: -radius },
    { x: 0, y: radius },
  ];
}
