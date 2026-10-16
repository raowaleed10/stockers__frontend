import { DEFAULT_MAX_MINUTES, elapsed, formatTimer, isOverLimit } from '@stockers/shared';
import { useNow } from '@/lib/clock';
import { cx } from './cx';

export interface TimerTextProps {
  /** When the game started, as an ISO date-time. */
  startedAt: string;
  /** Total time already spent paused. It is not counted. */
  pausedMs?: number;
  /** Set while the game is paused: the timer stays at this moment. */
  pausedAt?: string;
  /** Set when the game has ended: the timer stops there. */
  endedAt?: string;
  /**
   * `plain` is ordinary text. `redCard` is the solid red card. `auto` (default) switches to the
   * red card at 30:00 (decision Q2).
   */
  variant?: 'plain' | 'redCard' | 'auto';
  /** The game's time limit in minutes, for `auto`. A game that has none uses `plain`. Default 30. */
  limitMinutes?: number;
  /** `tile` is the 40 px timer on a table; `inherit` takes the size from the page. */
  size?: 'tile' | 'inherit';
  className?: string;
}

/** A ticking timer. Only this text re-renders each second, not the board around it. */
export function TimerText({
  startedAt,
  pausedMs = 0,
  pausedAt,
  endedAt,
  variant = 'auto',
  limitMinutes = DEFAULT_MAX_MINUTES,
  size = 'tile',
  className,
}: TimerTextProps) {
  const frozen = pausedAt !== undefined || endedAt !== undefined;
  // A frozen timer does not need a tick every second.
  const now = useNow(frozen ? 60_000 : 1000);
  const measuredTo = endedAt === undefined ? now : Date.parse(endedAt);
  const ms = elapsed(startedAt, measuredTo, pausedMs, endedAt === undefined ? pausedAt : undefined);
  const redCard = variant === 'redCard' || (variant === 'auto' && isOverLimit(ms, limitMinutes));

  return (
    <span
      role="timer"
      className={cx(
        'font-num font-semibold tabular-nums',
        size === 'tile' && 'text-tile-timer',
        redCard
          ? 'inline-block rounded-[7px] bg-s-card px-2.5 pb-1 pt-[3px] text-white shadow-redcard'
          : 'leading-none',
        className,
      )}
    >
      {formatTimer(ms)}
    </span>
  );
}
