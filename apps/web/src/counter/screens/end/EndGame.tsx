import type { Game } from '@stockers/shared';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { boardOfTableScreen, roomPath } from '../../components/table-paths';
import { useKeptGame } from '../../end/use-kept-game';
import { TableGate, type TableContext } from '../start/TableGate';
import { EndCentury } from './EndCentury';
import { EndDouble } from './EndDouble';
import { WhoLost } from './WhoLost';

/** What every end screen gets: the table and the game that is ending. */
export interface EndScreenProps extends TableContext {
  game: Game;
}

/**
 * `/table/:id/end`, what "End frame" opens. The game decides the screen: a single frame or a game asks who lost (17),
 * a double asks which side lost and how it splits (20), a Century shows its minutes and the charge (21), and a room
 * has its own address (23). A table with no game goes back to the board.
 */
export function EndGame() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <EndRouter {...context} />}</TableGate>;
}

function EndRouter(context: TableContext) {
  const { pathname } = useLocation();
  const game = useKeptGame(context.table);
  if (!game) return <Navigate to={boardOfTableScreen(pathname)} replace />;
  if (game.type === 'room') {
    return <Navigate to={roomPath(pathname, context.table.id, '/end')} replace />;
  }
  const props = { ...context, game };
  if (game.type === 'double') return <EndDouble {...props} />;
  if (game.type === 'century') return <EndCentury {...props} />;
  return <WhoLost {...props} />;
}
