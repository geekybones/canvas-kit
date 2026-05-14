import { patchSelection, useCanvas, useCanvasStore } from '@/canvas';
import { ColorField, Field, Section } from '@/components/ui/fields';
import { isImage } from '@/utils/elements';

export function ImageInspector() {
  const canvas = useCanvas();
  const { selected, selectedId } = useCanvasStore((s) => s.selection);
  if (!selected || !isImage(selected)) return null;

  return (
    <Section title="Image">
      <Field label="Source" w={2}>
        <input
          value={selected.src ?? ''}
          onChange={(event) => patchSelection(canvas, selectedId, { src: event.target.value })}
        />
      </Field>
      <ColorField
        label="Tint"
        value={selected.tint ?? '#FFFFFF'}
        onChange={(value) => patchSelection(canvas, selectedId, { tint: value })}
      />
    </Section>
  );
}
