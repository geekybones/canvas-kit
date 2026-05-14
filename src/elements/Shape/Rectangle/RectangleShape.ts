import { Container, Graphics } from 'pixi.js';
import { BaseElement } from '@/core/BaseElement';
import type { RectangleOptions } from '@/elements/Shape/Rectangle/RectangleOptions';
import { getStrokeAlignment } from '@/elements/Shape/strokeAlign';

export class RectangleShape extends BaseElement<RectangleOptions> {
  private graphics: Graphics | null = null;

  init(): void {
    this.displayObject = new Container();
    this.graphics = new Graphics();
    this.displayObject.addChild(this.graphics);
    this.draw();
    this.applyBaseTransform();
    this.centerPivot();
  }

  update(next: Partial<RectangleOptions>): void {
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
      width,
      height,
      fill,
      fillAlpha = 1,
      stroke,
      strokeWidth = 1,
      strokeAlpha = 1,
      strokeAlign,
      borderRadius,
    } = this.options;

    if (fill !== undefined) {
      if (borderRadius) {
        g.roundRect(0, 0, width, height, borderRadius);
      } else {
        g.rect(0, 0, width, height);
      }
      g.fill({ color: fill, alpha: fillAlpha });
    }

    if (stroke !== undefined) {
      if (borderRadius) {
        g.roundRect(0, 0, width, height, borderRadius);
      } else {
        g.rect(0, 0, width, height);
      }
      g.stroke({
        color: stroke,
        width: strokeWidth,
        alpha: strokeAlpha,
        alignment: getStrokeAlignment(strokeAlign),
      });
    }
  }
}
