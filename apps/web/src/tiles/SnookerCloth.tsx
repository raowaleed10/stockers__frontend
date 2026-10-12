import { poolDiamonds, poolSetup, snookerSetup } from './layout';
import { Balls, Diamonds } from './parts';
import { isSetUp } from './status';
import { TileContent } from './TileContent';
import { useTile } from './tile-context';

/**
 * The cloth of a snooker table, a room's table or a pool table: the lines, the balls on a free table, the
 * grey stripes of a table that is out of order, and the words on top.
 */
export function Cloth({ table }: { table: 'snooker' | 'room' | 'pool' }) {
  const { props, look } = useTile();
  const setUp = isSetUp(props.status);

  return (
    <span className="tile-cl">
      {table === 'pool' ? <span className="tile-hs" /> : null}
      {table !== 'pool' ? (
        <>
          <span className="tile-bk" />
          <span className="tile-dd" />
        </>
      ) : null}
      {setUp ? <Balls spots={table === 'pool' ? poolSetup() : snookerSetup(table)} /> : null}
      {look.covered ? <span className="tile-cover" /> : null}
      <TileContent />
    </span>
  );
}

/** The diamond sights along the rails of a pool table. */
export function PoolDiamonds() {
  return <Diamonds spots={poolDiamonds()} />;
}
