import { Container, Graphics } from 'pixi.js';
import { BaseElement } from '@/core/BaseElement';
import type { CircleOptions } from '@/elements/Shape/Circle/CircleOptions';
import { getStrokeAlignment } from '@/elements/Shape/strokeAlign';

export class CircleShape extends BaseElement<CircleOptions> {
  private graphics: Graphics | null = null;

  init(): void {
    this.displayObject = new Container();
    this.graphics = new Graphics();
    this.displayObject.addChild(this.graphics);
    this.draw();
    this.applyBaseTransform();
    this.centerPivot();
  }

  update(next: Partial<CircleOptions>): void {
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
      radius = 50,
      width,
      height,
      fill,
      fillAlpha = 1,
      stroke,
      strokeWidth = 1,
      strokeAlpha = 1,
      strokeAlign,
    } = this.options;

    const rx = width !== undefined ? width / 2 : radius;
    const ry = height !== undefined ? height / 2 : radius;
    const drawShape = () => (rx === ry ? g.circle(0, 0, rx) : g.ellipse(0, 0, rx, ry));

    if (fill !== undefined || stroke !== undefined) {
      drawShape();
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
