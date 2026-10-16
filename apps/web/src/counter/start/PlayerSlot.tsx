import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/ui/cx';
import { IconButton } from '@/ui/IconButton';
import type { PickedPlayer } from './draft';

export interface PlayerSlotProps {
  /** Who is in the slot; nothing for an empty one. */
  player?: PickedPlayer;
  /** The small line above the name in a slot of screen 8 ("Player 1"). Screen 9 draws none. */
  label?: ReactNode;
  /** An empty slot that the next tap fills: a brass dashed border. The others are grey. */
  active?: boolean;
  /** What an empty slot says. */
  empty: ReactNode;
  /** Screen 9: a shorter slot with a smaller name and no label. */
  compact?: boolean;
  onRemove?: () => void;
  className?: string;
}

/**
 * One place for a player in "Start a game" (screens 8 and 9): green with his name, his masked number and a ✕ to take
 * him out, or an empty dashed box. The ✕ is drawn 48 px inside a 56 px box (docs/04 §4).
 */
export function PlayerSlot({
  player,
  label,
  active = false,
  empty,
  compact = false,
  onRemove,
  className,
}: PlayerSlotProps) {
  const { t } = useTranslation('start');
  if (!player) {
    return (
      <div
        className={cx(
          'flex flex-col justify-center rounded-[16px] border-2 border-dashed bg-c-page px-4 py-3',
          compact ? 'min-h-[72px]' : 'min-h-[80px]',
          active ? 'border-c-brass' : 'border-c-line-3',
          className,
        )}
      >
        {label ? (
          <span
            className={cx('text-[14px] font-semibold', active ? 'text-c-brass' : 'text-c-text-2')}
          >
            {label}
          </span>
        ) : null}
        <span className="text-[19px] text-c-text-2">{empty}</span>
      </div>
    );
  }
  return (
    <div
      data-testid="slot-filled"
      className={cx(
        'flex items-center justify-between gap-2.5 rounded-[16px] border-2 border-c-ok-line bg-c-ok-bg px-4',
        compact ? 'min-h-[72px] py-2' : 'min-h-[80px] py-3',
        className,
      )}
    >
      <span className="flex min-w-0 flex-col">
        {label ? <span className="text-[14px] font-semibold text-c-ok-ink">{label}</span> : null}
        <span className={cx('font-bold', compact ? 'text-[20px]' : 'text-[21px]')}>
          <bdi>{player.name}</bdi>
        </span>
        {player.phone ? (
          <span dir="ltr" className="text-start text-[15px] text-c-text-2">
            {player.phone}
          </span>
        ) : null}
      </span>
      {onRemove ? (
        <IconButton
          theme="counter"
          variant="ghost"
          drawn={48}
          label={t('players.remove', { name: player.name })}
          icon={<X size={20} strokeWidth={2.2} />}
          onClick={onRemove}
        />
      ) : null}
    </div>
  );
}
