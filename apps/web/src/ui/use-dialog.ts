import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * What every dialog needs (golden rule 11): focus moves in when it opens, Tab stays inside, Escape
 * closes it, and focus goes back to what opened it. Put the returned ref on the dialog element.
 * Give one control `data-autofocus` to start there; otherwise the first control gets focus.
 * Pass `active: false` for a dialog that is only shown in place (the kit page). Pass `trap: false`
 * for a side panel that sits next to the page on a wide screen: it still takes and returns focus and
 * closes on Escape, but Tab may leave it.
 */
export function useDialog<T extends HTMLElement>(
  onClose: (() => void) | undefined,
  active = true,
  trap = true,
): RefObject<T> {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose; // always the latest handler, without re-running the focus setup below
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!active || !dialog) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => !element.closest('[hidden], [inert], [aria-hidden="true"]'),
      );

    (dialog.querySelector<HTMLElement>('[data-autofocus]') ?? controls()[0] ?? dialog).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && closeRef.current) {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog || !trap) return;
      const items = controls();
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const inside = dialog.contains(document.activeElement);
      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [active, trap]);

  return ref;
}
