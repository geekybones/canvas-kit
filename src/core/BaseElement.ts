import type { Container } from 'pixi.js';
import type { BaseOptions } from '@/core/BaseOptions';

export abstract class BaseElement<TOptions extends BaseOptions> {
  protected options: TOptions;
  protected displayObject!: Container;

  constructor(options: TOptions) {
    this.options = { ...options };
  }

  abstract init(): void | Promise<void>;
  abstract update(next: Partial<TOptions>): void | Promise<void>;
  abstract destroy(): void;

  applyDefaultPosition(x: number, y: number): void {
    if (this.options.x === undefined) this.options.x = x;
    if (this.options.y === undefined) this.options.y = y;
  }

  getId(): string {
    return this.options.id;
  }

  getType(): string {
    return this.options.type;
  }

  getOptions(): TOptions {
    return { ...this.options };
  }

  getDisplayObject(): Container {
    return this.displayObject;
  }

  setZIndex(zIndex: number): void {
    this.options.zIndex = zIndex;
    this.displayObject.zIndex = zIndex;
  }

  protected applyBaseTransform(): void {
    const {
      x = 0,
      y = 0,
      rotationDeg = 0,
      scaleX = 1,
      scaleY = 1,
      zIndex = 0,
      visible = true,
    } = this.options;

    this.displayObject.position.set(x, y);
    this.displayObject.rotation = (rotationDeg * Math.PI) / 180;
    this.displayObject.scale.set(scaleX, scaleY);
    this.displayObject.zIndex = zIndex;
    this.displayObject.visible = visible;
    this.displayObject.cullable = true;
  }

  protected centerPivot(): void {
    const bounds = this.displayObject.getLocalBounds();
    this.displayObject.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  }
}
