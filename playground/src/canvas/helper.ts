import type { CanvasKit, ElementPatch } from '@geekybones/canvas-kit';

export function patchSelection(
  canvas: CanvasKit,
  selectedId: string | null,
  patch: ElementPatch,
): void {
  if (!selectedId) return;
  void canvas.update(selectedId, patch);
}
