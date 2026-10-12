import { cx } from '@/ui/cx';
import { isSetUp, ringClass, STATUS_LOOK } from './status';
import { TileContent } from './TileContent';
import { TileFrame } from './TileFrame';
import { useTile } from './tile-context';
import type { TileProps } from './types';

/** A game controller, faint in the corner of a TV that is switched off. */
function Controller() {
  return (
    <svg className="tile-pad" width="54" height="36" viewBox="0 0 54 36" aria-hidden="true">
      <path
        d="M14 4h26c6 0 9 4 11 11l2 11c1 6-4 9-8 5l-6-6H15l-6 6c-4 4-9 1-8-5l2-11C5 8 8 4 14 4Z"
        style={{ fill: 'var(--tv-pad)' }}
      />
      <g style={{ fill: 'var(--tv-screen-2)' }}>
        <circle cx="15" cy="15" r="3.4" />
        <circle cx="39" cy="12" r="2" />
        <circle cx="43" cy="16" r="2" />
        <circle cx="35" cy="16" r="2" />
        <circle cx="39" cy="20" r="2" />
      </g>
    </svg>
  );
}

function Surface() {
  const { props } = useTile();
  const { status } = props;
  // The screen is dark when nobody is playing: free, out of order, or locked.
  const off = isSetUp(status) || STATUS_LOOK[status].covered || STATUS_LOOK[status].locked;
  return (
    <span className="tile-tvw">
      <span className={cx('tile-surface tile-tv', off && 'tile-tv-off', ringClass(status))}>
        <span className="tile-scr">
          {isSetUp(status) ? <Controller /> : null}
          <TileContent />
        </span>
      </span>
      <span className="tile-neck" />
      <span className="tile-foot" />
    </span>
  );
}

/** A TV on a stand: the details sit on the screen, which is dark when nobody is playing (screen 5). */
export function PlayStationTile(props: TileProps) {
  return (
    <TileFrame kind="playstation" {...props}>
      <Surface />
    </TileFrame>
  );
}
