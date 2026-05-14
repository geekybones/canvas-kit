import { useCanvas, useCanvasStore } from '@/canvas';
import { Icon } from '@/components/ui/Icon';
import { getElementIcon, typeLabel } from '@/utils/elements';

export function SelectionHeader() {
  const canvas = useCanvas();
  const { selected, selectedId } = useCanvasStore((s) => s.selection);
  if (!selected || !selectedId) return null;

  return (
    <div className="rhead">
      <Icon d={getElementIcon(selected.type)} size={14} />
      <input
        className="rname"
        value={selected.name ?? typeLabel(selected.type)}
        onChange={(event) => void canvas.update(selectedId, { name: event.target.value })}
      />
    </div>
  );
}
