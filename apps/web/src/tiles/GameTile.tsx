import type { TableKind } from '@stockers/shared';
import type { ReactElement } from 'react';
import { CarromTile } from './CarromTile';
import { FoosballTile } from './FoosballTile';
import { LudoTile } from './LudoTile';
import { PlayStationTile } from './PlayStationTile';
import { PoolTile } from './PoolTile';
import { RoomTile } from './RoomTile';
import { SnookerTile } from './SnookerTile';
import type { TileProps } from './types';

const TILE: Record<TableKind, (props: TileProps) => ReactElement> = {
  snooker: SnookerTile,
  room: RoomTile,
  pool: PoolTile,
  carrom: CarromTile,
  foosball: FoosballTile,
  ludo: LudoTile,
  playstation: PlayStationTile,
};

export interface GameTileProps extends TileProps {
  /** The kind of table (`Table.kind`): it decides which drawing is used. */
  kind: TableKind;
}

/** Picks the right tile for a table from its kind. */
export function GameTile({ kind, ...props }: GameTileProps) {
  const Tile = TILE[kind];
  return <Tile {...props} />;
}
