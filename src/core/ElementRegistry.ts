import type { BaseElement } from '@/core/BaseElement';
import type { BaseOptions } from '@/core/BaseOptions';

export type ElementFactory = (options: BaseOptions) => BaseElement<BaseOptions>;

export class ElementRegistry {
  private readonly elements = new Map<string, BaseElement<BaseOptions>>();
  private readonly factories = new Map<string, ElementFactory>();

  registerFactory(type: string, factory: ElementFactory): void {
    this.factories.set(type, factory);
  }

  add(element: BaseElement<BaseOptions>): void {
    this.elements.set(element.getId(), element);
  }

  get(id: string): BaseElement<BaseOptions> | undefined {
    return this.elements.get(id);
  }

  has(id: string): boolean {
    return this.elements.has(id);
  }

  remove(id: string): BaseElement<BaseOptions> | undefined {
    const el = this.elements.get(id);
    if (el) this.elements.delete(id);
    return el;
  }

  getAll(): ReadonlyMap<string, BaseElement<BaseOptions>> {
    return this.elements;
  }

  clear(): void {
    this.elements.clear();
  }

  createFromOptions(options: BaseOptions): BaseElement<BaseOptions> {
    const factory = this.factories.get(options.type);
    if (!factory) {
      throw new Error(`No factory registered for element type: "${options.type}"`);
    }
    return factory(options);
  }
}
