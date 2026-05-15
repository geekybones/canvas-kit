import type { CanvasContext } from '@/core/CanvasContext';

export interface Extension {
  readonly name: string;
  init(ctx: CanvasContext): void | Promise<void>;
  accessors?: Record<string, unknown>;
  destroy?(): void;
}
