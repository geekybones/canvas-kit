type JsonPaneProps = {
  jsonValue: string;
  jsonDirty: boolean;
  jsonError: string;
  layersCount: number;
  onJsonChange: (value: string) => void;
  onApplyJson: () => void;
  onCopyJson: () => void;
};

export function JsonPane({
  jsonValue,
  jsonDirty,
  jsonError,
  layersCount,
  onJsonChange,
  onApplyJson,
  onCopyJson,
}: JsonPaneProps) {
  const status = jsonError ? 'Invalid JSON' : jsonDirty ? 'Unsaved changes' : 'Synced';

  return (
    <div className="lp-top">
      <div className="lp-head">
        <div className="lp-tabs">
          <button type="button" className="lp-tab on">
            JSON
          </button>
        </div>
        <div className="lp-actions">
          <button type="button" className="ghost-btn" onClick={onApplyJson} disabled={!jsonDirty}>
            Apply
          </button>
          <button type="button" className="ghost-btn" onClick={onCopyJson}>
            Copy
          </button>
        </div>
      </div>
      <textarea
        className="layers-json-textarea"
        spellCheck={false}
        value={jsonValue}
        onChange={(event) => onJsonChange(event.target.value)}
      />
      {jsonError ? <div className="json-error">{jsonError}</div> : null}
      <div className="lp-foot">
        <span className={`dot ${jsonError ? 'err' : jsonDirty ? 'warn' : 'ok'}`} /> {status} ·{' '}
        {layersCount} layers
        <span className="spacer" />
        <span className="muted">playground</span>
      </div>
    </div>
  );
}
