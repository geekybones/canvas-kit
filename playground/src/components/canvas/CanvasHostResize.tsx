import type { RefObject } from 'react';
import { useEffect } from 'react';
import { useCanvasContext } from '@/canvas';

type CanvasHostResizeProps = {
  hostRef: RefObject<HTMLElement | null>;
  onLayout: () => void;
};

export function CanvasHostResize({ hostRef, onLayout }: CanvasHostResizeProps) {
  const canvas = useCanvasContext();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !canvas) return undefined;

    const syncSize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      canvas.resize(width, height);
      onLayout();
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(host);
    return () => observer.disconnect();
  }, [canvas, hostRef, onLayout]);

  return null;
}
