import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { HandlePosition } from '@/core/Transform';
import { ICONS, isIconKey } from '@/extensions/interaction/icons';
import type { ControlHandleOptions, HandlerType } from '@/extensions/interaction/types';

const HANDLE_W = 20;
const HANDLE_H = 20;
const HANDLE_RADIUS = 5;
const HANDLE_BG_COLOR = 0x1a73e8;

const HANDLE_ROTATIONS: Partial<Record<HandlePosition, number>> = {
  tl: Math.PI / 4,
  br: Math.PI / 4,
  tc: Math.PI / 2,
  bc: Math.PI / 2,
  lc: 0,
  rc: 0,
  tr: 0,
  bl: 0,
  top: 0,
  btop: 0,
};

const TRANSFORM_CURSORS: Partial<Record<HandlePosition, string>> = {
  tl: 'nwse-resize',
  br: 'nwse-resize',
  tr: 'nesw-resize',
  bl: 'nesw-resize',
  tc: 'ns-resize',
  bc: 'ns-resize',
  lc: 'ew-resize',
  rc: 'ew-resize',
};

function resolveCursor(handler: HandlerType, position: HandlePosition): string {
  if (handler === 'transform') return TRANSFORM_CURSORS[position] ?? 'crosshair';
  if (handler === 'rotate') return 'grab';
  return 'pointer';
}

export class ControlHandle {
  readonly container: Container;
  readonly position: HandlePosition;
  readonly handler: HandlerType;

  constructor(opts: ControlHandleOptions) {
    this.position = opts.position;
    this.handler = opts.handler;
    const w = opts.bgSize ?? HANDLE_W;
    const h = opts.bgSize ?? HANDLE_H;
    const iconSize = opts.size ?? Math.round(w * 0.6);

    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = resolveCursor(opts.handler, opts.position);

    const bg = new Graphics();
    bg.roundRect(-w / 2, -h / 2, w, h, HANDLE_RADIUS);
    bg.fill({ color: opts.bgColor ?? HANDLE_BG_COLOR });
    this.container.addChild(bg);

    const iconRotation = HANDLE_ROTATIONS[opts.position] ?? 0;

    this.loadIcon(opts.icon, iconSize)
      .then((spr) => {
        if (!spr) return;
        spr.anchor.set(0.5);
        spr.width = iconSize;
        spr.height = iconSize;
        spr.rotation = iconRotation;
        this.container.addChild(spr);
      })
      .catch(() => {
        /* icon load failed silently */
      });
  }

  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
  }

  private async loadIcon(icon: string | undefined, size: number): Promise<Sprite | null> {
    if (!icon) return null;

    let svgString: string;

    if (isIconKey(icon)) {
      svgString = ICONS[icon];
    } else if (icon.trim().startsWith('<')) {
      svgString = icon;
    } else {
      try {
        const dpr = Math.ceil(window.devicePixelRatio ?? 1);
        const res = size * dpr * 2;
        const img = await this.loadImageUrl(icon, res);
        const canvas = document.createElement('canvas');
        canvas.width = res;
        canvas.height = res;
        canvas.getContext('2d')?.drawImage(img, 0, 0, res, res);
        const spr = new Sprite(Texture.from(canvas));
        spr.width = size;
        spr.height = size;
        return spr;
      } catch {
        return null;
      }
    }

    return this.svgToSprite(svgString, size);
  }

  private async svgToSprite(svgString: string, size: number): Promise<Sprite> {
    const dpr = Math.ceil(window.devicePixelRatio ?? 1);
    const res = size * dpr * 2; // render at 2× devicePixelRatio for crisp output
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = await this.loadImageUrl(url, res);
    URL.revokeObjectURL(url);
    const canvas = document.createElement('canvas');
    canvas.width = res;
    canvas.height = res;
    canvas.getContext('2d')?.drawImage(img, 0, 0, res, res);
    const texture = Texture.from(canvas);
    const spr = new Sprite(texture);
    spr.width = size;
    spr.height = size;
    return spr;
  }

  private loadImageUrl(url: string, size: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image(size, size);
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}
