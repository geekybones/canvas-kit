import type { Container } from 'pixi.js';

import type {
  TextEffectOptions,
  VectorTextRenderOptions,
  VectorTextState,
} from '@/elements/Text/types';
import { reapplyVectorTextEffect, refreshMountedVectorTextLayers } from '@/elements/Text/Vector';

const EFFECT_PARAM_KEYS = new Set(['intensity', 'direction', 'radius']);
const TRANSFORM_KEYS = new Set(['x', 'y', 'rotationDeg', 'scaleX', 'scaleY', 'zIndex', 'visible']);
const BACKGROUND_KEYS = new Set(['background', 'backgroundAlpha', 'backgroundPadding']);
const STYLE_ONLY_VECTOR_KEYS = new Set([
  'fill',
  'stroke',
  'strokeWidth',
  'strokeAlpha',
  'strokeAlign',
  'underline',
  'strikethrough',
]);

export function isTransformOnlyUpdate(keys: string[]): boolean {
  return keys.length > 0 && keys.every((key) => TRANSFORM_KEYS.has(key));
}

export function isEffectOnlyUpdate(
  keys: string[],
  nextEffect: TextEffectOptions | undefined,
  prevEffect: TextEffectOptions | undefined,
  vectorState: VectorTextState | null,
): boolean {
  if (!nextEffect || !prevEffect) {
    return false;
  }

  const effectKeys = Object.keys(nextEffect);

  return (
    keys.includes('effect') &&
    nextEffect.type === prevEffect.type &&
    effectKeys.every((key) => EFFECT_PARAM_KEYS.has(key) || key === 'type') &&
    vectorState !== null
  );
}

export function reapplyTextEffect(
  vectorState: VectorTextState | null,
  effect: TextEffectOptions | undefined,
  fontSize: number,
): void {
  if (!vectorState || !effect) {
    return;
  }

  reapplyVectorTextEffect(vectorState, effect, fontSize);
}

export function isBackgroundOnlyUpdate(keys: string[]): boolean {
  return keys.length > 0 && keys.every((key) => BACKGROUND_KEYS.has(key));
}

export function isStyleOnlyVectorUpdate(
  keys: string[],
  vectorState: VectorTextState | null,
  effect: TextEffectOptions | undefined,
): boolean {
  return (
    vectorState !== null &&
    !!effect &&
    keys.length > 0 &&
    keys.every((key) => STYLE_ONLY_VECTOR_KEYS.has(key))
  );
}

type RefreshMountedVectorTextStyleOptions = {
  state: VectorTextState;
  effect: TextEffectOptions | undefined;
  textOpts: VectorTextRenderOptions;
  displayObject: Container;
  setVectorState: (state: VectorTextState) => void;
};

export async function refreshMountedVectorTextStyle({
  state,
  effect,
  textOpts,
  displayObject,
  setVectorState,
}: RefreshMountedVectorTextStyleOptions): Promise<void> {
  if (!effect) {
    return;
  }

  const nextState = await refreshMountedVectorTextLayers(
    state,
    textOpts,
    effect.type,
    displayObject,
  );
  setVectorState(nextState);
  reapplyTextEffect(nextState, effect, textOpts.fontSize);
}
