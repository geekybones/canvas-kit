import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';

export function MultiSelectionState({ selectionCount }: { selectionCount: number }) {
  return (
    <>
      <div className="rhead">
        <Icon d={ICONS.layerFrame} size={14} />
        <input className="rname" value={`${selectionCount} layers selected`} readOnly />
      </div>
      <div className="empty">
        <Icon d={ICONS.layerFrame} size={22} />
        <div className="ehead">Multi-selection</div>
        <div className="esub">Select a single layer to edit detailed properties.</div>
      </div>
    </>
  );
}
