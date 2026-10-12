import { cx } from '@/ui/cx';
import { Pockets } from './parts';
import { Cloth } from './SnookerCloth';
import { clothClass, ringClass } from './status';
import { TileFrame } from './TileFrame';
import { useTile } from './tile-context';
import type { TileProps } from './types';

function Surface() {
  const { props } = useTile();
  return (
    <span
      className={cx('tile-surface tile-snk', clothClass(props.status), ringClass(props.status))}
    >
      <Pockets />
      <Cloth table="snooker" />
    </span>
  );
}

/** A snooker table seen from above: walnut rail, six pockets, baulk line and the D (screens 3, 6, 16). */
export function SnookerTile(props: TileProps) {
  return (
    <TileFrame kind="snooker" {...props}>
      <Surface />
    </TileFrame>
  );
}
