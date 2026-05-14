import type { SerializedElement } from '@geekybones/canvas-kit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCanvasContext, useCanvasStore } from '@/canvas';
import { JsonPane } from '@/components/layers/JsonPane';
import { LayersPane } from '@/components/layers/LayersPane';
import { formatJsonColors, parseJsonColors } from '@/utils/colors';

function useLayersJsonDraftState(layersJson: string) {
  const canvas = useCanvasContext();
  const [jsonDraft, setJsonDraft] = useState(layersJson);
  const [jsonDirty, setJsonDirty] = useState(false);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (!jsonDirty || layersJson === '[]') {
      setJsonDraft(layersJson);
      setJsonDirty(false);
      setJsonError('');
    }
  }, [layersJson, jsonDirty]);

  const setDraftValue = useCallback(
    (value: string) => {
      setJsonDraft(value);
      setJsonDirty(value !== layersJson);
      setJsonError('');
    },
    [layersJson],
  );

  const applyDraft = useCallback(async () => {
    let parsed: SerializedElement[];
    try {
      const next = JSON.parse(jsonDraft) as unknown;
      if (!Array.isArray(next)) {
        setJsonError('JSON must be an array of serialized elements.');
        return;
      }
      parsed = next as SerializedElement[];
    } catch {
      setJsonError('Invalid JSON.');
      return;
    }
    if (!canvas) {
      setJsonError('Canvas is not ready.');
      return;
    }
    if (!canvas.serializer) {
      setJsonError('Serialization extension is unavailable.');
      return;
    }
    setJsonError('');
    try {
      await canvas.serializer.replace(parseJsonColors(parsed) as SerializedElement[]);
      setJsonDirty(false);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Failed to apply JSON.');
    }
  }, [canvas, jsonDraft]);

  const copyDraft = useCallback(() => {
    void navigator.clipboard.writeText(jsonDraft);
  }, [jsonDraft]);

  return { jsonDraft, jsonDirty, jsonError, setDraftValue, applyDraft, copyDraft };
}

export function LeftPanel() {
  const layers = useCanvasStore((s) => s.layers);
  const layersJson = useMemo(() => JSON.stringify(formatJsonColors(layers), null, 2), [layers]);
  const { jsonDraft, jsonDirty, jsonError, setDraftValue, applyDraft, copyDraft } =
    useLayersJsonDraftState(layersJson);

  return (
    <aside className="left">
      <JsonPane
        jsonValue={jsonDraft}
        jsonDirty={jsonDirty}
        jsonError={jsonError}
        layersCount={layers.length}
        onJsonChange={setDraftValue}
        onApplyJson={() => void applyDraft()}
        onCopyJson={copyDraft}
      />
      <div className="lp-divider" />
      <LayersPane />
    </aside>
  );
}
