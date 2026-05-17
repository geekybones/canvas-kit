import EventEmitter from 'eventemitter3';

export type CameraState = { zoom: number; x: number; y: number };

export type CanvasEventMap = {
  'element:added': [id: string];
  'element:removed': [id: string];
  /** Committed change — persisted to history, triggers serialization/layer rebuild. */
  'element:updated': [id: string];
  /** In-flight gesture frame — position/scale/rotation changing but not yet committed. */
  'element:transforming': [id: string];
  'element:selected': [ids: string | readonly string[] | null];
  'element:click': [id: string];
  'element:dblclick': [id: string];
  'element:pointerenter': [id: string];
  'element:pointerleave': [id: string];
  'history:changed': [];
  'layer:changed': [];
  'camera:changed': [state: CameraState];
};

export class CanvasEventBus {
  private readonly bus = new EventEmitter();

  emit<K extends keyof CanvasEventMap>(event: K, ...args: CanvasEventMap[K]): void {
    this.bus.emit(event, ...args);
  }

  on<K extends keyof CanvasEventMap>(
    event: K,
    listener: (...args: CanvasEventMap[K]) => void,
  ): void {
    this.bus.on(event, listener as (...args: unknown[]) => void);
  }

  off<K extends keyof CanvasEventMap>(
    event: K,
    listener: (...args: CanvasEventMap[K]) => void,
  ): void {
    this.bus.off(event, listener as (...args: unknown[]) => void);
  }
}
