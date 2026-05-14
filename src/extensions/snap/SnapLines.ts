import { Container, Graphics } from 'pixi.js';
import type { SnapLineStyle } from '@/extensions/snap/types';

const DEFAULT_LINE_STYLE: SnapLineStyle = {
  color: 0x1a73e8,
  alpha: 0.75,
  width: 1,
};

export class SnapLines {
  private readonly container: Container;
  private readonly vLine: Graphics;
  private readonly hLine: Graphics;
  private style: SnapLineStyle;

  constructor(stage: Container, style: Partial<SnapLineStyle> = {}) {
    this.vLine = new Graphics();
    this.hLine = new Graphics();
    this.container = new Container();
    this.style = { ...DEFAULT_LINE_STYLE, ...style };
    this.container.addChild(this.vLine, this.hLine);
    this.container.visible = false;
    this.container.eventMode = 'none';
    // Sit just below the bounding box overlay
    this.container.zIndex = Number.MAX_SAFE_INTEGER - 1;
    stage.addChild(this.container);
  }

  setStyle(style: Partial<SnapLineStyle>): void {
    this.style = { ...this.style, ...style };
  }

  update(
    lineX: number | undefined,
    lineY: number | undefined,
    width: number,
    height: number,
    offsetX = 0,
    offsetY = 0,
  ): void {
    this.vLine.clear();
    this.hLine.clear();

    if (lineX !== undefined) {
      this.vLine
        .moveTo(lineX, offsetY)
        .lineTo(lineX, offsetY + height)
        .stroke({
          color: this.style.color,
          alpha: this.style.alpha,
          width: this.style.width,
        });
    }

    if (lineY !== undefined) {
      this.hLine
        .moveTo(offsetX, lineY)
        .lineTo(offsetX + width, lineY)
        .stroke({
          color: this.style.color,
          alpha: this.style.alpha,
          width: this.style.width,
        });
    }

    this.container.visible = lineX !== undefined || lineY !== undefined;
  }

  hide(): void {
    this.container.visible = false;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
