import type { CSSProperties } from 'react';
import { cx } from '@/ui/cx';
import { carromSetup } from './layout';
import { clothClass, isSetUp, ringClass } from './status';
import { TileContent } from './TileContent';
import { TileFrame } from './TileFrame';
import { useTile } from './tile-context';
import type { TileProps } from './types';

const COIN_COLOUR = {
  white: 'var(--coin-white)',
  black: 'var(--coin-black)',
} as const;

/** The lines of the board: baselines with red ends, the centre circle and the corner arrows. */
function BoardLines() {
  return (
    <svg className="tile-ln" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" style={{ stroke: 'var(--carrom-line)' }} strokeWidth=".5" opacity=".5">
        <line x1="20" y1="9" x2="80" y2="9" />
        <line x1="20" y1="12.5" x2="80" y2="12.5" />
        <line x1="20" y1="91" x2="80" y2="91" />
        <line x1="20" y1="87.5" x2="80" y2="87.5" />
        <line x1="9" y1="20" x2="9" y2="80" />
        <line x1="12.5" y1="20" x2="12.5" y2="80" />
        <line x1="91" y1="20" x2="91" y2="80" />
        <line x1="87.5" y1="20" x2="87.5" y2="80" />
        <circle cx="50" cy="50" r="13" />
        <circle cx="50" cy="50" r="2.4" />
        <path d="M12 12 L24 24 M88 12 L76 24 M12 88 L24 76 M88 88 L76 76" />
      </g>
      <g style={{ fill: 'var(--carrom-red)' }} opacity=".65">
        <circle cx="20" cy="10.75" r="1.75" />
        <circle cx="80" cy="10.75" r="1.75" />
        <circle cx="20" cy="89.25" r="1.75" />
        <circle cx="80" cy="89.25" r="1.75" />
        <circle cx="10.75" cy="20" r="1.75" />
        <circle cx="10.75" cy="80" r="1.75" />
        <circle cx="89.25" cy="20" r="1.75" />
        <circle cx="89.25" cy="80" r="1.75" />
        <circle cx="50" cy="50" r="1.6" />
      </g>
    </svg>
  );
}

function Surface() {
  const { props } = useTile();
  return (
    <span
      className={cx('tile-surface tile-crm', clothClass(props.status), ringClass(props.status))}
    >
      <span className="tile-cb">
        <BoardLines />
        {isSetUp(props.status)
          ? carromSetup().map((coin, index) => (
              <span
                key={index}
                className={cx('tile-cn', coin.kind === 'queen' && 'tile-cn-queen')}
                style={
                  {
                    left: coin.left,
                    top: coin.top,
                    ...(coin.kind === 'queen' ? {} : { '--coin': COIN_COLOUR[coin.kind] }),
                  } as CSSProperties
                }
              />
            ))
          : null}
        <span className="tile-cpk" style={{ top: 4, left: 4 }} />
        <span className="tile-cpk" style={{ top: 4, right: 4 }} />
        <span className="tile-cpk" style={{ bottom: 4, left: 4 }} />
        <span className="tile-cpk" style={{ bottom: 4, right: 4 }} />
        <TileContent />
      </span>
    </span>
  );
}

/** A carrom board: a square with a wood frame, four pockets and the coins in the centre (screen 5). */
export function CarromTile(props: TileProps) {
  return (
    <TileFrame kind="carrom" {...props}>
      <Surface />
    </TileFrame>
  );
}
