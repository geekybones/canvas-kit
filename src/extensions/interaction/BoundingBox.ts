import type { Matrix } from 'pixi.js';
import { Container, Graphics, Rectangle } from 'pixi.js';

import type { CanvasKitOptions } from '@/canvas/CanvasKitOptions';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { HandlePosition } from '@/core/Transform';
import { Transform } from '@/core/Transform';
import { ControlHandle } from '@/extensions/interaction/controls/ControlHandle';
import type { ControlConfig, InteractionTheme } from '@/extensions/interaction/types';

const DEFAULT_CONTROLS: Partial<Record<HandlePosition, ControlConfig>> = {
  tl: { icon: 'arrowBothSides', handler: 'transform' },
  tc: { icon: 'arrowBothSides', handler: 'transform' },
  tr: { icon: 'trash', handler: 'delete' },
  lc: { icon: 'arrowBothSides', handler: 'transform' },
  rc: { icon: 'arrowBothSides', handler: 'transform' },
  bl: { icon: 'duplicate', handler: 'duplicate' },
  bc: { icon: 'arrowBothSides', handler: 'transform' },
  br: { icon: 'arrowBothSides', handler: 'transform' },
  top: { icon: 'rotate', handler: 'rotate' },
};

const DEFAULT_LINE_COLOR: number | string = 0x1a73e8;
const DEFAULT_LINE_THICKNESS = 1.5;
const DEFAULT_PADDING = 4;

export class BoundingBox {
  readonly container: Container;
  private readonly rectGraphics: Graphics;
  private readonly handles: ControlHandle[] = [];
  private isVisible = true;
  private readonly theme: InteractionTheme;

  constructor(overlayLayer: Container, options: CanvasKitOptions) {
    const interactionConfig =
      typeof options.extensions?.interaction === 'object'
        ? options.extensions.interaction
        : undefined;
    this.theme = interactionConfig?.theme ?? {};

    this.container = new Container();
    this.rectGraphics = new Graphics();
    this.container.addChild(this.rectGraphics);
    overlayLayer.addChild(this.container);
    this.container.visible = false;

    const controlConfigs = {
      ...DEFAULT_CONTROLS,
      ...(interactionConfig?.controls ?? {}),
    };

    const handleTheme = this.theme.handle;
    for (const [pos, cfg] of Object.entries(controlConfigs) as Array<
      [HandlePosition, ControlConfig]
    >) {
      if (!cfg) continue;
      const handle = new ControlHandle({
        position: pos,
        icon: cfg.icon,
        handler: cfg.handler,
        size: cfg.size,
        bgSize: handleTheme?.size,
        bgColor: handleTheme?.color,
      });
      this.container.addChild(handle.container);
      this.handles.push(handle);
    }
  }

  getHandles(): readonly ControlHandle[] {
    return this.handles;
  }

  update(elements: ReadonlyArray<BaseElement<BaseOptions>>): void {
    if (elements.length === 0) {
      this.container.visible = false;
      return;
    }
    this.container.visible = this.isVisible;

    if (elements.length === 1) {
      const [element] = elements;
      if (element) {
        this.updateSingle(element);
      }
    } else {
      this.container.position.set(0, 0);
      this.container.rotation = 0;
      const rect = this.padRect(Transform.getCombinedBoundingRect(elements));
      this.drawRect(rect);
      this.positionHandles(rect);
    }
  }

  hide(): void {
    this.isVisible = false;
    this.container.visible = false;
  }

  show(): void {
    this.isVisible = true;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  // Single-element path: rotate the bounding box container to match the element.
  // Uses the world transform matrix to derive screen-space size and rotation without
  // mutating the display object's rotation property.
  private updateSingle(el: BaseElement<BaseOptions>): void {
    const dObj = el.getDisplayObject();
    const lb = dObj.getLocalBounds();
    const wt: Matrix = dObj.worldTransform;

    // Local centre of the element
    const lcx = lb.x + lb.width / 2;
    const lcy = lb.y + lb.height / 2;

    // Project local centre to screen space
    const screenCx = wt.a * lcx + wt.c * lcy + wt.tx;
    const screenCy = wt.b * lcx + wt.d * lcy + wt.ty;

    // Decompose scale and rotation from the world transform
    const worldScaleX = Math.sqrt(wt.a * wt.a + wt.b * wt.b);
    const worldScaleY = Math.sqrt(wt.c * wt.c + wt.d * wt.d);
    const worldRotation = Math.atan2(wt.b, wt.a);

    const screenW = lb.width * worldScaleX;
    const screenH = lb.height * worldScaleY;

    this.container.position.set(screenCx, screenCy);
    this.container.rotation = worldRotation;

    const localRect = this.padRect(new Rectangle(-screenW / 2, -screenH / 2, screenW, screenH));
    this.drawRect(localRect);
    this.positionHandles(localRect);
  }

  private padRect(rect: Rectangle): Rectangle {
    const p = this.theme.boundingBox?.padding ?? DEFAULT_PADDING;
    return new Rectangle(rect.x - p, rect.y - p, rect.width + p * 2, rect.height + p * 2);
  }

  private drawRect(rect: Rectangle): void {
    const g = this.rectGraphics;
    g.clear();
    const { x, y, width: w, height: h } = rect;
    const color = this.theme.boundingBox?.lineColor ?? DEFAULT_LINE_COLOR;
    const thickness = this.theme.boundingBox?.lineThickness ?? DEFAULT_LINE_THICKNESS;
    const lineType = this.theme.boundingBox?.lineType ?? 'solid';

    if (lineType === 'dotted') {
      this.drawDottedLine(g, x, y, x + w, y, color, thickness);
      this.drawDottedLine(g, x + w, y, x + w, y + h, color, thickness);
      this.drawDottedLine(g, x + w, y + h, x, y + h, color, thickness);
      this.drawDottedLine(g, x, y + h, x, y, color, thickness);
    } else {
      g.moveTo(x, y)
        .lineTo(x + w, y)
        .moveTo(x + w, y)
        .lineTo(x + w, y + h)
        .moveTo(x + w, y + h)
        .lineTo(x, y + h)
        .moveTo(x, y + h)
        .lineTo(x, y)
        .stroke({ color, width: thickness });
    }

    const hasRotate = this.handles.some((h) => h.handler === 'rotate');
    if (hasRotate) {
      const cx = x + w / 2;
      const handleSize = this.theme.handle?.size ?? 20;
      const rotateCenter = y - (handleSize + 12);
      if (lineType === 'dotted') {
        this.drawDottedLine(g, cx, y, cx, rotateCenter, color, thickness);
      } else {
        g.moveTo(cx, y).lineTo(cx, rotateCenter).stroke({ color, width: thickness });
      }
    }
  }

  private drawDottedLine(
    g: Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number | string,
    thickness: number,
  ): void {
    const dotRadius = thickness;
    const gap = 4;
    const dx = x2 - x1,
      dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / len,
      ny = dy / len;
    const step = dotRadius * 2 + gap;
    for (let d = 0; d <= len; d += step) {
      g.circle(x1 + nx * d, y1 + ny * d, dotRadius).fill({ color });
    }
  }

  private positionHandles(rect: Rectangle): void {
    const handleSize = this.theme.handle?.size ?? 20;
    const positions = Transform.getHandlePositions(rect, handleSize);
    for (const handle of this.handles) {
      const pt = positions[handle.position];
      if (pt) handle.setPosition(pt.x, pt.y);
    }
  }
}
