import type {
  MeshEffectFnContext,
  MeshEffectFunction,
  VectorTextLayer,
  VectorTextState,
} from '@/elements/Text/types';

function getVectorTextLayers(state: VectorTextState): VectorTextLayer[] {
  return [state.fillLayer, ...state.strokeLayers, ...state.decorationLayers];
}

export function deformVectorText(
  state: VectorTextState,
  effectFn: MeshEffectFunction,
  ctx: MeshEffectFnContext,
): void {
  const width = Math.max(state.textureWidth, 1);
  const height = Math.max(state.textureHeight, 1);

  for (const layer of getVectorTextLayers(state)) {
    const { geometry, originalPositions } = layer;
    const positions = geometry.positions;

    for (let i = 0; i < positions.length; i += 2) {
      const originalX = originalPositions[i] ?? 0;
      const originalY = originalPositions[i + 1] ?? 0;

      const t = Math.max(0, Math.min(1, originalX / width));
      const col = effectFn(t, ctx);

      const dy = col.dy;
      const scaleY = col.scaleY ?? 1;
      const anchorY = col.anchorY ?? 1;

      let y: number;

      if (anchorY >= 1) {
        const bottomY = height + dy;
        y = bottomY - (height - originalY) * scaleY;
      } else if (anchorY <= 0) {
        const topY = dy;
        y = topY + originalY * scaleY;
      } else {
        const midY = height / 2 + dy;
        y = midY + (originalY - height / 2) * scaleY;
      }

      positions[i] = originalX;
      positions[i + 1] = y;
    }

    geometry.getBuffer('aPosition').update();
  }
}
