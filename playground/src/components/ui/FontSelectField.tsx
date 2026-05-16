import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Field } from '@/components/ui/fields';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';
import { type FontMeta, loadedFonts, preloadFont } from '@/utils/fonts';

const ITEM_H = 32;

export function FontSelectField({
  value,
  fonts,
  onChange,
}: {
  value: string | undefined;
  fonts: readonly FontMeta[];
  onChange: (font: FontMeta | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  // +1 for the "Default" row at index 0
  const virtualizer = useVirtualizer({
    count: fonts.length + 1,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_H,
    overscan: 5,
  });

  // Position menu and wire outside-click when open
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    const onDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        scrollRef.current?.closest('.font-sel-menu')?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Lazy-load woff for every newly visible font row
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    if (!open) return;
    for (const item of virtualItems) {
      if (item.index === 0) continue;
      const font = fonts[item.index - 1];
      if (font) preloadFont(font, forceUpdate);
    }
  }, [open, virtualItems, fonts]);

  const selectedFont = value ? fonts.find((f) => f.family === value) : undefined;
  const triggerLoaded = selectedFont ? loadedFonts.has(selectedFont.id) : false;

  return (
    <Field label="Font" w={2}>
      <button
        ref={triggerRef}
        type="button"
        className="font-sel-trigger"
        style={triggerLoaded ? { fontFamily: value } : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-sel-val">{value ?? 'Default'}</span>
        <Icon d={ICONS.chevDown} size={12} />
      </button>

      {open && (
        <div
          className="font-sel-menu"
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
        >
          <div ref={scrollRef} className="font-sel-scroll">
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualItems.map((item) => {
                if (item.index === 0) {
                  return (
                    <button
                      key="default"
                      type="button"
                      className={`font-sel-opt${!value ? ' on' : ''}`}
                      style={{ position: 'absolute', top: item.start, height: ITEM_H }}
                      onClick={() => {
                        onChange(undefined);
                        setOpen(false);
                      }}
                    >
                      Default
                    </button>
                  );
                }
                const font = fonts[item.index - 1];
                if (!font) return null;
                const loaded = loadedFonts.has(font.id);
                return (
                  <button
                    key={font.id}
                    type="button"
                    className={`font-sel-opt${value === font.family ? ' on' : ''}`}
                    style={{
                      position: 'absolute',
                      top: item.start,
                      height: ITEM_H,
                      fontFamily: loaded ? font.family : undefined,
                    }}
                    onClick={() => {
                      onChange(font);
                      setOpen(false);
                    }}
                  >
                    {font.family}
                    {!loaded && <span className="font-sel-loading" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Field>
  );
}
