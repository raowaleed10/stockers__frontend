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
    <span className={cx('tile-surface tile-room', ringClass(props.status))}>
      <span className={cx('tile-surface tile-snk', clothClass(props.status))}>
        <Pockets />
        <Cloth table="room" />
      </span>
      {/* a flex item, so in Urdu the sofa moves to the other side (screen 6) */}
      <span className="tile-sofa" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

/** A room: a snooker table inside four walls, with a sofa along one side (screens 3, 6, 16). */
export function RoomTile(props: TileProps) {
  return (
    <TileFrame kind="room" {...props}>
      <Surface />
    </TileFrame>
  );
}
