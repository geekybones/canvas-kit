import { Icon } from '@/components/ui/Icon';
import type { AddElementKind } from '@/utils/createPlaygroundElement';

type ToolItem = { key: AddElementKind; label: string; icon: unknown };

type HeaderToolsProps = {
  tools: readonly ToolItem[];
  onAdd: (key: AddElementKind) => void;
};

export function HeaderTools({ tools, onAdd }: HeaderToolsProps) {
  return (
    <div className="hdr-c">
      <div className="tools">
        {tools.map((tool) => (
          <button
            type="button"
            key={tool.key}
            className="tool wide"
            onClick={() => onAdd(tool.key)}
          >
            <Icon d={tool.icon} size={15} />
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
