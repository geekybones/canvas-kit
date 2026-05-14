import { patchSelection, useCanvas, useCanvasStore } from '@/canvas';
import { NumberField, Section } from '@/components/ui/fields';
import { isRectangle, isText } from '@/utils/elements';

export function PositionInspector() {
  const canvas = useCanvas();
  const { selected, selectedId } = useCanvasStore((s) => s.selection);
  if (!selected) return null;

  const showWidth = !isText(selected) && 'width' in selected;
  const showHeight = !isText(selected) && 'height' in selected;
  const showRadius = isRectangle(selected);

  return (
    <Section title="Position">
      <div className="triple-row">
        <NumberField
          label="X"
          value={selected.x ?? 0}
          onChange={(value) => patchSelection(canvas, selectedId, { x: value })}
        />
        <NumberField
          label="Y"
          value={selected.y ?? 0}
          onChange={(value) => patchSelection(canvas, selectedId, { y: value })}
        />
        <NumberField
          label="Rotate"
          value={selected.rotationDeg ?? 0}
          onChange={(value) => patchSelection(canvas, selectedId, { rotationDeg: value })}
          suffix="°"
        />
      </div>
      {showWidth || showHeight || showRadius ? (
        <div className="triple-row">
          {showWidth ? (
            <NumberField
              label="W"
              value={selected.width ?? 120}
              onChange={(value) => patchSelection(canvas, selectedId, { width: value })}
              min={1}
            />
          ) : (
            <div />
          )}
          {showHeight ? (
            <NumberField
              label="H"
              value={selected.height ?? 120}
              onChange={(value) => patchSelection(canvas, selectedId, { height: value })}
              min={1}
            />
          ) : (
            <div />
          )}
          {showRadius ? (
            <NumberField
              label="Radius"
              value={selected.borderRadius ?? 0}
              onChange={(value) => patchSelection(canvas, selectedId, { borderRadius: value })}
              min={0}
            />
          ) : (
            <div />
          )}
        </div>
      ) : null}
    </Section>
  );
}
