import { useState } from 'react';
import { useCanvas, useCanvasStore } from '@/canvas';
import { LayerRow } from '@/components/layers/LayerRow';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';

export function LayersPane() {
  const canvas = useCanvas();
  const layers = useCanvasStore((s) => s.layers);
  const { selectedId } = useCanvasStore((s) => s.selection);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="lp-bot">
      <div className="lp-head">
        <div className="lp-tabs">
          <button type="button" className="lp-tab on">
            Layers
          </button>
        </div>
        <div className="lp-actions" />
      </div>

      {layers.length === 0 ? (
        <div className="layer-list empty-list">
          <div className="layers-empty">
            <Icon d={ICONS.layerFrame} size={20} />
            <div className="le-head">No layers yet</div>
            <div className="le-sub">Use the toolbar to add your first layer.</div>
          </div>
        </div>
      ) : (
        <div className="layer-list">
          {layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              hovered={layer.id === hoveredId}
              selected={layer.id === selectedId}
              onHoverChange={setHoveredId}
              onSelect={(id) => canvas.interaction.select(id)}
              onToggleVisible={(l) => void canvas.update(l.id, { visible: l.visible === false })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
