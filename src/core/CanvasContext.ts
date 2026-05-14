import type { Container } from 'pixi.js';
import type { Application } from '@/canvas/Application';
import type { CanvasKitOptions } from '@/canvas/CanvasKitOptions';
import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';
import type { ElementRegistry } from '@/core/ElementRegistry';
import type { CanvasEventBus } from '@/core/Events';
import type { Extension } from '@/extensions/Extension';

export interface CanvasContext {
  readonly app: Application;
  readonly registry: ElementRegistry;
  readonly events: CanvasEventBus;
  readonly options: CanvasKitOptions;
  readonly stage: Container;
  getElement(id: string): BaseElement<BaseOptions> | undefined;
  addElement(element: BaseElement<BaseOptions>): Promise<void>;
  removeElement(id: string): void;
  clearElements(): void;
  getExtension<T extends Extension>(name: string): T | undefined;
  hasExtension(name: string): boolean;
}
