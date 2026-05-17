import { useState } from 'react';
import { useCanvas, useCanvasStore } from '@/canvas';
import { TOOL_BUTTONS } from '@/components/header/constants';
import { ExportMenu } from '@/components/header/ExportMenu';
import { HeaderBrand } from '@/components/header/HeaderBrand';
import { HeaderPanelToggles } from '@/components/header/HeaderPanelToggles';
import { HeaderTools } from '@/components/header/HeaderTools';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';
import type { PanelControls } from '@/layout/panelControls';
import { type AddElementKind, createPlaygroundElement } from '@/utils/createPlaygroundElement';
import { downloadBlob } from '@/utils/downloadBlob';

export function Header({ panels }: { panels: PanelControls }) {
  const [activeTool, setActiveTool] = useState<AddElementKind | null>(null);
  const canvas = useCanvas();
  const { canUndo, canRedo } = useCanvasStore((s) => s.history);
  const { zoom } = useCanvasStore((s) => s.camera);
  const zoomStep = useCanvasStore((s) => {
    const cam = s.config.extensions?.camera;
    return typeof cam === 'object' ? (cam.zoomStep ?? 0.1) : 0.1;
  });
  const zoomLabel = `${Math.round(zoom * 100)}%`;

  return (
    <header className="hdr">
      <div className="hdr-l">
        <HeaderPanelToggles
          leftOpen={panels.leftOpen}
          rightOpen={panels.rightOpen}
          onToggleLeft={panels.onToggleLeft}
          onToggleRight={panels.onToggleRight}
        />
        <HeaderBrand />
      </div>
      <HeaderTools
        tools={TOOL_BUTTONS}
        activeTool={activeTool}
        onAdd={(kind) => {
          void (async () => {
            await createPlaygroundElement(canvas, kind);
            setActiveTool(null);
          })();
        }}
      />
      <div className="hdr-r">
        <div className="grp">
          <button
            type="button"
            className="iconbtn"
            title="Clear canvas"
            onClick={() => {
              if (!window.confirm('Clear all elements from the canvas?')) return;
              canvas.clear();
              canvas.interaction.select(null);
            }}
          >
            <Icon d={ICONS.trash} size={15} />
          </button>
          <button
            type="button"
            className="iconbtn"
            disabled={!canUndo}
            title="Undo"
            onClick={() => void canvas.history.undo()}
          >
            <Icon d={ICONS.undo} size={15} />
          </button>
          <button
            type="button"
            className="iconbtn"
            disabled={!canRedo}
            title="Redo"
            onClick={() => void canvas.history.redo()}
          >
            <Icon d={ICONS.redo} size={15} />
          </button>
        </div>
        <div className="grp zoom">
          <button
            type="button"
            className="iconbtn"
            title="Zoom out"
            onClick={() => canvas.camera.setZoom(zoom / (1 + zoomStep))}
          >
            <Icon d={ICONS.minus} size={14} />
          </button>
          <button
            type="button"
            className="zoom-val"
            onClick={() => canvas.camera.setState({ zoom: 1, x: 0, y: 0 })}
          >
            {zoomLabel}
            <Icon d={ICONS.chevDown} size={11} />
          </button>
          <button
            type="button"
            className="iconbtn"
            title="Zoom in"
            onClick={() => canvas.camera.setZoom(zoom * (1 + zoomStep))}
          >
            <Icon d={ICONS.plus} size={14} />
          </button>
        </div>
        <ExportMenu
          onExportPng={async () => {
            const blob = await canvas.export.render('png', {
              mode: 'viewport',
              quality: 'ultra',
            });
            if (blob instanceof Blob) downloadBlob(blob, 'canvas-kit-playground.png');
          }}
          onExportJson={() => {
            const serialized = canvas.serializer.serialize();
            const json = JSON.stringify(serialized, null, 2);
            downloadBlob(
              new Blob([json], { type: 'application/json' }),
              'canvas-kit-playground.json',
            );
          }}
        />
      </div>
    </header>
  );
}
