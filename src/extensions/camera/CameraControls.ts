import { KeyboardShortcuts } from '@/core/KeyboardShortcuts';

// Multiplicative factor per wheel tick — feels natural across zoom levels
const WHEEL_FACTOR = 1.08;

type Anchor = { x: number; y: number };

type ZoomHandler = (zoom: number, anchorX: number, anchorY: number) => void;

type PanBindings = {
  canvas: HTMLCanvasElement;
  getPanModifierActive(): boolean;
  setPanModifierActive(active: boolean): void;
  getPanning(): boolean;
  setPanning(active: boolean): void;
  getWorldPosition(): Anchor;
  setWorldPosition(x: number, y: number): void;
};

export function createCameraShortcuts(
  canvas: HTMLCanvasElement,
  handlers: {
    zoomIn(): void;
    zoomOut(): void;
    reset(): void;
  },
): KeyboardShortcuts {
  const shortcuts = new KeyboardShortcuts(canvas);
  shortcuts.register('+', handlers.zoomIn);
  shortcuts.register('=', handlers.zoomIn);
  shortcuts.register('-', handlers.zoomOut);
  shortcuts.register('0', handlers.reset);
  return shortcuts;
}

export function attachWheelZoom(
  canvas: HTMLCanvasElement,
  enabled: boolean,
  getZoom: () => number,
  applyZoom: ZoomHandler,
): () => void {
  if (!enabled) {
    return () => {};
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR;
    applyZoom(getZoom() * factor, cx, cy);
  };

  canvas.addEventListener('wheel', onWheel, { passive: false });
  return () => canvas.removeEventListener('wheel', onWheel);
}

export function attachPinchZoom(
  canvas: HTMLCanvasElement,
  getZoom: () => number,
  applyZoom: ZoomHandler,
): Array<() => void> {
  let startDist = 0;
  let startZoom = 1;
  let anchorX = 0;
  let anchorY = 0;

  const distanceBetweenTouches = (touches: TouchList) => {
    const touch0 = touches[0];
    const touch1 = touches[1];
    if (!touch0 || !touch1) return 0;
    const dx = touch1.clientX - touch0.clientX;
    const dy = touch1.clientY - touch0.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    startDist = distanceBetweenTouches(e.touches);
    startZoom = getZoom();
    const rect = canvas.getBoundingClientRect();
    const touch0 = e.touches[0];
    const touch1 = e.touches[1];
    if (!touch0 || !touch1) return;
    anchorX = (touch0.clientX + touch1.clientX) / 2 - rect.left;
    anchorY = (touch0.clientY + touch1.clientY) / 2 - rect.top;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 2 || startDist === 0) return;
    e.preventDefault();
    const scale = distanceBetweenTouches(e.touches) / startDist;
    applyZoom(startZoom * scale, anchorX, anchorY);
  };

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });

  return [
    () => canvas.removeEventListener('touchstart', onTouchStart),
    () => canvas.removeEventListener('touchmove', onTouchMove),
  ];
}

export function attachPanControls(bindings: PanBindings): Array<() => void> {
  const { canvas } = bindings;
  let panStartX = 0;
  let panStartY = 0;
  let panOriginX = 0;
  let panOriginY = 0;

  const updateCursor = () => {
    canvas.style.cursor = bindings.getPanning()
      ? 'grabbing'
      : bindings.getPanModifierActive()
        ? 'grab'
        : '';
  };

  const stopPan = () => {
    bindings.setPanning(false);
    updateCursor();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== ' ') return;
    e.preventDefault();
    if (!bindings.getPanModifierActive()) {
      bindings.setPanModifierActive(true);
      updateCursor();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key !== ' ') return;
    bindings.setPanModifierActive(false);
    stopPan();
  };

  const onBlur = () => {
    bindings.setPanModifierActive(false);
    stopPan();
  };

  const onPointerDown = (e: PointerEvent) => {
    canvas.focus();
    if (e.button !== 0 || !bindings.getPanModifierActive()) return;
    e.preventDefault();
    bindings.setPanning(true);
    panStartX = e.clientX;
    panStartY = e.clientY;
    const worldPosition = bindings.getWorldPosition();
    panOriginX = worldPosition.x;
    panOriginY = worldPosition.y;
    updateCursor();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!bindings.getPanning()) return;
    bindings.setWorldPosition(
      panOriginX + (e.clientX - panStartX),
      panOriginY + (e.clientY - panStartY),
    );
  };

  canvas.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', stopPan);
  window.addEventListener('pointercancel', stopPan);

  return [
    () => canvas.removeEventListener('keydown', onKeyDown),
    () => window.removeEventListener('keyup', onKeyUp),
    () => window.removeEventListener('blur', onBlur),
    () => canvas.removeEventListener('pointerdown', onPointerDown),
    () => window.removeEventListener('pointermove', onPointerMove),
    () => window.removeEventListener('pointerup', stopPan),
    () => window.removeEventListener('pointercancel', stopPan),
  ];
}
