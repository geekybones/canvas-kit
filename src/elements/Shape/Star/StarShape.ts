import { Container, Graphics } from 'pixi.js';
import { BaseElement } from '@/core/BaseElement';
import type { StarOptions } from '@/elements/Shape/Star/StarOptions';
import { getStrokeAlignment } from '@/elements/Shape/strokeAlign';

export class StarShape extends BaseElement<StarOptions> {
  private graphics: Graphics | null = null;

  init(): void {
    this.displayObject = new Container();
    this.graphics = new Graphics();
    this.displayObject.addChild(this.graphics);
    this.draw();
    this.applyBaseTransform();
    this.centerPivot();
  }

  update(next: Partial<StarOptions>): void {
    Object.assign(this.options, next);
    this.draw();
    this.applyBaseTransform();
    this.centerPivot();
  }

  destroy(): void {
    this.displayObject.destroy({ children: true });
  }

  private draw(): void {
    if (!this.graphics) return;
    const g = this.graphics;
    g.clear();
    const {
      points,
      width,
      height,
      fill,
      fillAlpha = 1,
      stroke,
      strokeWidth = 1,
      strokeAlpha = 1,
      strokeAlign,
    } = this.options;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius * 0.45;

    if (fill !== undefined || stroke !== undefined) {
      g.star(0, 0, points, outerRadius, innerRadius);
    }
    if (fill !== undefined) {
      g.fill({ color: fill, alpha: fillAlpha });
    }
    if (stroke !== undefined) {
      g.stroke({
        color: stroke,
        width: strokeWidth,
        alpha: strokeAlpha,
        alignment: getStrokeAlignment(strokeAlign),
      });
    }
  }
}
