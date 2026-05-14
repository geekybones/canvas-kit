import type { Container } from 'pixi.js';

import arialFontUrl from '@/elements/Text/Fonts/Arial/Arial.ttf?url';
import type { TextEffectOptions } from '@/elements/Text/types';
import {
  destroyVectorTextState,
  reapplyVectorTextEffect,
  renderVectorText,
  type VectorTextRenderOptions,
  type VectorTextState,
} from '@/elements/Text/Vector';

export function resolveVectorFontUrl(owner: string, fontUrl?: string): string {
  if (fontUrl) {
    return fontUrl;
  }

  console.warn(`[${owner}] fontUrl is not provided; using Arial.`);
  return arialFontUrl;
}

export function disposeVectorTextState(state: VectorTextState | null): null {
  if (state) {
    destroyVectorTextState(state);
  }

  return null;
}

type MountVectorTextEffectOptions = {
  version: number;
  currentVersion: number;
  destroyed: boolean;
  effect: TextEffectOptions;
  textOpts: VectorTextRenderOptions;
  clearContent: () => void;
  setVectorState: (state: VectorTextState) => void;
  displayObject: Container;
};

export async function mountVectorTextEffect({
  version,
  currentVersion,
  destroyed,
  effect,
  textOpts,
  clearContent,
  setVectorState,
  displayObject,
}: MountVectorTextEffectOptions): Promise<void> {
  const state = await renderVectorText(textOpts, effect.type);

  if (destroyed || version !== currentVersion) {
    destroyVectorTextState(state);
    return;
  }

  clearContent();
  setVectorState(state);
  for (const layer of state.strokeLayers) {
    displayObject.addChild(layer.mesh);
  }
  displayObject.addChild(state.fillLayer.mesh);
  for (const layer of state.decorationLayers) {
    displayObject.addChild(layer.mesh);
  }
  reapplyVectorTextEffect(state, effect, textOpts.fontSize);
}
