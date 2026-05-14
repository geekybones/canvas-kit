import { useCanvas, useCanvasStore } from '@/canvas';
import { ObjectAlignButtons } from '@/components/inspector/ObjectAlignButtons';
import { Section } from '@/components/ui/fields';

export function AlignmentInspector() {
  const canvas = useCanvas();
  const { selectedId } = useCanvasStore((s) => s.selection);

  return (
    <Section title="Align">
      <ObjectAlignButtons
        disabled={!selectedId}
        onAlign={(mode) => void canvas.alignment.align(mode)}
        wrapperClassName="seg full align-seg"
        buttonClassName="seg-i"
      />
    </Section>
  );
}
