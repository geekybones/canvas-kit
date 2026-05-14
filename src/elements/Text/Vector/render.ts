import type { Container } from 'pixi.js';

import type {
  MeshEffectFnContext,
  VectorTextRenderOptions,
  VectorTextState,
} from '@/elements/Text/types';
import { buildVectorTextState } from '@/elements/Text/Vector/builder';
import { deformVectorText } from '@/elements/Text/Vector/deform';
import { getMeshEffect } from '@/elements/Text/Vector/registry';
import { destroyVectorTextState } from '@/elements/Text/Vector/vectorLayers';

type EffectParams = {
  type: string;
  intensity?: number;
  direction?: 'up' | 'down';
  radius?: number;
};

/**
 * Builds a vector text mesh for the given effect type.
 * Does NOT apply the effect deformation — call reapplyVectorTextEffect
 * after adding the mesh to the display tree.
 */
export async function renderVectorText(
  textOpts: VectorTextRenderOptions,
  effectType: string,
): Promise<VectorTextState> {
  const entry = getMeshEffect(effectType);

  if (!entry) {
    throw new Error(`[Vector] Unknown effect type "${effectType}".`);
  }

  return buildVectorTextState(textOpts, entry.columns);
}

export async function refreshMountedVectorTextLayers(
  state: VectorTextState,
  textOpts: VectorTextRenderOptions,
  effectType: string,
  displayObject: Container,
): Promise<VectorTextState> {
  const nextState = await renderVectorText(textOpts, effectType);

  for (const layer of [state.fillLayer, ...state.strokeLayers, ...state.decorationLayers]) {
    displayObject.removeChild(layer.mesh);
  }

  destroyVectorTextState(state);

  for (const layer of nextState.strokeLayers) {
    displayObject.addChild(layer.mesh);
  }
  displayObject.addChild(nextState.fillLayer.mesh);
  for (const layer of nextState.decorationLayers) {
    displayObject.addChild(layer.mesh);
  }

  return nextState;
}

/**
 * Applies (or re-applies) the effect deformation to an existing vector state.
 * Must be called after the mesh is added to the display tree.
 */
export function reapplyVectorTextEffect(
  state: VectorTextState,
  effect: EffectParams,
  fontSize: number,
): void {
  const entry = getMeshEffect(effect.type);

  if (!entry) return;

  const ctx: MeshEffectFnContext = {
    textureWidth: state.textureWidth,
    textureHeight: state.textureHeight,
    fontSize,
    radius: effect.radius ?? 200,
    intensity: effect.intensity ?? 50,
    direction: effect.direction ?? 'up',
  };

  deformVectorText(state, entry.fn, ctx);
}
