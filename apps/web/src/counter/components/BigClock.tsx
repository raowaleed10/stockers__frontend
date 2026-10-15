import { formatClock, formatDay, toClubIso } from '@stockers/shared';
import { useNow } from '@/lib/clock';
import { cx } from '@/ui/cx';

/**
 * The big clock of the sign-in and lock screens: "9:42" on one line and "PM, Saturday 3 October" under it.
 * It has its own `useNow`, so only this block redraws each second. Times and dates keep their order in
 * Urdu (`<bdi dir="ltr">`); the Urdu words for morning and evening are P18's job (docs/09).
 */
const LOOK = {
  signIn: {
    box: 'gap-1.5',
    numerals: 'text-[132px] font-semibold leading-[0.9]',
    date: 'text-[26px] font-medium',
  },
  lock: {
    box: 'gap-1',
    numerals: 'text-[140px] font-semibold leading-[0.9]',
    date: 'text-[26px] text-c-text-3',
  },
} as const;

export function BigClock({ look, className }: { look: keyof typeof LOOK; className?: string }) {
  const now = useNow();
  const iso = toClubIso(now);
  const [time = '', period = ''] = formatClock(iso).split(' ');
  const size = LOOK[look];
  return (
    <div data-testid="big-clock" className={cx('flex flex-col', size.box, className)}>
      <span className={cx('font-num tabular-nums', size.numerals)}>{time}</span>
      <span className={size.date}>
        <bdi dir="ltr">
          {period}, {formatDay(iso, true)}
        </bdi>
      </span>
    </div>
  );
}
