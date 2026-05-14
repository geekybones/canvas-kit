import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';

type ExportMenuProps = {
  onExportPng: () => void;
  onExportJson: () => void;
};

export function ExportMenu({ onExportPng, onExportJson }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && !exportRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleExportPng() {
    setIsOpen(false);
    onExportPng();
  }

  function handleExportJson() {
    setIsOpen(false);
    onExportJson();
  }

  return (
    <div ref={exportRef} className={`export-btn${isOpen ? ' open' : ''}`}>
      <button type="button" className="export-main" onClick={handleExportPng}>
        <Icon d={ICONS.upload} size={14} />
        Export
      </button>
      <button
        type="button"
        className="export-caret"
        title="More export options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon d={ICONS.chevDown} size={12} />
      </button>
      <div className="export-menu">
        <div className="em-head">Export as</div>
        <button type="button" className="em-item" onClick={handleExportPng}>
          <span className="em-tag">PNG</span>
          <span>Portable Network Graphics</span>
        </button>
        <button type="button" className="em-item" onClick={handleExportJson}>
          <span className="em-tag json">{'{}'}</span>
          <span>JSON schema</span>
        </button>
      </div>
    </div>
  );
}
