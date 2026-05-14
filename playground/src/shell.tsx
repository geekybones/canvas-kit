import { useCanvasContext } from '@/canvas';
import { Header } from '@/components/header/Header';
import { RightPanel } from '@/components/inspector/RightPanel';
import { LeftPanel } from '@/components/layers/LeftPanel';

export function ShellHeader() {
  const canvas = useCanvasContext();
  if (!canvas) return <header className="hdr" aria-hidden />;
  return <Header />;
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
