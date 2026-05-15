import { useEffect, useRef } from 'react';
import { getShortcutGroups } from '@/components/header/shortcuts';
import { Icon } from '@/components/ui/Icon';

type ShortcutsModalProps = {
  onClose: () => void;
};

function ShortcutKeys({ keys }: { keys: string }) {
  const alternatives = keys.split(' / ');

  return (
    <>
      {alternatives.map((alternative, altIndex) => (
        <span key={alternative}>
          {altIndex > 0 ? <span className="shortcuts-or"> / </span> : null}
          {alternative.split(' + ').map((segment, segmentIndex) => (
            <span key={`${alternative}-${segment}`}>
              {segmentIndex > 0 ? <span className="shortcuts-plus"> + </span> : null}
              <kbd className="shortcuts-key">{segment}</kbd>
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleClose() {
      onClose();
    }

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const groups = getShortcutGroups();

  return (
    <dialog
      ref={dialogRef}
      className="shortcuts-dialog"
      aria-labelledby="shortcuts-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="shortcuts-head">
        <h2 id="shortcuts-title">Keyboard shortcuts</h2>
        <button type="button" className="iconbtn" title="Close" onClick={onClose}>
          <Icon d="M6 6l12 12M18 6L6 18" size={16} />
        </button>
      </div>
      <div className="shortcuts-body">
        {groups.map((group) => (
          <section key={group.title} className="shortcuts-group">
            <h3>{group.title}</h3>
            <table className="shortcuts-table">
              <tbody>
                {group.items.map((item) => (
                  <tr key={`${group.title}-${item.keys}`}>
                    <td>
                      <ShortcutKeys keys={item.keys} />
                    </td>
                    <td>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </dialog>
  );
}
