import { Container, Graphics, type Text } from 'pixi.js';

import { BaseElement } from '@/core/BaseElement';
import { createTextBackground } from '@/elements/Text/textBackground';
import { disposeVectorTextState, mountVectorTextEffect } from '@/elements/Text/textEffectMount';
import {
  isBackgroundOnlyUpdate,
  isEffectOnlyUpdate,
  isStyleOnlyVectorUpdate,
  isTransformOnlyUpdate,
  reapplyTextEffect,
  refreshMountedVectorTextStyle,
} from '@/elements/Text/textEffectUpdate';
import { updateRasterTextResolution } from '@/elements/Text/textRaster';
import type { BaseTextOptions } from '@/elements/Text/types';
import type { VectorTextRenderOptions, VectorTextState } from '@/elements/Text/Vector';

export abstract class BaseTextElement<
  TOptions extends BaseTextOptions,
> extends BaseElement<TOptions> {
  protected vectorState: VectorTextState | null = null;
  protected standardTextNode: Text | null = null;
  protected backgroundNode: Graphics | null = null;
  protected decorationNode: Graphics | null = null;
  protected renderVersion = 0;
  protected destroyed = false;

  protected async initTextElement(): Promise<void> {
    this.displayObject = new Container();
    await this.beforeInitialRender();
    await this.renderContent();
    this.applyBaseTransform();
    this.centerPivot();
  }

  destroy(): void {
    this.destroyed = true;
    this.renderVersion++;
    this.beforeDestroy();
    this.clearContent();
    this.displayObject.destroy({ children: true });
  }

  protected beforeDestroy(): void {}

  protected async beforeInitialRender(): Promise<void> {}

  protected clearContent(): void {
    this.vectorState = disposeVectorTextState(this.vectorState);
    this.standardTextNode = null;
    this.backgroundNode = null;
    this.decorationNode = null;
    this.displayObject.removeChildren();
  }

  protected refreshTextResolution(
    scaleX = this.options.scaleX ?? 1,
    scaleY = this.options.scaleY ?? 1,
  ): void {
    updateRasterTextResolution(this.standardTextNode, scaleX, scaleY);
  }

  protected async dispatchUpdate(next: Partial<TOptions>): Promise<void> {
    const keys = Object.keys(next);
    const hasEffectUpdate = 'effect' in next;
    const mergedEffect = hasEffectUpdate
      ? next.effect
        ? { ...(this.options.effect ?? {}), ...next.effect }
        : undefined
      : this.options.effect;

    if (isTransformOnlyUpdate(keys)) {
      Object.assign(this.options, next);
      this.refreshTextResolution();
      this.applyBaseTransform();
      return;
    }

    if (isEffectOnlyUpdate(keys, mergedEffect, this.options.effect, this.vectorState)) {
      Object.assign(this.options, next);
      this.options.effect = mergedEffect;
      reapplyTextEffect(this.vectorState, this.options.effect, this.getResolvedFontSize());
      this.centerPivot();
      return;
    }

    if (isBackgroundOnlyUpdate(keys)) {
      Object.assign(this.options, next);
      this.clearBackgroundNode();
      this.renderBackground();
      return;
    }

    if (isStyleOnlyVectorUpdate(keys, this.vectorState, mergedEffect)) {
      const currentVectorState = this.vectorState;

      if (!currentVectorState) {
        return;
      }

      Object.assign(this.options, next);
      if (hasEffectUpdate) {
        this.options.effect = mergedEffect;
      }

      const textOpts = this.getVectorRenderOptions();

      if (!textOpts) {
        return;
      }

      await refreshMountedVectorTextStyle({
        state: currentVectorState,
        effect: this.options.effect,
        textOpts,
        displayObject: this.displayObject,
        setVectorState: (state) => {
          this.vectorState = state;
        },
      });

      this.clearBackgroundNode();
      this.renderBackground();
      this.centerPivot();
      return;
    }

    if (await this.handleSpecializedUpdate(next, keys)) {
      return;
    }

    const prevFontSize = this.getResolvedFontSize();
    Object.assign(this.options, next);
    if (hasEffectUpdate) {
      this.options.effect = mergedEffect;
    }
    this.afterOptionsAssigned(next, prevFontSize);

    await this.renderContent();

    if (!this.destroyed) {
      this.applyBaseTransform();
      this.centerPivot();
    }
  }

  protected getResolvedFontSize(): number {
    return this.options.fontSize ?? 24;
  }

  protected async handleSpecializedUpdate(
    _next: Partial<TOptions>,
    _keys: string[],
  ): Promise<boolean> {
    return false;
  }

  protected afterOptionsAssigned(_next: Partial<TOptions>, _prevFontSize: number): void {}

  protected async renderContent(): Promise<void> {
    const version = ++this.renderVersion;
    const effect = this.options.effect;

    if (effect) {
      const textOpts = this.getVectorRenderOptions();

      if (!textOpts) {
        return;
      }

      await mountVectorTextEffect({
        version,
        currentVersion: this.renderVersion,
        destroyed: this.destroyed,
        effect,
        textOpts,
        clearContent: () => this.clearContent(),
        setVectorState: (state) => {
          this.vectorState = state;
        },
        displayObject: this.displayObject,
      });

      this.renderBackground();

      return;
    }

    this.renderStandardContent();
    this.renderBackground();
    this.renderDecorations();
  }

  protected setStandardTextNode(textNode: Text): void {
    this.standardTextNode = textNode;
    this.refreshTextResolution();
    this.displayObject.addChild(textNode);
  }

  protected renderDecorations(): void {
    const { underline, strikethrough, fill = 0x000000 } = this.options;

    if (!underline && !strikethrough) {
      return;
    }

    if (this.vectorState) {
      return;
    }

    const thickness = this.getDecorationThickness();
    const segments = this.getDecorationSegments();

    if (segments.length === 0) {
      return;
    }

    const decoration = new Graphics();

    for (const segment of segments) {
      if (segment.width <= 0) {
        continue;
      }

      if (underline) {
        decoration
          .moveTo(segment.x, segment.underlineY)
          .lineTo(segment.x + segment.width, segment.underlineY)
          .stroke({ color: fill, width: thickness, cap: 'square' });
      }

      if (strikethrough) {
        decoration
          .moveTo(segment.x, segment.strikethroughY)
          .lineTo(segment.x + segment.width, segment.strikethroughY)
          .stroke({ color: fill, width: thickness, cap: 'square' });
      }
    }

    this.decorationNode = decoration;
    this.displayObject.addChild(decoration);
  }

  protected renderBackground(): void {
    const bounds = this.getContentBounds();
    const backgroundNode = createTextBackground(this.options, this.getResolvedFontSize(), bounds);

    if (!backgroundNode) {
      return;
    }

    this.backgroundNode = backgroundNode;
    this.displayObject.addChildAt(backgroundNode, 0);
  }

  private clearBackgroundNode(): void {
    if (!this.backgroundNode) {
      return;
    }

    this.displayObject.removeChild(this.backgroundNode);
    this.backgroundNode.destroy();
    this.backgroundNode = null;
  }

  protected getContentBounds(): { x: number; y: number; width: number; height: number } {
    if (this.standardTextNode) {
      return this.standardTextNode.getLocalBounds();
    }

    if (this.vectorState) {
      return this.vectorState.fillLayer.mesh.getLocalBounds();
    }

    return this.displayObject.getLocalBounds();
  }

  protected getDecorationSegments(): Array<{
    x: number;
    width: number;
    underlineY: number;
    strikethroughY: number;
  }> {
    const bounds = this.getContentBounds();

    if (bounds.width <= 0) {
      return [];
    }

    const fontSize = this.getResolvedFontSize();
    const lineInset = Math.max(0, fontSize * 0.04);

    return [
      {
        x: bounds.x,
        width: bounds.width,
        underlineY: bounds.y + bounds.height - lineInset,
        strikethroughY: bounds.y + bounds.height * 0.45,
      },
    ];
  }

  protected getDecorationThickness(fontSize = this.getResolvedFontSize()): number {
    const weightMultiplier = (this.options.fontWeight ?? 'normal') === 'bold' ? 1.35 : 1;
    return Math.max(1, fontSize * 0.055 * weightMultiplier);
  }

  protected abstract renderStandardContent(): void;
  protected abstract getVectorRenderOptions(): VectorTextRenderOptions | null;
}
