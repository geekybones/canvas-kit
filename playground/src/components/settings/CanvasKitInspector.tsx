import type { CanvasKitOptions, ExtensionsConfig } from '@geekybones/canvas-kit';
import { useEffect, useMemo, useState } from 'react';
import {
  type CameraConfig,
  DEFAULT_CAMERA_CONFIG,
  DEFAULT_GRID_CONFIG,
  DEFAULT_HISTORY_CONFIG,
  DEFAULT_INTERACTION_CONFIG,
  DEFAULT_SNAP_CONFIG,
  type GridConfig,
  HISTORY_TRACKS,
  type HistoryConfig,
  type InteractionConfig,
  type SnapConfig,
  useCanvasStore,
} from '@/canvas';
import {
  ColorField,
  Field,
  NumberField,
  Section,
  StringColorField,
  ToggleField,
} from '@/components/ui/fields';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';

function mergeExtensions(config: CanvasKitOptions, patch: Partial<ExtensionsConfig>) {
  return {
    ...config,
    extensions: {
      ...(config.extensions ?? {}),
      ...patch,
    },
  } satisfies CanvasKitOptions;
}

export function CanvasKitInspector() {
  const kitConfig = useCanvasStore((s) => s.config);
  const updateCanvas = useCanvasStore((s) => s.updateCanvas);
  const [draft, setDraft] = useState<CanvasKitOptions>(() => kitConfig);

  useEffect(() => {
    setDraft(kitConfig);
  }, [kitConfig]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(kitConfig),
    [draft, kitConfig],
  );

  const extensions = draft.extensions ?? {};
  const historyConfig: HistoryConfig =
    extensions.history && typeof extensions.history === 'object'
      ? extensions.history
      : DEFAULT_HISTORY_CONFIG;
  const interactionConfig: InteractionConfig =
    extensions.interaction && typeof extensions.interaction === 'object'
      ? extensions.interaction
      : DEFAULT_INTERACTION_CONFIG;
  const cameraConfig: CameraConfig =
    extensions.camera && typeof extensions.camera === 'object'
      ? extensions.camera
      : DEFAULT_CAMERA_CONFIG;
  const gridConfig: GridConfig =
    extensions.grid && typeof extensions.grid === 'object' ? extensions.grid : DEFAULT_GRID_CONFIG;
  const snapConfig: SnapConfig =
    extensions.snap && typeof extensions.snap === 'object' ? extensions.snap : DEFAULT_SNAP_CONFIG;

  const setRoot = (patch: Partial<CanvasKitOptions>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const setExtension = <TKey extends keyof ExtensionsConfig>(
    key: TKey,
    value: ExtensionsConfig[TKey],
  ) => {
    setDraft((current) => mergeExtensions(current, { [key]: value }));
  };

  const setHistory = (patch: Partial<HistoryConfig>) => {
    setDraft((current) =>
      mergeExtensions(current, {
        history: {
          ...historyConfig,
          ...patch,
        },
      }),
    );
  };

  const setInteraction = (patch: Partial<InteractionConfig>) => {
    setDraft((current) =>
      mergeExtensions(current, {
        interaction: { ...interactionConfig, ...patch },
      }),
    );
  };

  const setInteractionTheme = (patch: Partial<NonNullable<InteractionConfig['theme']>>) => {
    setDraft((current) =>
      mergeExtensions(current, {
        interaction: {
          ...interactionConfig,
          theme: { ...(interactionConfig.theme ?? {}), ...patch },
        },
      }),
    );
  };

  const setMarqueeTheme = (
    patch: Partial<NonNullable<NonNullable<InteractionConfig['theme']>['marquee']>>,
  ) => {
    setDraft((current) =>
      mergeExtensions(current, {
        interaction: {
          ...interactionConfig,
          theme: {
            ...(interactionConfig.theme ?? {}),
            marquee: { ...(interactionConfig.theme?.marquee ?? {}), ...patch },
          },
        },
      }),
    );
  };

  const setCamera = (patch: Partial<CameraConfig>) => {
    setDraft((current) =>
      mergeExtensions(current, {
        camera: {
          ...cameraConfig,
          ...patch,
        },
      }),
    );
  };

  const setGrid = (patch: Partial<GridConfig>) => {
    setDraft((current) =>
      mergeExtensions(current, {
        grid: {
          ...gridConfig,
          ...patch,
        },
      }),
    );
  };

  const setSnap = (patch: Partial<SnapConfig>) => {
    setDraft((current) =>
      mergeExtensions(current, {
        snap: {
          ...snapConfig,
          ...patch,
        },
      }),
    );
  };

  const track = historyConfig.track ?? [];

  return (
    <div className="ck-config">
      <div className="rhead">
        <Icon d={ICONS.layerFrame} size={14} />
        <input className="rname" value="CanvasKit" readOnly />
        <div className="ck-actions">
          <button
            type="button"
            className="ck-btn"
            onClick={() => setDraft(kitConfig)}
            disabled={!isDirty}
          >
            Reset
          </button>
          <button
            type="button"
            className="ck-btn primary"
            onClick={() => updateCanvas((prev) => ({ ...prev, config: draft }))}
            disabled={!isDirty}
          >
            Apply
          </button>
        </div>
      </div>

      <Section title="Canvas">
        <StringColorField
          label="Background"
          value={draft.backgroundColor ?? '#f4f5f7'}
          onChange={(value) => setRoot({ backgroundColor: value })}
        />
        <ToggleField
          label="Constrain to canvas"
          checked={draft.constrainToCanvas ?? true}
          onChange={(checked) => setRoot({ constrainToCanvas: checked })}
        />
      </Section>

      <Section title="Features">
        <div className="ck-features-grid">
          <ToggleField
            label="Alignment"
            checked={extensions.alignment !== false}
            onChange={(checked) => setExtension('alignment', checked)}
          />
          <ToggleField
            label="Layering"
            checked={extensions.layering !== false}
            onChange={(checked) => setExtension('layering', checked)}
          />
          <ToggleField
            label="Serialization"
            checked={extensions.serialization !== false}
            onChange={(checked) => setExtension('serialization', checked)}
          />
          <ToggleField
            label="Export"
            checked={extensions.export !== false}
            onChange={(checked) => setExtension('export', checked)}
          />
          <ToggleField
            label="Fonts"
            checked={extensions.fonts !== false}
            onChange={(checked) => setExtension('fonts', checked)}
          />
          <ToggleField
            label="Performance"
            checked={extensions.performance !== false}
            onChange={(checked) => setExtension('performance', checked)}
          />
          <ToggleField
            label="Context menu"
            checked={extensions.contextMenu !== false}
            onChange={(checked) => setExtension('contextMenu', checked)}
          />
        </div>
      </Section>

      <Section title="History">
        <ToggleField
          label="Enabled"
          checked={extensions.history !== false}
          onChange={(checked) => setExtension('history', checked ? DEFAULT_HISTORY_CONFIG : false)}
        />
        {extensions.history !== false ? (
          <>
            <NumberField
              label="Max"
              value={historyConfig.max ?? 100}
              onChange={(value) => setHistory({ max: value })}
              min={1}
            />
            <Field label="Track" w={2} inputClassName="finp-plain">
              <div className="track-controls">
                <div className="track-actions">
                  <button
                    type="button"
                    className="track-btn"
                    onClick={() => setHistory({ track: [...HISTORY_TRACKS] })}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className="track-btn"
                    onClick={() => setHistory({ track: [] })}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    className="track-btn"
                    onClick={() => setHistory({ track: [...(DEFAULT_HISTORY_CONFIG.track ?? [])] })}
                  >
                    Default
                  </button>
                </div>
                <div className="toggle-grid track-grid">
                  {HISTORY_TRACKS.map((item) => (
                    <ToggleField
                      key={item}
                      label={item}
                      checked={track.includes(item)}
                      onChange={(checked) =>
                        setHistory({
                          track: checked
                            ? [...track, item]
                            : track.filter((value) => value !== item),
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </Field>
          </>
        ) : null}
      </Section>

      <Section title="Interaction">
        <ToggleField
          label="Enabled"
          checked={extensions.interaction !== false}
          onChange={(checked) =>
            setExtension('interaction', checked ? DEFAULT_INTERACTION_CONFIG : false)
          }
        />
        {extensions.interaction !== false ? (
          <>
            <div className="pair-row">
              <StringColorField
                label="Box"
                value={interactionConfig.theme?.boundingBox?.lineColor?.toString() ?? '#000918'}
                onChange={(value) =>
                  setInteractionTheme({
                    boundingBox: {
                      ...(interactionConfig.theme?.boundingBox ?? {}),
                      lineColor: value,
                    },
                  })
                }
              />
              <NumberField
                label="Box W"
                value={interactionConfig.theme?.boundingBox?.lineThickness ?? 1.5}
                onChange={(value) =>
                  setInteractionTheme({
                    boundingBox: {
                      ...(interactionConfig.theme?.boundingBox ?? {}),
                      lineThickness: value,
                    },
                  })
                }
                min={0.5}
                step={0.5}
              />
            </div>
            <div className="pair-row">
              <StringColorField
                label="Handle"
                value={interactionConfig.theme?.handle?.color?.toString() ?? '#000918'}
                onChange={(value) =>
                  setInteractionTheme({
                    handle: {
                      ...(interactionConfig.theme?.handle ?? {}),
                      color: value,
                    },
                  })
                }
              />
              <NumberField
                label="Handle S"
                value={interactionConfig.theme?.handle?.size ?? 18}
                onChange={(value) =>
                  setInteractionTheme({
                    handle: {
                      ...(interactionConfig.theme?.handle ?? {}),
                      size: value,
                    },
                  })
                }
                min={8}
              />
            </div>
            <ToggleField
              label="Marquee"
              checked={interactionConfig.marquee !== false}
              onChange={(checked) => setInteraction({ marquee: checked })}
            />
            {interactionConfig.marquee !== false ? (
              <>
                <div className="pair-row">
                  <StringColorField
                    label="Fill"
                    value={interactionConfig.theme?.marquee?.fillColor?.toString() ?? '#4285f4'}
                    onChange={(value) => setMarqueeTheme({ fillColor: value })}
                  />
                  <NumberField
                    label="Fill %"
                    value={Math.round((interactionConfig.theme?.marquee?.fillAlpha ?? 0.1) * 100)}
                    onChange={(value) => setMarqueeTheme({ fillAlpha: value / 100 })}
                    min={0}
                  />
                </div>
                <div className="pair-row">
                  <StringColorField
                    label="Stroke"
                    value={interactionConfig.theme?.marquee?.strokeColor?.toString() ?? '#4285f4'}
                    onChange={(value) => setMarqueeTheme({ strokeColor: value })}
                  />
                  <NumberField
                    label="Stroke W"
                    value={interactionConfig.theme?.marquee?.strokeWidth ?? 1}
                    onChange={(value) => setMarqueeTheme({ strokeWidth: value })}
                    min={0.5}
                    step={0.5}
                  />
                </div>
                <NumberField
                  label="Stroke %"
                  value={Math.round((interactionConfig.theme?.marquee?.strokeAlpha ?? 0.8) * 100)}
                  onChange={(value) => setMarqueeTheme({ strokeAlpha: value / 100 })}
                  min={0}
                />
              </>
            ) : null}
          </>
        ) : null}
      </Section>

      <Section title="Camera">
        <ToggleField
          label="Enabled"
          checked={extensions.camera !== false}
          onChange={(checked) => setExtension('camera', checked ? DEFAULT_CAMERA_CONFIG : false)}
        />
        {extensions.camera !== false ? (
          <>
            <div className="quad-row">
              <NumberField
                label="Zoom"
                value={cameraConfig.zoom ?? 1}
                onChange={(value) => setCamera({ zoom: value })}
                min={0.1}
                step={0.05}
              />
              <NumberField
                label="Min"
                value={cameraConfig.minZoom ?? 0.25}
                onChange={(value) => setCamera({ minZoom: value })}
                min={0.05}
                step={0.05}
              />
              <NumberField
                label="Max"
                value={cameraConfig.maxZoom ?? 4}
                onChange={(value) => setCamera({ maxZoom: value })}
                min={0.25}
                step={0.25}
              />
              <NumberField
                label="Step"
                value={cameraConfig.zoomStep ?? 0.1}
                onChange={(value) => setCamera({ zoomStep: value })}
                min={0.01}
                step={0.01}
              />
            </div>
            <ToggleField
              label="Wheel zoom"
              checked={cameraConfig.wheelZoom ?? false}
              onChange={(checked) => setCamera({ wheelZoom: checked })}
            />
          </>
        ) : null}
      </Section>

      <Section title="Grid">
        <ToggleField
          label="Enabled"
          checked={extensions.grid !== false}
          onChange={(checked) => setExtension('grid', checked ? gridConfig : false)}
        />
        {extensions.grid !== false ? (
          <>
            <ToggleField
              label="Visible"
              checked={gridConfig.visible ?? true}
              onChange={(checked) => setGrid({ visible: checked })}
            />
            <div className="triple-row">
              <NumberField
                label="Cell"
                value={gridConfig.cellSize ?? 32}
                onChange={(value) => setGrid({ cellSize: value })}
                min={4}
              />
              <NumberField
                label="Major"
                value={gridConfig.majorInterval ?? 4}
                onChange={(value) => setGrid({ majorInterval: value })}
                min={1}
              />
              <NumberField
                label="Minor %"
                value={Math.round((gridConfig.minorLineAlpha ?? 0.6) * 100)}
                onChange={(value) => setGrid({ minorLineAlpha: value / 100 })}
                min={0}
              />
            </div>
            <div className="pair-row">
              <ColorField
                label="Minor"
                value={gridConfig.minorLineColor ?? DEFAULT_GRID_CONFIG.minorLineColor}
                onChange={(value) => setGrid({ minorLineColor: value })}
              />
              <NumberField
                label="Major %"
                value={Math.round((gridConfig.majorLineAlpha ?? 0.9) * 100)}
                onChange={(value) => setGrid({ majorLineAlpha: value / 100 })}
                min={0}
              />
            </div>
            <ColorField
              label="Major"
              value={gridConfig.majorLineColor ?? DEFAULT_GRID_CONFIG.majorLineColor}
              onChange={(value) => setGrid({ majorLineColor: value })}
            />
          </>
        ) : null}
      </Section>

      <Section title="Snap">
        <ToggleField
          label="Enabled"
          checked={extensions.snap !== false}
          onChange={(checked) => setExtension('snap', checked ? snapConfig : false)}
        />
        {extensions.snap !== false ? (
          <>
            <ToggleField
              label="Grid"
              checked={snapConfig.grid ?? true}
              onChange={(checked) => setSnap({ grid: checked })}
            />
            <ToggleField
              label="Objects"
              checked={snapConfig.objects ?? true}
              onChange={(checked) => setSnap({ objects: checked })}
            />
            <ToggleField
              label="Edges"
              checked={snapConfig.edges ?? true}
              onChange={(checked) => setSnap({ edges: checked })}
            />
            <ToggleField
              label="Guides"
              checked={snapConfig.guides ?? true}
              onChange={(checked) => setSnap({ guides: checked })}
            />
            <NumberField
              label="Threshold"
              value={snapConfig.threshold ?? 8}
              onChange={(value) => setSnap({ threshold: value })}
              min={1}
            />
            <ColorField
              label="Line"
              value={snapConfig.lineColor ?? DEFAULT_SNAP_CONFIG.lineColor}
              onChange={(value) => setSnap({ lineColor: value })}
            />
            <NumberField
              label="Line %"
              value={Math.round((snapConfig.lineAlpha ?? 0.75) * 100)}
              onChange={(value) => setSnap({ lineAlpha: value / 100 })}
              min={0}
            />
            <NumberField
              label="Line width"
              value={snapConfig.lineWidth ?? 1}
              onChange={(value) => setSnap({ lineWidth: value })}
              min={1}
              step={0.5}
            />
          </>
        ) : null}
      </Section>
    </div>
  );
}
