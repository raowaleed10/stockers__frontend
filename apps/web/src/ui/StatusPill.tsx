import type { TableStatus } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { cx } from './cx';

export interface StatusPillProps {
  status: TableStatus;
  /** Replaces the default words, for example a text that is already translated. */
  label?: string;
  /** The time limit of the game in minutes: "Over 30 min". Without it the pill says "Over the limit". */
  limit?: number;
  /** `dark` sits on a table or the counter; `light` sits on the owner's light pages. */
  tone?: 'dark' | 'light';
  className?: string;
}

const DOT: Record<TableStatus, string> = {
  free: 'bg-s-free',
  playing: 'bg-s-play',
  overLimit: 'bg-s-play',
  paused: 'bg-s-pause',
  outOfOrder: 'bg-s-ooo',
  noPrice: 'bg-s-noprice',
};

// On a light page the pill is the words on a tinted fill, with no border and no dot (screen 54). The text is
// the status colour, darkened for green, yellow and grey until it reaches 4.5:1 on its own fill
// (StatusPill.contrast.test.ts checks every pair).
const LIGHT: Record<TableStatus, string> = {
  free: 'bg-o-green-tint text-sl-free-ink',
  playing: 'bg-o-red-tint text-sl-play',
  overLimit: 'bg-o-red-tint text-sl-play',
  paused: 'bg-o-amber-tint text-sl-pause-ink',
  outOfOrder: 'bg-o-grey-tint text-sl-ooo-ink',
  noPrice: 'bg-o-amber-tint text-o-amber-ink',
};

/**
 * The status of a table, always in words so colour is never the only signal (golden rule 11). The dark pill
 * adds a marker: a round dot, or a small red card for over the time limit. The light pill is words on a tint.
 */
export function StatusPill({ status, label, limit, tone = 'dark', className }: StatusPillProps) {
  const { t } = useTranslation();
  const text =
    label ??
    (status === 'overLimit' && limit !== undefined
      ? t('status.overMinutes', { n: limit })
      : t(`status.${status}`));

  if (tone === 'light') {
    return (
      <span
        className={cx(
          'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[13px] font-bold',
          LIGHT[status],
          className,
        )}
      >
        {text}
      </span>
    );
  }

  const marker =
    status === 'overLimit' ? (
      <span
        aria-hidden="true"
        className="h-[14px] w-[10px] shrink-0 -rotate-12 rounded-[2px] bg-s-play shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
      />
    ) : (
      <span
        aria-hidden="true"
        className={cx('h-[13px] w-[13px] shrink-0 rounded-full shadow-dot', DOT[status])}
      />
    );
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[7px] whitespace-nowrap rounded-full bg-s-pill-bg py-[5px] ps-[7px] pe-[11px] text-[14px] font-semibold text-c-text',
        className,
      )}
    >
      {marker}
      {text}
    </span>
  );
}
