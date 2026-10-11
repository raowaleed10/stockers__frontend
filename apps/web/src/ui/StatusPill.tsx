import type { TableStatus } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { cx } from './cx';

export interface StatusPillProps {
  status: TableStatus;
  /** Replaces the default words, for example a text that is already translated. */
  label?: string;
  /** `dark` sits on a table or the counter; `light` sits on the owner's light pages. */
  tone?: 'dark' | 'light';
  className?: string;
}

const DOT: Record<TableStatus, string> = {
  free: 'bg-s-free',
  playing: 'bg-s-play',
  over30: 'bg-s-play',
  paused: 'bg-s-pause',
  outOfOrder: 'bg-s-ooo',
  noPrice: 'bg-s-noprice',
};

// On a light page the pill is white with a 2 px border in the status colour (docs/04 §5). The text is the
// status colour too, except green and yellow: --sl-free and --sl-pause are under 4.5:1 on white, so those
// two use the darker green and amber ink (axe, color-contrast).
const LIGHT: Record<TableStatus, string> = {
  free: 'border-sl-free text-o-green-ink',
  playing: 'border-sl-play text-sl-play',
  over30: 'border-sl-play text-sl-play',
  paused: 'border-sl-pause text-o-amber-ink',
  outOfOrder: 'border-sl-ooo text-sl-ooo',
  noPrice: 'border-o-amber-line text-o-amber-ink',
};

/**
 * The status of a table: a marker plus words, so colour is never the only signal (golden rule 11).
 * Over 30 minutes shows a small red card instead of a round dot.
 */
export function StatusPill({ status, label, tone = 'dark', className }: StatusPillProps) {
  const { t } = useTranslation();
  const text = label ?? t(`status.${status}`);
  const marker =
    status === 'over30' ? (
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
        'inline-flex items-center gap-[7px] whitespace-nowrap rounded-full py-[5px] ps-[7px] pe-[11px] text-[14px] font-semibold',
        tone === 'dark' ? 'bg-s-pill-bg text-c-text' : cx('border-2 bg-o-card', LIGHT[status]),
        className,
      )}
    >
      {marker}
      {text}
    </span>
  );
}
