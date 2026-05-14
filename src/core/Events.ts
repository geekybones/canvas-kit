import EventEmitter from 'eventemitter3';

export type CameraState = { zoom: number; x: number; y: number };

export type CanvasEventMap = {
  'element:added': [id: string];
  'element:removed': [id: string];
  'element:updated': [id: string];
  'element:selected': [ids: string | readonly string[] | null];
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
