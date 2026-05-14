type KeyHandler = (event: KeyboardEvent) => void;

export class KeyboardShortcuts {
  private readonly listeners = new Map<string, KeyHandler>();
  private readonly boundHandler: (e: KeyboardEvent) => void;

  constructor(private readonly target: HTMLElement) {
    this.boundHandler = this.handleKeyDown.bind(this);
    target.addEventListener('keydown', this.boundHandler);
  }

  register(combo: string, handler: KeyHandler): void {
    this.listeners.set(combo.toLowerCase(), handler);
  }

  unregister(combo: string): void {
    this.listeners.delete(combo.toLowerCase());
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.boundHandler);
    this.listeners.clear();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;

    const combos: string[] = [key];
    if (ctrl && shift) combos.push(`ctrl+shift+${key}`);
    else if (ctrl) combos.push(`ctrl+${key}`);
    else if (shift) combos.push(`shift+${key}`);

    for (const combo of combos) {
      const handler = this.listeners.get(combo);
      if (handler) {
        event.preventDefault();
        handler(event);
        return;
      }
    }
  }
}
