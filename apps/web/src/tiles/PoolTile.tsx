import { cx } from '@/ui/cx';
import { Pockets } from './parts';
import { Cloth, PoolDiamonds } from './SnookerCloth';
import { clothClass, ringClass } from './status';
import { TileFrame } from './TileFrame';
import { useTile } from './tile-context';
import type { TileProps } from './types';

function Surface() {
  const { props } = useTile();
  return (
    <span
      className={cx('tile-surface tile-pool', clothClass(props.status), ringClass(props.status))}
    >
      <Pockets />
      <PoolDiamonds />
      <Cloth table="pool" />
    </span>
  );
}

/** A pool table: dark rail, blue cloth, diamond sights and the head string (screens 4, 5). */
export function PoolTile(props: TileProps) {
  return (
    <TileFrame kind="pool" {...props}>
      <Surface />
    </TileFrame>
  );
}
