import type { FontsAccessor } from '@geekybones/canvas-kit';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';
import { Field } from '@/components/ui/fields';
import { Icon } from '@/components/ui/Icon';
import { ICONS } from '@/icons/icons';
import { type FontMeta, getWoffUrl } from '@/utils/fonts';

const ITEM_H = 32;

export function FontSelectField({
  value,
  fonts,
  fontsAccessor,
  onChange,
}: {
  value: string | undefined;
  fonts: readonly FontMeta[];
  fontsAccessor: FontsAccessor;
  onChange: (font: FontMeta | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loadedFamilies, setLoadedFamilies] = useState<ReadonlySet<string>>(
    () => new Set(fontsAccessor.getLoadedFonts()),
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const virtualizer = useVirtualizer({
    count: fonts.length + 1,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_H,
    overscan: 5,
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void Promise.allSettled(
      fonts.map(async (font) => {
        const url = getWoffUrl(font);
        if (!url || fontsAccessor.isLoaded(font.family)) return;
        await fontsAccessor.load(font.family, url);
        if (!cancelled) {
          setLoadedFamilies((prev) => {
            if (prev.has(font.family)) return prev;
            return new Set([...prev, font.family]);
          });
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [open, fonts, fontsAccessor]);

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

  const virtualItems = virtualizer.getVirtualItems();
  const selectedFont = value ? fonts.find((f) => f.family === value) : undefined;
  const triggerLoaded = selectedFont ? loadedFamilies.has(selectedFont.family) : false;

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
                const loaded = loadedFamilies.has(font.family);
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
