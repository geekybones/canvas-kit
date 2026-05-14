import type { CanvasKit } from '@geekybones/canvas-kit';
import { createContext, type ReactNode, useContext } from 'react';

export const CanvasContext = createContext<CanvasKit | null>(null);

export function useCanvasContext(): CanvasKit | null {
  return useContext(CanvasContext);
}

/**
 * Read the mounted `CanvasKit`. Throws if absent — use only under guards where the
 * instance is guaranteed (e.g. after chrome checks), or use {@link useCanvasContext}.
 */
export function useCanvas(): CanvasKit {
  const canvas = useContext(CanvasContext);
  if (!canvas) {
    throw new Error(
      'useCanvas() requires a mounted CanvasKit. Use useCanvasContext() when the instance may be absent, or mount this subtree only after the canvas is ready.',
    );
  }
  return canvas;
}

export function CanvasProvider({
  value,
  children,
}: {
  value: CanvasKit | null;
  children: ReactNode;
}) {
  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}
