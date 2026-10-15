import { toClubIso } from '@stockers/shared';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';

/**
 * The big clock of the sign-in and lock screens: "9:42" on one line and "PM, Saturday 3 October" under it.
 * In Urdu the second line is "رات، ہفتہ 3 اکتوبر", as on screen 6. It has its own `useNow`, so only this block
 * redraws each second. The line is a `<bdi>`, so its words keep together inside right-to-left text.
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
  const { lang, parts, day } = useFormat();
  const iso = toClubIso(now);
  const { time, period } = parts(iso);
  const size = LOOK[look];
  return (
    <div data-testid="big-clock" className={cx('flex flex-col', size.box, className)}>
      <span dir="ltr" className={cx('font-num tabular-nums', size.numerals)}>
        {time}
      </span>
      <span className={size.date}>
        <bdi>
          {period}
          {lang === 'ur' ? '،' : ','} {day(iso, true)}
        </bdi>
      </span>
    </div>
  );
}
