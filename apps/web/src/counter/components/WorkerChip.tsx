import { formatClock } from '@stockers/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { focusRing } from '@/ui/theme';
import { RichText } from './RichText';
import { TopBarButton } from './TopBarButton';
import { WorkerAvatar } from './WorkerAvatar';

/**
 * The signed-in worker in the top bar: "Zain, Until 11:00 PM". Tapping it offers "Switch worker", which signs
 * him out and goes back to the sign-in page (docs/08 §3). Escape or a tap outside closes the offer.
 */
export function WorkerChip({
  worker,
  until,
  onSwitch,
}: {
  worker: { id: string; name: string };
  /** The moment his sign-in time ends. */
  until: string;
  onSwitch: () => void;
}) {
  const { t } = useTranslation('frame');
  const { t: tc } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const switchButton = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const time = formatClock(until);

  useEffect(() => {
    if (!open) return;
    switchButton.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      chip.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <TopBarButton
        ref={chip}
        aria-label={t('signedIn', { name: worker.name, time })}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        shapeClassName="gap-2.5 ps-2 pe-4"
      >
        <WorkerAvatar
          workerId={worker.id}
          name={worker.name}
          className="h-[38px] w-[38px] text-[17px]"
        />
        <span className="flex flex-col text-start leading-[1.2]">
          <span className="text-[16px] font-bold">{worker.name}</span>
          <span className="text-[13px] text-c-text-2">
            <RichText ns="frame" i18nKey="until" values={{ time }} />
          </span>
        </span>
      </TopBarButton>

      {open ? (
        <div
          id={menuId}
          className="absolute end-0 top-full z-30 mt-2 min-w-[220px] rounded-[14px] border border-c-line-2 bg-c-panel p-2 shadow-dialog-dark"
        >
          <button
            ref={switchButton}
            type="button"
            onClick={() => {
              setOpen(false);
              onSwitch();
            }}
            className={`flex min-h-touch w-full items-center rounded-[10px] px-4 text-start text-[18px] font-semibold text-c-text active:bg-c-raised ${focusRing.counter}`}
          >
            {tc('keypad.switchWorker')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
