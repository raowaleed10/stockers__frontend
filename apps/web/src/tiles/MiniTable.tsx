import { cx } from '@/ui/cx';
import { STATUS_LOOK } from './status';
import type { TileStatus } from './types';
import './tiles.css';

export interface MiniTableProps {
  /** "1", "R1" */
  number: string;
  status: TileStatus;
  /** A room has a sofa and a smaller number. */
  room?: boolean;
  className?: string;
}

/**
 * The small table (58 × 36) at the start of a row in the owner's phone list (screen 54). Decoration only:
 * the row names the table and its status in words.
 */
export function MiniTable({ number, status, room = false, className }: MiniTableProps) {
  const look = STATUS_LOOK[status];
  const cloth = look.covered
    ? 'cover'
    : look.cloth === 'lit'
      ? 'lit'
      : look.cloth === 'dim'
        ? 'dim'
        : 'free';
  return (
    <span aria-hidden="true" className={cx('tile-mini', room && 'tile-mini-room', className)}>
      <span className={cx('tile-mini-cloth', `tile-mini-${cloth}`)}>{number}</span>
      {/* physical positions: a table is not mirrored in Urdu */}
      <span className="tile-mini-pk" style={{ top: 1, left: 1 }} />
      <span className="tile-mini-pk" style={{ top: 1, right: 1 }} />
      <span className="tile-mini-pk" style={{ bottom: 1, left: 1 }} />
      <span className="tile-mini-pk" style={{ bottom: 1, right: 1 }} />
      <span className="tile-mini-pk" style={{ top: 0, left: 'calc(50% - 3.5px)' }} />
      <span className="tile-mini-pk" style={{ bottom: 0, left: 'calc(50% - 3.5px)' }} />
      {room ? <span className="tile-mini-sofa" /> : null}
    </span>
  );
}
