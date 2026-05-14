import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';
import { colorToHex, hexToNumber } from '@/utils/colors';

export function Field({
  label,
  children,
  w = 1,
  inputClassName,
}: {
  label: string;
  children: React.ReactNode;
  w?: number;
  inputClassName?: string;
}) {
  return (
    <div className={`field f-${w}`}>
      <span className="flbl">{label}</span>
      <div className={`finp${inputClassName ? ` ${inputClassName}` : ''}`}>{children}</div>
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rsec">
      <header className="rsec-h">
        <span>{title}</span>
        {action}
      </header>
      <div className="rsec-body">{children}</div>
    </section>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  const [draft, setDraft] = useState<number | ''>(value ?? '');

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  return (
    <Field label={label}>
      <input
        type="number"
        value={draft}
        min={min}
        step={step}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraft(nextValue === '' ? '' : Number(nextValue));
          if (nextValue === '') return;
          const parsed = Number(nextValue);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        onBlur={() => {
          if (draft === '') setDraft(value ?? '');
        }}
      />
      {suffix ? <span className="suff">{suffix}</span> : null}
    </Field>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string | undefined;
  onChange: (value: number) => void;
}) {
  const hex = colorToHex(value);
  const handleColorChange = (next: string) => onChange(hexToNumber(next));

  return (
    <Field label={label} w={2}>
      <label className="color-pick">
        <span className="rsw" style={{ background: hex }} />
        <input
          className="color-native"
          type="color"
          value={hex}
          onInput={(event) => handleColorChange((event.currentTarget as HTMLInputElement).value)}
          onChange={(event) => handleColorChange(event.currentTarget.value)}
          aria-label={`${label} color`}
        />
      </label>
      <input
        className="hex-in"
        value={hex.replace('#', '')}
        onChange={(event) => onChange(hexToNumber(event.target.value))}
      />
    </Field>
  );
}

export function StringColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hex = colorToHex(value);

  return (
    <Field label={label} w={2}>
      <label className="color-pick">
        <span className="rsw" style={{ background: hex }} />
        <input
          className="color-native"
          type="color"
          value={hex}
          onInput={(event) => onChange((event.currentTarget as HTMLInputElement).value)}
          onChange={(event) => onChange(event.currentTarget.value)}
          aria-label={`${label} color`}
        />
      </label>
      <input
        className="hex-in"
        value={hex.replace('#', '')}
        onChange={(event) => {
          const next = event.target.value.trim().replace('#', '');
          onChange(next ? `#${next}` : '#111827');
        }}
      />
    </Field>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function StrokeAlignField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: 'inside' | 'center' | 'outside') => void;
}) {
  return (
    <Field label="Stroke Align">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as 'inside' | 'center' | 'outside')}
      >
        <option value="inside">Inside</option>
        <option value="center">Center</option>
        <option value="outside">Outside</option>
      </select>
    </Field>
  );
}

export function AlignButtons({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="seg full">
      {[
        ['left', ICONS.alignL],
        ['center', ICONS.alignC],
        ['right', ICONS.alignR],
        ['justify', ICONS.alignJ],
      ].map(([key, icon]) => (
        <button
          key={key as string}
          type="button"
          className={`seg-i${value === key ? ' on' : ''}`}
          onClick={() => onChange(key as string)}
          title={key as string}
        >
          <Icon d={icon} size={14} />
        </button>
      ))}
    </div>
  );
}
