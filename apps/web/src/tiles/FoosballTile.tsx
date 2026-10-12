import type { CSSProperties } from 'react';
import { cx } from '@/ui/cx';
import { FOOSBALL_RODS, at } from './layout';
import { clothClass, ringClass } from './status';
import { TileContent } from './TileContent';
import { TileFrame } from './TileFrame';
import { useTile } from './tile-context';
import type { TileProps } from './types';

const TEAM = { red: 'var(--foos-red)', blue: 'var(--foos-blue)' } as const;

function Surface() {
  const { props } = useTile();
  return (
    <span className="tile-fsw">
      {/* the handles stick out above and below the cabinet; they are placed from the width of the table */}
      {FOOSBALL_RODS.map((rod) => (
        <span
          key={rod.x}
          className="tile-hd"
          style={{
            left: at(rod.x, rod.handle),
            ...(rod.handleAtTop ? { top: -1 } : { bottom: -1 }),
          }}
        />
      ))}
      <span
        className={cx('tile-surface tile-fsb', clothClass(props.status), ringClass(props.status))}
      >
        <span className="tile-goal tile-goal-l" />
        <span className="tile-goal tile-goal-r" />
        <span className="tile-ff">
          <span className="tile-ml" />
          <span className="tile-mc" />
          <span className="tile-gb tile-gb-l" />
          <span className="tile-gb tile-gb-r" />
          {FOOSBALL_RODS.map((rod) => (
            <span key={rod.x}>
              <span className="tile-rod" style={{ left: at(rod.x, -1.5) }} />
              {rod.men.map((position) => (
                <span
                  key={position}
                  className="tile-man"
                  style={
                    {
                      left: at(rod.x, -4.5),
                      top: at(position, -6),
                      '--man': TEAM[rod.team],
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          ))}
          <TileContent />
        </span>
      </span>
    </span>
  );
}

/** A foosball table: a black cabinet with handles, a striped pitch, goals, rods and men (screen 5). */
export function FoosballTile(props: TileProps) {
  return (
    <TileFrame kind="foosball" {...props}>
      <Surface />
    </TileFrame>
  );
}
