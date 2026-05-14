import type { CanvasKit } from '@geekybones/canvas-kit';
import { useState } from 'react';
import { CanvasProvider } from '@/canvas';
import { CanvasPendingOverlay } from '@/components/CanvasPendingOverlay';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { ShellHeader, ShellLeft, ShellRight } from '@/shell';

export function App() {
  const [canvas, setCanvas] = useState<CanvasKit | null>(null);

  return (
    <CanvasProvider value={canvas}>
      <ShellHeader />
      <ShellLeft />
      <CanvasStage onReady={setCanvas} />
      <ShellRight />
      <CanvasPendingOverlay />
    </CanvasProvider>
  );
}
