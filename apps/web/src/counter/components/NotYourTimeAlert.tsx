import { formatClock, formatSlot, type Slot } from '@stockers/shared';
import { Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { focusRing } from '@/ui/theme';
import { RichText } from './RichText';

/**
 * Screen 2: the server said `NOT_YOUR_TIME`. It shows the worker's time and the time now, and an OK button
 * that clears the selection. Focus goes to OK so a keyboard or a screen reader lands on it.
 */
export function NotYourTimeAlert({
  name,
  slot,
  now,
  focusOk = true,
  onOk,
}: {
  name: string;
  slot: Slot;
  /** The time it is now, as the server said it. */
  now: string;
  /** Move focus to OK. Not for a deep link: nobody has touched anything yet, so a ring would only be noise. */
  focusOk?: boolean;
  onOk: () => void;
}) {
  const { t } = useTranslation('signin');
  const ok = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusOk) ok.current?.focus();
  }, [focusOk]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3.5 rounded-[20px] border-2 border-c-danger-line bg-c-danger-bg px-7 py-[34px] text-center"
    >
      <span
        aria-hidden="true"
        className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-s-play shadow-ball-alert"
      >
        <Clock size={36} strokeWidth={2.4} className="text-c-brass-ink" />
      </span>
      <h2 className="m-0 text-[30px] font-bold">{t('notYourTime.title')}</h2>
      <p className="m-0 text-[19px] leading-[1.45] text-c-text">
        <RichText
          ns="signin"
          i18nKey="notYourTime.line"
          values={{ name, slot: formatSlot(slot) }}
        />
        <br />
        <RichText ns="signin" i18nKey="notYourTime.now" values={{ time: formatClock(now) }} />
      </p>
      <p className="m-0 text-[16px] text-c-danger-ink">{t('notYourTime.owner')}</p>
      <button
        ref={ok}
        type="button"
        onClick={onOk}
        className={`mt-1.5 min-h-touch-main rounded-btn bg-c-brass px-10 text-[19px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press ${focusRing.counter}`}
      >
        {t('notYourTime.ok')}
      </button>
    </div>
  );
}
