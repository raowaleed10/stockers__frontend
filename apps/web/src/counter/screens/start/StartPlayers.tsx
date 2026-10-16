import {
  formatRs,
  type ChangeTypeRequest,
  type GameType,
  type StartGameRequest,
} from '@stockers/shared';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { PersonCard } from '@/ui/PersonCard';
import { useChangeGameType, useRecentPlayers, useStartGame } from '../../api';
import { boardOfTableScreen, newPlayerPath, tablePath } from '../../components/table-paths';
import { slotCount, useStartDraft, pickedIds } from '../../start/draft';
import { PlayerSearch } from '../../start/PlayerSearch';
import { toPicked } from '../../start/player-parts';
import { PlayerSlot } from '../../start/PlayerSlot';
import { FALLBACK_RATE } from './StartType';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from './TableGate';

type Mode = 'start' | 'change';

/**
 * Screen 8, `/table/:id/start/players`: "Who is playing on Table 2?". Two slots (one for a Century), a search by name or
 * phone, "Played here recently", and "Start game". Pool, foosball, carrom, ludo and PlayStation come here directly
 * (no type step). In `change` mode (`/table/:id/change-type/players`) it asks the same question for a game that
 * changes type in its first 5 minutes, with the players it has now already in the slots.
 */
export function StartPlayers({ mode = 'start' }: { mode?: Mode }) {
  const { id } = useParams<{ id: string }>();
  return (
    <TableGate tableId={id}>{(context) => <PlayersStep mode={mode} {...context} />}</TableGate>
  );
}

function PlayersStep({ table, category, mode }: TableContext & { mode: Mode }) {
  const { t } = useTranslation('start');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const draft = useStartDraft();
  const start = useStartGame();
  const change = useChangeGameType();
  const recent = useRecentPlayers();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (mode === 'start') draft.begin(table.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.id, mode]);

  const picked = pickedIds(draft);
  const pickedKey = picked.join(',');
  const recents = useMemo(
    () =>
      (recent.data ?? []).filter((player) => !pickedKey.split(',').includes(player.id)).slice(0, 8),
    [recent.data, pickedKey],
  );

  const isGame = table.kind !== 'snooker';
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const base = mode === 'change' ? '/change-type' : '/start';

  // Nothing to ask on these: the table is in use, cannot be started, or is a double (its own screen).
  const finished = start.isSuccess || change.isSuccess;
  if (!finished && mode === 'start' && table.game) {
    return <Navigate to={tablePath(pathname, table.id)} replace />;
  }
  if (!finished && mode === 'change' && !table.game) {
    return <Navigate to={boardOfTableScreen(pathname)} replace />;
  }
  if (!finished && mode === 'start' && (table.outOfOrder || table.price === null)) {
    return <Navigate to={tablePath(pathname, table.id, '/start')} replace />;
  }
  if (!isGame && draft.kind === 'double') {
    return <Navigate to={tablePath(pathname, table.id, `${base}/double`)} replace />;
  }

  const type: GameType = isGame ? 'game' : draft.kind === 'century' ? 'century' : 'single';
  const slots = slotCount(type === 'century' ? 'century' : 'single');
  const price = table.price ?? 0;
  const ownersRate = category?.centuryRate ?? FALLBACK_RATE;
  const rate = draft.rate ?? ownersRate;
  const full = draft.players.length >= slots;

  const subtitle =
    type === 'century'
      ? t('players.century', { price: formatRs(rate, lang) })
      : type === 'game'
        ? t('players.game', { price: formatRs(price, lang) })
        : t('players.single', { price: formatRs(price, lang) });

  const pending = start.isPending || change.isPending;
  const error = start.error ?? change.error;

  const done = () => {
    draft.reset();
    navigate(boardOfTableScreen(pathname));
  };

  const submit = () => {
    const [first, second] = draft.players;
    if (!first || (type !== 'century' && !second)) return;
    const request: ChangeTypeRequest =
      type === 'century'
        ? { type, underPlayerId: first.id, ...(rate !== ownersRate ? { price: rate } : {}) }
        : { type, playerIds: [first.id, second.id] };
    if (mode === 'change' && table.game) {
      change.mutate({ id: table.game.id, request }, { onSuccess: done });
    } else {
      const body: StartGameRequest = { tableId: table.id, ...request };
      start.mutate(body, { onSuccess: done });
    }
  };

  const typeWord = t(`types.${type === 'century' ? 'century' : 'single'}.title`);

  return (
    <CounterDialog
      size="lg"
      title={t('players.title', { name })}
      subtitle={subtitle}
      onClose={close}
      back={
        isGame && mode === 'start'
          ? undefined
          : {
              label: t('backToType'),
              onBack: () =>
                navigate(
                  tablePath(pathname, table.id, mode === 'change' ? '/change-type' : '/start'),
                ),
            }
      }
      aside={isGame && mode === 'start' ? undefined : t('step', { n: 2, total: 2 })}
      actions={
        <>
          {mode === 'start' ? (
            <span className="text-[16px] text-c-text-2">{t('players.startTime')}</span>
          ) : null}
          <div className="flex-1" />
          <Button theme="counter" size="counter-main" onClick={close}>
            {t('cancel')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="px-10"
            disabled={!full || pending}
            onClick={submit}
          >
            {mode === 'change' ? t('change.to', { type: typeWord }) : t('players.start')}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-[22px]">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-3.5">
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: slots }, (_, index) => {
              const player = draft.players[index];
              return (
                <PlayerSlot
                  key={index}
                  className="flex-[1_1_240px]"
                  player={player}
                  label={t('players.player', { n: index + 1 })}
                  active={index === draft.players.length}
                  empty={t('players.emptySlot')}
                  onRemove={player ? () => draft.remove(player.id) : undefined}
                />
              );
            })}
          </div>
          <PlayerSearch
            label={t('players.search')}
            query={query}
            onQuery={setQuery}
            exclude={picked}
            onPick={(player) => {
              draft.pick(player);
              setQuery('');
            }}
            onAddNew={(typed) => {
              draft.setReturnTo(pathname);
              navigate(newPlayerPath(pathname, table.id), { state: { name: typed } });
            }}
          />
        </div>

        <section
          aria-labelledby="recent-title"
          className="flex min-w-0 flex-[2_1_320px] flex-col gap-3 rounded-[18px] border border-c-line bg-c-raised p-[18px]"
        >
          <h3 id="recent-title" className="m-0 text-[19px] font-bold">
            {t('players.recent')}
          </h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
            {recents.map((player) => (
              <li key={player.id} className="flex">
                <PersonCard
                  variant="tile"
                  className="w-full"
                  name={player.name}
                  phoneTail={player.phoneTail ?? ''}
                  onClick={() => draft.pick(toPicked(player))}
                />
              </li>
            ))}
          </ul>
          <p className="m-0 text-[15px] leading-[1.4] text-c-text-2">{t('players.recentNote')}</p>
        </section>
      </div>
      {error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
