import type { CSSProperties } from 'react';
import { cx } from '@/ui/cx';
import type { BallSpot, Diamond } from './layout';

/** The six pockets of a snooker or pool table: four corners and the middle of each long side. */
export function Pockets() {
  return (
    <>
      <span className="tile-pk tile-pk-a" />
      <span className="tile-pk tile-pk-b" />
      <span className="tile-pk tile-pk-c" />
      <span className="tile-pk tile-pk-d" />
      <span className="tile-pk tile-pk-e" />
      <span className="tile-pk tile-pk-f" />
    </>
  );
}

/** Balls set up on a free table. The colour is a token passed as the custom property `--ball`. */
export function Balls({ spots }: { spots: BallSpot[] }) {
  return (
    <>
      {spots.map((spot, index) => (
        <span
          key={index}
          className={cx('tile-ball', spot.stripe && 'tile-ball-stripe')}
          style={{ left: spot.left, top: spot.top, '--ball': spot.colour } as CSSProperties}
        />
      ))}
    </>
  );
}

/** The six diamond sights on each long rail and three on each short rail of a pool table. */
export function Diamonds({ spots }: { spots: Diamond[] }) {
  return (
    <>
      {spots.map((spot, index) => (
        <span key={index} className="tile-dm" style={spot} />
      ))}
    </>
  );
}
