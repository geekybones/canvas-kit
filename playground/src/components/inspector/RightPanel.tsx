import { useCanvasStore } from '@/canvas';
import { AlignmentInspector } from '@/components/inspector/AlignmentInspector';
import { ImageInspector } from '@/components/inspector/ImageInspector';
import { MultiSelectionState } from '@/components/inspector/MultiSelectionState';
import { PositionInspector } from '@/components/inspector/PositionInspector';
import { SelectionHeader } from '@/components/inspector/SelectionHeader';
import { ShapeInspector } from '@/components/inspector/ShapeInspector';
import { TextInspector } from '@/components/inspector/TextInspector';
import { CanvasKitInspector } from '@/components/settings/CanvasKitInspector';
import { isImage, isShape, isText } from '@/utils/elements';

export function RightPanel() {
  const { selected, selectionCount } = useCanvasStore((s) => s.selection);

  if (!selected) {
    return (
      <aside className="right">
        <CanvasKitInspector />
      </aside>
    );
  }

  if (selectionCount > 1) {
    return (
      <aside className="right">
        <MultiSelectionState selectionCount={selectionCount} />
        <AlignmentInspector />
      </aside>
    );
  }

  return (
    <aside className="right">
      <SelectionHeader />
      <PositionInspector />
      <AlignmentInspector />
      {isText(selected) ? <TextInspector /> : null}
      {isShape(selected) ? <ShapeInspector /> : null}
      {isImage(selected) ? <ImageInspector /> : null}
    </aside>
  );
}
