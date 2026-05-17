import { Icon } from '@/components/ui/Icon';
import type { AddElementKind } from '@/utils/createPlaygroundElement';

type ToolItem = { key: AddElementKind; label: string; icon: unknown };

type HeaderToolsProps = {
  tools: readonly ToolItem[];
  activeTool: AddElementKind | null;
  onAdd: (key: AddElementKind) => void;
};

export function HeaderTools({ tools, activeTool, onAdd }: HeaderToolsProps) {
  return (
    <div className="hdr-c">
      <div className="tools">
        {tools.map((tool) => (
          <button
            type="button"
            key={tool.key}
            className={`tool wide${activeTool === tool.key ? ' on' : ''}`}
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
