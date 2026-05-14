export type LayeringAccessor = {
  bringToFront(id: string | readonly string[]): void;
  sendToBack(id: string | readonly string[]): void;
  bringForward(id: string): void;
  sendBackward(id: string): void;
  normalizeZIndex(): void;
};
