import { useState } from 'react';
import { ShortcutsModal } from '@/components/header/ShortcutsModal';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';

export function HeaderBrand() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <>
      <div className="hdr-l">
        <div className="logo" title="CanvasKit">
          <svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-label="CanvasKit logo">
            <title>CanvasKit logo</title>
            <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#7C5CFF" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#FFB020" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#22C55E" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#0EA5E9" />
          </svg>
        </div>
        <div className="file">
          <div className="file-row">
            <span className="file-name">CanvasKit Playground</span>
            <button
              type="button"
              className="hdr-shortcuts-btn"
              title="Keyboard shortcuts"
              aria-label="Keyboard shortcuts"
              onClick={() => setShortcutsOpen(true)}
            >
              <Icon d={ICONS.keyboard} size={14} />
            </button>
          </div>
        </div>
      </div>
      {shortcutsOpen ? <ShortcutsModal onClose={() => setShortcutsOpen(false)} /> : null}
    </>
  );
}
