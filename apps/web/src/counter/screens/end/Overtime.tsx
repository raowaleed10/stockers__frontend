import {
  elapsed,
  gameLimit,
  MINUTE_MS,
  overtimeOptions,
  type EndGameRequest,
} from '@stockers/shared';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { MoneyText } from '@/ui/MoneyText';
import { OptionCard } from '@/ui/OptionCard';
import { useEndGame } from '../../api';
import { boardOfTableScreen, tablePath } from '../../components/table-paths';
import { useEndDraft } from '../../end/draft';
import { useKeptGame } from '../../end/use-kept-game';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';
import { firstName } from '../table/game-info';

/**
 * Screen 19, `/table/:id/end/overtime`: "This frame took 36 minutes. Charge double?". It comes after the loser is chosen
 * (17) or the side and split (20) and before anything is charged, for a game past its own time limit (Q2, D56). Normal
 * price or double price; the worker always chooses. A double charge is written in Activity. For a double frame the
 * total is the whole double price, and a custom split is doubled with it, so it still adds up.
 */
export function Overtime() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <OvertimeStep {...context} />}</TableGate>;
}

function OvertimeStep({ table, board }: TableContext) {
  const { t } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const now = useNow(1000);
  const end = useEndGame();
  const draft = useEndDraft();
  const game = useKeptGame(table);

  if (!game) return <Navigate to={boardOfTableScreen(pathname)} replace />;
  // Nobody has been chosen (the page was reloaded): ask who lost first.
  if (!end.isSuccess && (draft.gameId !== game.id || draft.loserIds.length === 0)) {
    return <Navigate to={tablePath(pathname, table.id, '/end')} replace />;
  }

  const nameOf = (id: string) => board.players[id]?.name ?? id;
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const everyone = [...(game.playerIds ?? []), ...(game.sides?.flat() ?? [])];
  const isDouble = game.type === 'double';
  const losers = isDouble
    ? (game.sides?.find((side) => side.some((id) => draft.loserIds.includes(id))) ?? draft.loserIds)
    : draft.loserIds;
  const winners = everyone.filter((id) => !losers.includes(id));
  const names = (ids: string[]) => ids.map(nameOf).join(t('and'));
  const minutes = Math.round(
    elapsed(game.startedAt, now, game.pausedMs, game.pausedAt) / MINUTE_MS,
  );
  const limit = gameLimit(game) ?? 30;
  const options = overtimeOptions(game.price);

  const charge = (chargeDouble: boolean) => {
    // A custom split adds up to the normal total; the double total is twice that, so every share doubles too.
    const split = draft.split
      ? Object.fromEntries(
          Object.entries(draft.split).map(([id, amount]) => [
            id,
            chargeDouble ? amount * 2 : amount,
          ]),
        )
      : undefined;
    const request: EndGameRequest = {
      loserIds: draft.loserIds,
      ...(split ? { split } : {}),
      ...(chargeDouble ? { chargeDouble: true } : {}),
    };
    end.mutate(
      { id: game.id, request },
      {
        onSuccess: () => {
          if (game.type === 'single') {
            navigate(tablePath(pathname, table.id, '/next'), { state: { gameId: game.id } });
          } else {
            close();
          }
          draft.reset();
        },
      },
    );
  };

  return (
    <CounterDialog
      width={1068}
      tone="warning"
      titleSize="lg"
      icon={<Clock size={32} strokeWidth={2.4} />}
      showClose={false}
      kicker={t('over.kicker', { name, limit })}
      title={game.type === 'game' ? t('over.titleGame', { minutes }) : t('over.title', { minutes })}
      subtitle={
        isDouble
          ? t('over.subtitleSide', { losers: names(losers), winners: names(winners) })
          : t('over.subtitle', {
              loser: nameOf(losers[0] ?? ''),
              winner: names(winners),
              first: firstName(nameOf(losers[0] ?? '')),
            })
      }
      onClose={() => navigate(tablePath(pathname, table.id, '/end'))}
      actions={
        <>
          <span className="min-w-0 flex-[1_1_360px] text-[16px] text-c-text-2">
            {t('over.note', { limit })}
          </span>
          <Button
            theme="counter"
            size="counter-main"
            className="min-h-[60px] px-6 text-[18px]"
            onClick={() => navigate(tablePath(pathname, table.id, '/end'))}
          >
            {t('over.back')}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-4">
        <OptionCard
          layout="price"
          className="flex-[1_1_340px]"
          title={t('over.normal')}
          value={<MoneyText value={options.normal} />}
          disabled={end.isPending}
          onClick={() => charge(false)}
        />
        <OptionCard
          layout="price"
          tone="danger"
          className="flex-[1_1_340px]"
          title={t('over.double')}
          value={<MoneyText value={options.double} />}
          disabled={end.isPending}
          onClick={() => charge(true)}
        />
      </div>
      {end.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {end.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
