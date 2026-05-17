import { useCanvasContext } from '@/canvas';
import { Header } from '@/components/header/Header';
import { RightPanel } from '@/components/inspector/RightPanel';
import { LeftPanel } from '@/components/layers/LeftPanel';
import type { PanelControls } from '@/layout/panelControls';

export function ShellHeader({ panels }: { panels: PanelControls }) {
  const canvas = useCanvasContext();
  if (!canvas) return <header className="hdr" aria-hidden />;
  return <Header panels={panels} />;
}

export function ShellLeft() {
  const canvas = useCanvasContext();
  if (!canvas) return <aside className="left" aria-hidden />;
  return <LeftPanel />;
}

export function ShellRight() {
  const canvas = useCanvasContext();
  if (!canvas) return <aside className="right" aria-hidden />;
  return <RightPanel />;
}
