import type { SerializedElement } from '@geekybones/canvas-kit';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';
import { colorToHex } from '@/utils/colors';
import { getElementIcon, typeLabel } from '@/utils/elements';

type LayerRowProps = {
  layer: SerializedElement;
  hovered: boolean;
  selected: boolean;
  onHoverChange: (id: string | null) => void;
  onSelect: (id: string) => void;
  onToggleVisible: (layer: SerializedElement) => void;
};

export function LayerRow({
  layer,
  hovered,
  selected,
  onHoverChange,
  onSelect,
  onToggleVisible,
}: LayerRowProps) {
  const swatchColor = colorToHex(layer.fill ?? layer.stroke ?? layer.tint, '#E2E8F0');
  const isHidden = layer.visible === false;

  return (
    <div className={`layer-item${hovered ? ' hov' : ''}${selected ? ' sel' : ''}`}>
      <button
        type="button"
        className="layer-row"
        onClick={() => onSelect(layer.id)}
        onMouseEnter={() => onHoverChange(layer.id)}
        onMouseLeave={() => onHoverChange(null)}
        onFocus={() => onHoverChange(layer.id)}
        onBlur={() => onHoverChange(null)}
      >
        <span className="layer-icon" style={{ color: swatchColor }}>
          <Icon d={getElementIcon(layer.type)} size={15} />
        </span>
        <span className="ln">{layer.name ?? typeLabel(layer.type)}</span>
      </button>
      <button
        type="button"
        className={`row-act${isHidden ? ' is-visible' : ''}`}
        title={isHidden ? 'Show layer' : 'Hide layer'}
        aria-label={isHidden ? 'Show layer' : 'Hide layer'}
        onClick={() => onToggleVisible(layer)}
      >
        <Icon d={isHidden ? ICONS.eyeOff : ICONS.eye} size={13} />
      </button>
    </div>
  );
}
