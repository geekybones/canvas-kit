import { patchSelection, useCanvas, useCanvasStore } from '@/canvas';
import {
  AlignButtons,
  ColorField,
  Field,
  NumberField,
  Section,
  StrokeAlignField,
} from '@/components/ui/fields';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';
import { isText, TEXT_EFFECTS } from '@/utils/elements';

export function TextInspector() {
  const canvas = useCanvas();
  const { selected, selectedId } = useCanvasStore((s) => s.selection);
  if (!selected || !isText(selected)) return null;

  const effectType = selected.effect?.type ?? '';

  return (
    <>
      <Section title="Content">
        <Field label="Text" w={2}>
          <textarea
            className="text-area"
            value={selected.text ?? ''}
            onChange={(event) => patchSelection(canvas, selectedId, { text: event.target.value })}
          />
        </Field>
      </Section>

      <Section
        title="Text"
        action={
          selected.background !== undefined ? (
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                patchSelection(canvas, selectedId, {
                  background: undefined,
                  backgroundAlpha: undefined,
                  backgroundPadding: undefined,
                })
              }
            >
              Clear BG
            </button>
          ) : null
        }
      >
        <div className="triple-row">
          <NumberField
            label="Size"
            value={selected.fontSize ?? 24}
            onChange={(value) => patchSelection(canvas, selectedId, { fontSize: value })}
            min={1}
          />
          <NumberField
            label="Line"
            value={selected.lineHeight ?? 1.2}
            onChange={(value) => patchSelection(canvas, selectedId, { lineHeight: value })}
            min={0.5}
            step={0.05}
          />
          <NumberField
            label="Letter"
            value={selected.letterSpacing ?? 0}
            onChange={(value) => patchSelection(canvas, selectedId, { letterSpacing: value })}
            step={0.5}
          />
        </div>
        <ColorField
          label="Fill"
          value={selected.fill}
          onChange={(value) => patchSelection(canvas, selectedId, { fill: value })}
        />
        <div className="triple-row bg-row">
          <ColorField
            label="BG"
            value={selected.background ?? '#FFFFFF'}
            onChange={(value) => patchSelection(canvas, selectedId, { background: value })}
          />
          <NumberField
            label="BG %"
            value={Math.round((selected.backgroundAlpha ?? 1) * 100)}
            onChange={(value) =>
              patchSelection(canvas, selectedId, { backgroundAlpha: value / 100 })
            }
            min={0}
          />
          <NumberField
            label="BG Pad"
            value={selected.backgroundPadding ?? 6}
            onChange={(value) => patchSelection(canvas, selectedId, { backgroundPadding: value })}
            min={0}
            step={0.5}
          />
        </div>
        <div className="quad-row">
          <ColorField
            label="Stroke"
            value={selected.stroke ?? '#000000'}
            onChange={(value) => patchSelection(canvas, selectedId, { stroke: value })}
          />
          <NumberField
            label="Stroke W"
            value={selected.strokeWidth ?? 0}
            onChange={(value) => patchSelection(canvas, selectedId, { strokeWidth: value })}
            min={0}
            step={0.5}
          />
          <NumberField
            label="Stroke %"
            value={Math.round((selected.strokeAlpha ?? 1) * 100)}
            onChange={(value) => patchSelection(canvas, selectedId, { strokeAlpha: value / 100 })}
            min={0}
          />
          <StrokeAlignField
            value={selected.strokeAlign ?? 'center'}
            onChange={(value) => patchSelection(canvas, selectedId, { strokeAlign: value })}
          />
        </div>
        <AlignButtons
          value={selected.align ?? 'left'}
          onChange={(align) =>
            patchSelection(canvas, selectedId, {
              align: align as 'left' | 'center' | 'right' | 'justify',
            })
          }
        />
        <div className="seg full">
          <button
            type="button"
            className={`seg-i${(selected.fontWeight ?? 'normal') === 'bold' ? ' on' : ''}`}
            onClick={() =>
              patchSelection(canvas, selectedId, {
                fontWeight: (selected.fontWeight ?? 'normal') === 'bold' ? 'normal' : 'bold',
              })
            }
            title="Bold"
          >
            <Icon d={ICONS.bold} size={14} />
          </button>
          <button
            type="button"
            className={`seg-i${(selected.fontStyle ?? 'normal') === 'italic' ? ' on' : ''}`}
            onClick={() =>
              patchSelection(canvas, selectedId, {
                fontStyle: (selected.fontStyle ?? 'normal') === 'italic' ? 'normal' : 'italic',
              })
            }
            title="Italic"
          >
            <Icon d={ICONS.italic} size={14} />
          </button>
          <button
            type="button"
            className={`seg-i${selected.underline ? ' on' : ''}`}
            onClick={() => patchSelection(canvas, selectedId, { underline: !selected.underline })}
            title="Underline"
          >
            <Icon d={ICONS.underline} size={14} />
          </button>
          <button
            type="button"
            className={`seg-i${selected.strikethrough ? ' on' : ''}`}
            onClick={() =>
              patchSelection(canvas, selectedId, { strikethrough: !selected.strikethrough })
            }
            title="Strikethrough"
          >
            <Icon d={ICONS.strikethrough} size={14} />
          </button>
        </div>
      </Section>

      <Section title="Effects">
        <Field label="Shape" w={2}>
          <select
            value={effectType}
            onChange={(event) => {
              const next = event.target.value;
              if (!next) {
                patchSelection(canvas, selectedId, { effect: undefined });
                return;
              }
              patchSelection(canvas, selectedId, {
                effect: {
                  type: next as (typeof TEXT_EFFECTS)[number],
                  intensity: selected.effect?.intensity ?? 80,
                  direction: selected.effect?.direction ?? 'up',
                },
              });
            }}
          >
            <option value="">None</option>
            {TEXT_EFFECTS.map((effect: string) => (
              <option key={effect} value={effect}>
                {effect}
              </option>
            ))}
          </select>
        </Field>
        {effectType ? (
          <>
            <NumberField
              label="Intensity"
              value={selected.effect?.intensity ?? 80}
              onChange={(value) =>
                patchSelection(canvas, selectedId, {
                  effect: {
                    type: effectType as (typeof TEXT_EFFECTS)[number],
                    direction: selected.effect?.direction ?? 'up',
                    intensity: value,
                  },
                })
              }
              min={0}
            />
            <Field label="Direction">
              <select
                value={selected.effect?.direction ?? 'up'}
                onChange={(event) =>
                  patchSelection(canvas, selectedId, {
                    effect: {
                      type: effectType as (typeof TEXT_EFFECTS)[number],
                      intensity: selected.effect?.intensity ?? 80,
                      direction: event.target.value as 'up' | 'down',
                    },
                  })
                }
              >
                <option value="up">Up</option>
                <option value="down">Down</option>
              </select>
            </Field>
          </>
        ) : (
          <div className="muted-row">Switch to a vector effect to warp the text mesh.</div>
        )}
      </Section>
    </>
  );
}
