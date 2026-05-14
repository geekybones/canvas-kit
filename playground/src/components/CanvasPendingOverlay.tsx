import { useCanvasContext } from '@/canvas';

export function CanvasPendingOverlay() {
  const canvas = useCanvasContext();
  if (canvas) return null;

  return (
    <div className="canvas-kit-pending" role="status" aria-live="polite">
      <div className="empty">
        <div className="ehead">Preparing CanvasKit…</div>
        <div className="esub">
          The canvas is starting up. Tools and panels will appear here in a moment.
        </div>
      </div>
    </div>
  );
}
