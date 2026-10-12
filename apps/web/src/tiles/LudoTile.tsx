import { cx } from '@/ui/cx';
import { LudoBoard } from './LudoBoard';
import { clothClass, ringClass } from './status';
import { TileContent } from './TileContent';
import { TileFrame } from './TileFrame';
import { useTile } from './tile-context';
import type { TileProps } from './types';

function Surface() {
  const { props } = useTile();
  return (
    <span
      className={cx('tile-surface tile-ldw', clothClass(props.status), ringClass(props.status))}
    >
      <span className="tile-ldb">
        <LudoBoard />
      </span>
      <TileContent />
    </span>
  );
}

/** A ludo board on a wooden tabletop, with the details beside it (screen 5). */
export function LudoTile(props: TileProps) {
  return (
    <TileFrame kind="ludo" {...props}>
      <Surface />
    </TileFrame>
  );
}
