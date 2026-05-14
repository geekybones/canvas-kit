import type { BaseOptions } from '@/core/BaseOptions';
import type { CanvasContext } from '@/core/CanvasContext';
import { KeyboardShortcuts } from '@/core/KeyboardShortcuts';
import type { Extension } from '@/extensions/Extension';
import { createHistoryAccessor } from '@/extensions/history/accessor';
import { AddCommand } from '@/extensions/history/commands/AddCommand';
import type { Command } from '@/extensions/history/commands/Command';
import { RemoveCommand } from '@/extensions/history/commands/RemoveCommand';
import { UpdateCommand } from '@/extensions/history/commands/UpdateCommand';
import type { HistoryConfig, HistoryTrack } from '@/extensions/history/types';

const DEFAULT_HISTORY_TRACK: readonly HistoryTrack[] = [
  'move',
  'resize',
  'rotate',
  'add',
  'remove',
  'zOrder',
  'align',
  'text',
];

export class HistoryManager implements Extension {
  readonly name = 'history';
  accessors?: { history: ReturnType<typeof createHistoryAccessor> };
  private ctx!: CanvasContext;
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private shortcuts: KeyboardShortcuts | null = null;
  private clipboard: BaseOptions[] = [];
  private maxEntries = 100;
  private trackedKinds = new Set<HistoryTrack>(DEFAULT_HISTORY_TRACK);

  constructor(private readonly config: HistoryConfig = {}) {}

  init(ctx: CanvasContext): void {
    this.ctx = ctx;
    this.maxEntries = Math.max(1, this.config.max ?? 100);
    this.trackedKinds = new Set(this.config.track ?? DEFAULT_HISTORY_TRACK);

    const canvas = ctx.app.getCanvas();
    this.shortcuts = new KeyboardShortcuts(canvas);

    this.shortcuts.register('ctrl+z', () => this.undo());
    this.shortcuts.register('ctrl+shift+z', () => this.redo());

    this.accessors = {
      history: createHistoryAccessor(() => ctx.getExtension<HistoryManager>('history')),
    };
  }

  setClipboard(items: BaseOptions[]): void {
    this.clipboard = items.map((opts) => ({ ...opts }));
  }

  getClipboard(): BaseOptions[] {
    return this.clipboard.map((opts) => ({ ...opts }));
  }

  async execute(command: Command): Promise<void> {
    await command.execute();
    this.record(command);
  }

  add(items: BaseOptions | readonly BaseOptions[]): Promise<void> {
    const list = Array.isArray(items) ? items : [items];
    return this.executeCommand(list, (normalized) => new AddCommand(this.ctx, normalized));
  }

  remove(ids: string | readonly string[]): Promise<void> {
    const list = Array.isArray(ids) ? ids : [ids];
    return this.executeCommand(list, (normalized) => new RemoveCommand(this.ctx, normalized));
  }

  update(
    id: string,
    kind: 'move' | 'resize' | 'rotate' | 'zOrder' | 'align' | 'text',
    prev: BaseOptions,
    next: Partial<BaseOptions>,
  ): Promise<void> {
    const cmd = UpdateCommand.create(this.ctx, id, kind, prev, next);
    if (!cmd) return Promise.resolve();
    return this.execute(cmd);
  }

  record(command: Command): void {
    if (!this.shouldTrack(command.kind)) {
      return;
    }

    this.undoStack.push(command);
    this.trimUndoStack();
    this.redoStack = [];
    this.ctx.events.emit('history:changed');
  }

  async undo(): Promise<void> {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    await cmd.undo();
    this.redoStack.push(cmd);
    this.ctx.events.emit('history:changed');
  }

  async redo(): Promise<void> {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    await cmd.execute();
    this.undoStack.push(cmd);
    this.ctx.events.emit('history:changed');
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  shouldTrack(kind: HistoryTrack): boolean {
    return this.trackedKinds.has(kind);
  }

  destroy(): void {
    this.shortcuts?.destroy();
    this.undoStack = [];
    this.redoStack = [];
    this.clipboard = [];
  }

  private trimUndoStack(): void {
    if (this.undoStack.length <= this.maxEntries) {
      return;
    }

    this.undoStack.splice(0, this.undoStack.length - this.maxEntries);
  }

  private executeCommand<T>(
    items: readonly T[],
    create: (items: readonly T[]) => Command,
  ): Promise<void> {
    return this.execute(create(items));
  }
}
