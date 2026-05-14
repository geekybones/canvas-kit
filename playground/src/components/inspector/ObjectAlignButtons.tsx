import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';

const ALIGN_BUTTONS = [
  { key: 'left', label: 'Align left', icon: ICONS.alignObjLeft },
  { key: 'center', label: 'Align center', icon: ICONS.alignObjCenter },
  { key: 'right', label: 'Align right', icon: ICONS.alignObjRight },
  { key: 'top', label: 'Align top', icon: ICONS.alignObjTop },
  { key: 'middle', label: 'Align middle', icon: ICONS.alignObjMiddle },
  { key: 'bottom', label: 'Align bottom', icon: ICONS.alignObjBottom },
] as const;

export function ObjectAlignButtons({
  disabled,
  onAlign,
  wrapperClassName,
  buttonClassName = 'iconbtn',
}: {
  disabled: boolean;
  onAlign: (key: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  wrapperClassName?: string;
  buttonClassName?: string;
}) {
  return (
    <div className={wrapperClassName}>
      {ALIGN_BUTTONS.map((button) => (
        <button
          key={button.key}
          type="button"
          className={buttonClassName}
          disabled={disabled}
          onClick={() => onAlign(button.key)}
          title={button.label}
        >
          <Icon d={button.icon} size={15} />
        </button>
      ))}
    </div>
  );
}
