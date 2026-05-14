export class DirtyTracker {
  private readonly dirtySet = new Set<string>();

  markDirty(id: string): void {
    this.dirtySet.add(id);
  }

  isDirty(id: string): boolean {
    return this.dirtySet.has(id);
  }

  flush(): readonly string[] {
    const ids = [...this.dirtySet];
    this.dirtySet.clear();
    return ids;
  }

  clear(): void {
    this.dirtySet.clear();
  }
}
