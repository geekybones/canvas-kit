import { CanvasKit, type SerializedElement } from '@geekybones/canvas-kit';
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/canvas';
import mockScene from '@/data/mock.json';
import { parseJsonColors } from '@/utils/colors';
import { FONTS, preloadFont } from '@/utils/fonts';

const SCENE_SEED_LAYER_EVENTS = [
  'element:added',
  'element:removed',
  'element:updated',
  'layer:changed',
] as const;

function syncViewportFromCanvasInHost(host: HTMLElement): void {
  const domCanvas = host.querySelector('canvas');
  if (!domCanvas) return;
  const width = Math.max(1, domCanvas.clientWidth);
  const height = Math.max(1, domCanvas.clientHeight);
  useCanvasStore.setState((s) => ({
    viewport: { ...s.viewport, width, height },
  }));
}

function attachSceneSeedSync(
  canvas: CanvasKit,
  seedRef: RefObject<SerializedElement[]>,
): () => void {
  const updateSeed = () => {
    const serialized = canvas.serializer?.serialize() ?? [];
    if (serialized.length > 0) {
      seedRef.current = parseJsonColors(serialized) as SerializedElement[];
    }
  };
  for (const e of SCENE_SEED_LAYER_EVENTS) canvas.on(e, updateSeed);
  return () => {
    for (const e of SCENE_SEED_LAYER_EVENTS) canvas.off(e, updateSeed);
  };
}

type CanvasStageProps = {
  onReady: (canvas: CanvasKit | null) => void;
};

export function CanvasStage({ onReady }: CanvasStageProps) {
  const kitConfig = useCanvasStore((s) => s.config);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneSeedRef = useRef<SerializedElement[]>(
    parseJsonColors(mockScene) as SerializedElement[],
  );
  const [viewportLayoutKey, setViewportLayoutKey] = useState(0);

  useLayoutEffect(() => {
    void viewportLayoutKey;
    const host = hostRef.current;
    if (!host) return;
    syncViewportFromCanvasInHost(host);
  }, [viewportLayoutKey]);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const host = hostRef.current;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const canvas = new CanvasKit(host, { ...kitConfig, width, height });
    let disposed = false;
    let detachSeedListeners: (() => void) | undefined;

    void canvas.ready.then(async () => {
      if (disposed) return;

      const fontPreloads = sceneSeedRef.current.flatMap((el) => {
        if (el.type !== 'text' || typeof el.fontFamily !== 'string') return [];
        const font = FONTS.find((f) => f.family === el.fontFamily);
        return font ? [preloadFont(font)] : [];
      });
      await Promise.all(fontPreloads);

      if (canvas.serializer) {
        await canvas.serializer.append(sceneSeedRef.current);
      }

      useCanvasStore.getState().bindCanvas(canvas);
      onReady(canvas);
      if (!disposed) {
        setViewportLayoutKey((k) => k + 1);
      }

      detachSeedListeners = attachSceneSeedSync(canvas, sceneSeedRef);
    });

    return () => {
      disposed = true;
      detachSeedListeners?.();
      useCanvasStore.getState().bindCanvas(null);
      onReady(null);
      canvas.destroy();
    };
  }, [kitConfig, onReady]);

  return (
    <main className="canvas-wrap">
      <div ref={hostRef} className="canvas-host" />
    </main>
  );
}
