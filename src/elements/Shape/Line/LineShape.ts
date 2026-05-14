import { Container, Graphics } from 'pixi.js';
import { BaseElement } from '@/core/BaseElement';
import type { LineOptions } from '@/elements/Shape/Line/LineOptions';

export class LineShape extends BaseElement<LineOptions> {
  private graphics: Graphics | null = null;

  init(): void {
    this.displayObject = new Container();
    this.graphics = new Graphics();
    this.displayObject.addChild(this.graphics);
    this.draw();
    this.applyBaseTransform();
    this.centerPivot();
  }

  update(next: Partial<LineOptions>): void {
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
    const { width, stroke = 0x000000, strokeWidth = 2, strokeAlpha = 1 } = this.options;
    g.moveTo(0, 0).lineTo(width, 0);
    g.stroke({ color: stroke, width: strokeWidth, alpha: strokeAlpha, cap: 'square' });
  }
}
