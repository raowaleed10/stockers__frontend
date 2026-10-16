import {
  canChangeType,
  changeTypeMinutesLeft,
  doublePrice,
  frameCharge,
  toClubIso,
  type Game,
} from '@stockers/shared';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { usePlayers } from '../../api';
import { RichText } from '../../components/RichText';
import { boardOfTableScreen, tablePath } from '../../components/table-paths';
import { useStartDraft, type PickedPlayer, type StartKind } from '../../start/draft';
import { TypeCards } from '../../start/TypeCards';
import { FALLBACK_RATE } from './StartType';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from './TableGate';

const MINUTE = 60_000;

const kindOf = (game: Game): StartKind =>
  game.type === 'double' ? 'double' : game.type === 'century' ? 'century' : 'single';

/** Everyone named on a running game, in the order they appear. */
const playerIdsOf = (game: Game): string[] => [
  ...(game.playerIds ?? []),
  ...(game.sides?.flat() ?? []),
  ...(game.underPlayerId ? [game.underPlayerId] : []),
];

/**
 * Screen 12, `/table/:id/change-type`: within the first 5 minutes the worker can change a frame into a double frame
 * or a Century (D17). The same three cards as screen 7, with "Now" on the type the game has, the Century rate, and
 * how long is left. Choosing a type goes on to the players (screens 8 and 9, with the game's own players already in
 * them), because who pays for a Century or who is on which side cannot be guessed (docs/NO_DESIGN.md).
 */
export function ChangeType() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <ChangeStep {...context} />}</TableGate>;
}

function ChangeStep({ table, category, board }: TableContext) {
  const { t } = useTranslation('start');
  const { t: tBoard } = useTranslation('board');
  const format = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const draft = useStartDraft();
  const everyone = usePlayers();
  const now = useNow(1000);
  const game = table.game;
  const ownersRate = category?.centuryRate ?? FALLBACK_RATE;
  const [selected, setSelected] = useState<StartKind | null>(null);
  const [rate, setRate] = useState<number | null>(null);

  if (!game) return <Navigate to={boardOfTableScreen(pathname)} replace />;
  // Pool, foosball and the others have one kind of game: there is nothing to change into.
  if (table.kind !== 'snooker') return <Navigate to={tablePath(pathname, table.id)} replace />;

  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const current = kindOf(game);
  const pick = selected ?? current;
  const century = rate ?? (current === 'century' ? game.price : ownersRate);
  const price = table.price ?? 0;

  if (!canChangeType(game.startedAt, now)) {
    return (
      <CounterDialog
        lead={table.number}
        title={t('change.title', { name })}
        subtitle={t('change.tooLate')}
        onClose={close}
        actions={
          <Button theme="counter" size="counter-main" onClick={close}>
            {t('cancel')}
          </Button>
        }
      />
    );
  }

  const nameOf = (id: string) => board.players[id]?.name ?? id;
  const who =
    game.type === 'double' && game.sides
      ? `${game.sides[0].map(nameOf).join(', ')} ${t('double.vs')} ${game.sides[1].map(nameOf).join(', ')}`
      : game.playerIds
        ? `${nameOf(game.playerIds[0])} ${t('double.vs')} ${nameOf(game.playerIds[1])}`
        : game.underPlayerId
          ? nameOf(game.underPlayerId)
          : '';
  const startedMs = Date.parse(game.startedAt);
  const minutesAgo = Math.floor((now - startedMs) / MINUTE);
  const until = format.clock(toClubIso(startedMs + 5 * MINUTE));
  const minutesLeft = changeTypeMinutesLeft(game.startedAt, now);

  const person = (id: string): PickedPlayer => {
    const saved = everyone.data?.find((p) => p.id === id);
    return {
      id,
      name: saved?.name ?? nameOf(id),
      ...(saved?.phone ? { phone: saved.phone } : {}),
      ...(saved?.phoneTail ? { phoneTail: saved.phoneTail } : {}),
    };
  };

  const next = () => {
    const ids = playerIdsOf(game);
    const players = pick === 'century' ? ids.slice(0, 1) : pick === 'single' ? ids.slice(0, 2) : [];
    const sides: [PickedPlayer[], PickedPlayer[]] =
      pick !== 'double'
        ? [[], []]
        : game.sides
          ? [game.sides[0].map(person), game.sides[1].map(person)]
          : [ids.slice(0, 1).map(person), ids.slice(1, 2).map(person)];
    draft.load({
      tableId: table.id,
      kind: pick,
      rate: pick === 'century' ? century : null,
      players: players.map(person),
      sides,
    });
    navigate(
      tablePath(
        pathname,
        table.id,
        pick === 'double' ? '/change-type/double' : '/change-type/players',
      ),
    );
  };

  return (
    <CounterDialog
      lead={table.number}
      title={t('change.title', { name })}
      subtitle={
        <RichText
          ns="start"
          i18nKey="change.subtitle"
          values={{
            ago: minutesAgo >= 1 ? t('change.ago', { count: minutesAgo }) : t('change.agoNow'),
            what: t(`change.as.${current}`),
            who,
            time: until,
          }}
        />
      }
      onClose={close}
      actions={
        <>
          <span className="flex items-center gap-2.5 text-[17px] text-c-brass">
            <Clock aria-hidden="true" size={22} strokeWidth={2.2} className="shrink-0" />
            {t('change.left', { count: minutesLeft })}
          </span>
          <div className="flex-1" />
          <Button theme="counter" size="counter-main" onClick={close}>
            {t('cancel')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            disabled={pick === current}
            onClick={next}
          >
            {t('change.to', { type: t(`types.${pick}.title`) })}
          </Button>
        </>
      }
    >
      <TypeCards
        prices={{ single: frameCharge(price), double: doublePrice(price), century }}
        centuryAllowed={category?.centuryAllowed ?? true}
        selected={pick}
        current={current}
        onSelect={setSelected}
        rate={century}
        onRate={setRate}
        rateNote={
          <RichText
            ns="start"
            i18nKey="rate.noteRunning"
            values={{ time: format.clock(game.startedAt) }}
          />
        }
      />
    </CounterDialog>
  );
}
