import type { CanvasKit, ElementOptions, SerializedElement } from '@geekybones/canvas-kit';
import type { StoreApi } from 'zustand';
import type { CanvasStore } from './store';

// Only structural changes should rebuild the layer list — NOT in-flight gesture frames.
// element:updated is handled separately so it also triggers a rebuild.
const LAYERS_EVENTS = ['element:added', 'element:removed', 'layer:changed'] as const;

type CanvasSetState = StoreApi<CanvasStore>['setState'];

function rebuildSelection(canvas: CanvasKit, setState: CanvasSetState, updatedId?: string): void {
  setState((prev) => {
    const ids = canvas.interaction.getSelectedIds();
    const selectedId = ids[0] ?? null;
    if (updatedId !== undefined && updatedId !== selectedId) {
      return { selection: prev.selection };
    }
    const selected = selectedId
      ? ((canvas.get(selectedId) as ElementOptions | undefined) ?? null)
      : null;
    return {
      selection: { selected, selectedId, selectionCount: ids.length },
    };
  });
}

function rebuildHistory(canvas: CanvasKit, setState: CanvasSetState): void {
  setState({
    history: {
      canUndo: canvas.history.canUndo(),
      canRedo: canvas.history.canRedo(),
    },
  });
}

function rebuildCamera(canvas: CanvasKit, setState: CanvasSetState): void {
  setState({ camera: { zoom: canvas.camera.getState().zoom } });
}

function rebuildLayers(canvas: CanvasKit, setState: CanvasSetState): void {
  const serialized = canvas.serializer?.serialize() ?? [];
  const layers = serialized
    .filter((layer): layer is SerializedElement & { id: string } => typeof layer.id === 'string')
    .sort((a, b) => Number(b.zIndex ?? 0) - Number(a.zIndex ?? 0));
  setState({ layers });
}

/**
 * Mirrors CanvasKit selection, history, camera, and layers into the Zustand store.
 * Returns a cleanup that removes all listeners.
 */
export function attachCanvasSubscriptions(canvas: CanvasKit, setState: CanvasSetState): () => void {
  const onSelected = () => rebuildSelection(canvas, setState);
  // element:transforming fires on every gesture frame — only refresh selection (x/y in inspector).
  const onTransforming = (id: string) => rebuildSelection(canvas, setState, id);
  // element:updated fires on committed changes — refresh selection AND layer list.
  const onUpdated = (id: string) => {
    rebuildSelection(canvas, setState, id);
    rebuildLayers(canvas, setState);
  };
  const onHistoryChanged = () => rebuildHistory(canvas, setState);
  const onCameraChanged = () => rebuildCamera(canvas, setState);
  const onLayersChanged = () => rebuildLayers(canvas, setState);

  rebuildSelection(canvas, setState);
  canvas.on('element:selected', onSelected);
  canvas.on('element:transforming', onTransforming);
  canvas.on('element:updated', onUpdated);

  rebuildHistory(canvas, setState);
  canvas.on('history:changed', onHistoryChanged);

  rebuildCamera(canvas, setState);
  canvas.on('camera:changed', onCameraChanged);

  rebuildLayers(canvas, setState);
  for (const e of LAYERS_EVENTS) canvas.on(e, onLayersChanged);

  return () => {
    canvas.off('element:selected', onSelected);
    canvas.off('element:transforming', onTransforming);
    canvas.off('element:updated', onUpdated);
    canvas.off('history:changed', onHistoryChanged);
    canvas.off('camera:changed', onCameraChanged);
    for (const e of LAYERS_EVENTS) canvas.off(e, onLayersChanged);
  };
}
