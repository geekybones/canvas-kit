import { patchSelection, useCanvas, useCanvasStore } from '@/canvas';
import { ColorField, NumberField, Section, StrokeAlignField } from '@/components/ui/fields';
import { isLine, isShape } from '@/utils/elements';

export function ShapeInspector() {
  const canvas = useCanvas();
  const { selected, selectedId } = useCanvasStore((s) => s.selection);
  if (!selected || !isShape(selected)) return null;

  const isNotLine = !isLine(selected);

  return (
    <Section title="Colors">
      {isNotLine ? (
        <div className="pair-row">
          <ColorField
            label="Fill"
            value={selected.fill}
            onChange={(value) => patchSelection(canvas, selectedId, { fill: value })}
          />
          <NumberField
            label="Fill %"
            value={Math.round((selected.fillAlpha ?? 1) * 100)}
            onChange={(value) => patchSelection(canvas, selectedId, { fillAlpha: value / 100 })}
            min={0}
          />
        </div>
      ) : null}
      {'points' in selected ? (
        <NumberField
          label="Points"
          value={selected.points ?? 5}
          onChange={(value) => patchSelection(canvas, selectedId, { points: value })}
          min={3}
        />
      ) : null}
      <div className={isNotLine ? 'quad-row' : 'triple-row'}>
        <ColorField
          label="Stroke"
          value={selected.stroke ?? '#CBD2DA'}
          onChange={(value) => patchSelection(canvas, selectedId, { stroke: value })}
        />
        <NumberField
          label="Stroke %"
          value={Math.round((selected.strokeAlpha ?? 1) * 100)}
          onChange={(value) => patchSelection(canvas, selectedId, { strokeAlpha: value / 100 })}
          min={0}
        />
        <NumberField
          label="Stroke W"
          value={selected.strokeWidth ?? 2}
          onChange={(value) => patchSelection(canvas, selectedId, { strokeWidth: value })}
          min={0}
        />
        {isNotLine ? (
          <StrokeAlignField
            value={selected.strokeAlign ?? 'center'}
            onChange={(value) => patchSelection(canvas, selectedId, { strokeAlign: value })}
          />
        ) : null}
      </div>
    </Section>
  );
}
