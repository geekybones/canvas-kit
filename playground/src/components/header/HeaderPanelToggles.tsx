import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';

type HeaderPanelTogglesProps = {
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
};

export function HeaderPanelToggles({
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
}: HeaderPanelTogglesProps) {
  return (
    <fieldset className="hdr-panel-toggles" aria-label="Panels">
      <button
        type="button"
        className={`iconbtn hdr-panel-btn${leftOpen ? ' on' : ''}`}
        title={leftOpen ? 'Close layers' : 'Open layers'}
        aria-label={leftOpen ? 'Close layers panel' : 'Open layers panel'}
        aria-pressed={leftOpen}
        onClick={onToggleLeft}
      >
        <Icon d={ICONS.layerFrame} size={16} />
      </button>
      <button
        type="button"
        className={`iconbtn hdr-panel-btn${rightOpen ? ' on' : ''}`}
        title={rightOpen ? 'Close inspector' : 'Open inspector'}
        aria-label={rightOpen ? 'Close inspector panel' : 'Open inspector panel'}
        aria-pressed={rightOpen}
        onClick={onToggleRight}
      >
        <Icon d={ICONS.sliders} size={16} />
      </button>
    </fieldset>
  );
}
