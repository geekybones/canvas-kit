import type { CanvasKit } from '@geekybones/canvas-kit';
import { useCallback, useEffect, useState } from 'react';
import { CanvasProvider, useCanvasStore } from '@/canvas';
import { CanvasPendingOverlay } from '@/components/CanvasPendingOverlay';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import type { PanelControls } from '@/layout/panelControls';
import { ShellHeader, ShellLeft, ShellRight } from '@/shell';

const NARROW_LAYOUT_MQ = '(max-width: 900px)';

export function App() {
  const [canvas, setCanvas] = useState<CanvasKit | null>(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const closePanels = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, []);

  const selectedId = useCanvasStore((s) => s.selection.selectedId);

  useEffect(() => {
    const mq = window.matchMedia(NARROW_LAYOUT_MQ);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) return;
      closePanels();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [closePanels]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanels();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closePanels]);

  useEffect(() => {
    if (!window.matchMedia(NARROW_LAYOUT_MQ).matches) return;
    if (selectedId) closePanels();
  }, [selectedId, closePanels]);

  const panels: PanelControls = {
    leftOpen,
    rightOpen,
    onToggleLeft: () => setLeftOpen((open) => !open),
    onToggleRight: () => setRightOpen((open) => !open),
    onClosePanels: closePanels,
  };

  const appClass = ['app', leftOpen ? 'panel-left-open' : '', rightOpen ? 'panel-right-open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <CanvasProvider value={canvas}>
      <div className={appClass}>
        <ShellHeader panels={panels} />
        <ShellLeft />
        <CanvasStage onReady={setCanvas} />
        <ShellRight />
        {leftOpen || rightOpen ? (
          <button
            type="button"
            className="panel-backdrop"
            aria-label="Close panels"
            onClick={closePanels}
          />
        ) : null}
        <CanvasPendingOverlay />
      </div>
    </CanvasProvider>
  );
}
