import { formatRs, rankPlayerResults, type BoardTable, type Game } from '@stockers/shared';
import { Check, Search } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { cx } from '@/ui/cx';
import { focusWithinRing, focusRing } from '@/ui/theme';
import { useDialog } from '@/ui/use-dialog';
import { useMoveGame, usePlayers, useRecentPlayers, useReplacePlayer } from '../../api';
import { RichText } from '../../components/RichText';
import { boardOfTableScreen } from '../../components/table-paths';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';
import { firstName, gamePlayerIds, minutesSoFar, whoIsPlaying } from './game-info';

const PANEL =
  'flex min-w-0 flex-[1_1_520px] max-w-[640px] flex-col rounded-dialog border border-c-line-2 bg-c-panel px-7 py-[26px] shadow-dialog-dark [--btn-secondary-bg:var(--c-raised)]';

/** The two buttons at the bottom of a panel: Cancel one share, the main one two (screen 13). */
function PanelActions({
  cancel,
  confirm,
  disabled,
  onCancel,
  onConfirm,
}: {
  cancel: string;
  confirm: ReactNode;
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-auto flex gap-3 pt-0.5">
      <Button theme="counter" size="counter-main" className="flex-1" onClick={onCancel}>
        {cancel}
      </Button>
      <Button
        theme="counter"
        variant="primary"
        size="counter-main"
        className="flex-[2]"
        disabled={disabled}
        onClick={onConfirm}
      >
        {confirm}
      </Button>
    </div>
  );
}

/**
 * Screen 13, `/table/:id/move`: the two things you can do to a running game besides ending it, side by side. Move it
 * to a free table of the same kind (a table that is out of order is there but cannot be picked), or replace a player
 * (earlier frames stay with the old one). The panels sit under the top bar, not in the middle of the page.
 */
export function MoveTable() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <MoveStep {...context} />}</TableGate>;
}

function MoveStep({ table, board }: TableContext) {
  const { t } = useTranslation('table');
  const close = useCloseTable();
  const { pathname } = useLocation();
  const ref = useDialog<HTMLDivElement>(close, true);
  const game = table.game;
  if (!game) return <Navigate to={boardOfTableScreen(pathname)} replace />;
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-c-scrim pt-[70px] [body[data-undo-toast]_&]:pb-[var(--undo-room,110px)]">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t('panel.move')}
        tabIndex={-1}
        className="screen-text flex min-h-full flex-wrap items-start justify-center gap-7 px-6 py-8 font-body text-c-text outline-none"
      >
        <MovePanel table={table} game={game} board={board} onClose={close} />
        <ReplacePanel table={table} game={game} board={board} onClose={close} />
      </div>
    </div>,
    document.body,
  );
}

type PanelProps = {
  table: BoardTable;
  game: Game;
  board: TableContext['board'];
  onClose: () => void;
};

function MovePanel({ table, game, board, onClose }: PanelProps) {
  const { t } = useTranslation('table');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const now = useNow(1000);
  const move = useMoveGame();
  const headingId = useId();
  const nameOf = (playerId: string) => board.players[playerId]?.name ?? playerId;

  // Tables of the same kind with no game: free ones can be picked, an out-of-order one is shown but cannot.
  const targets = board.tables.filter(
    (other) => other.id !== table.id && other.kind === table.kind && !other.game,
  );
  const firstFree = targets.find((other) => !other.outOfOrder && other.price !== null);
  const [picked, setPicked] = useState<string | null>(null);
  const chosen = targets.find((other) => other.id === (picked ?? firstFree?.id));

  const label = (other: BoardTable) =>
    tBoard(`nameOf.${other.kind}`, { number: other.number.replace(/^R/i, '') });
  const priceWords = (other: BoardTable) => {
    const price = other.price ?? 0;
    const text =
      other.kind === 'snooker'
        ? tBoard('price.frame', { price: formatRs(price, lang) })
        : other.kind === 'room'
          ? tBoard('price.hour', { price: formatRs(price, lang) })
          : tBoard('price.game', { price: formatRs(price, lang) });
    const here = table.price ?? 0;
    if (price === here) return t('move.same', { price: text });
    const diff = formatRs(Math.abs(price - here), lang);
    return t(price < here ? 'move.less' : 'move.more', { price: text, diff });
  };

  const frame = game.frameNo;
  const who = whoIsPlaying(game, nameOf, t('panel.vs'));
  const sofar = t('move.sofar', { count: minutesSoFar(game, now) });

  return (
    <section aria-labelledby={headingId} className={cx(PANEL, 'gap-[18px]')}>
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="m-0 text-[26px] font-bold leading-tight">
          {t('move.title', { name: label(table) })}
        </h2>
        <span className="text-[17px] text-c-text-2">
          {frame !== undefined ? (
            <RichText ns="table" i18nKey="move.subtitle" values={{ who, n: frame, sofar }} />
          ) : (
            <RichText ns="table" i18nKey="move.subtitlePlain" values={{ who, sofar }} />
          )}
        </span>
      </div>
      <h3 className="m-0 text-[17px] font-semibold">{t('move.free')}</h3>
      {targets.length === 0 ? (
        <p className="m-0 text-[17px] text-c-text-2">{t('move.none')}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[18px] p-0">
          {targets.map((other) => {
            const blocked = other.outOfOrder !== undefined || other.price === null;
            const selected = !blocked && chosen?.id === other.id;
            return (
              <li key={other.id} className="flex">
                <button
                  type="button"
                  disabled={blocked}
                  aria-pressed={blocked ? undefined : selected}
                  onClick={() => setPicked(other.id)}
                  className={cx(
                    'flex min-h-[92px] w-full items-center gap-[18px] rounded-[18px] px-5 text-start transition-colors duration-150',
                    blocked
                      ? 'cursor-not-allowed border-2 border-dashed border-c-line-3 bg-c-note-bg text-c-note-icon'
                      : selected
                        ? 'border-[3px] border-c-brass bg-c-pill-free-bg text-c-text'
                        : 'border-2 border-c-line-2 bg-c-raised text-c-text active:bg-c-raised-2',
                    focusRing.counter,
                  )}
                >
                  <span className="font-num text-[58px] font-bold leading-none">
                    {other.number}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[20px] font-bold">{label(other)}</span>
                    <span className={cx('text-[16px]', !blocked && 'text-c-text-2')}>
                      {other.outOfOrder
                        ? t('move.outOfOrder', { note: other.outOfOrder.note })
                        : other.price === null
                          ? tBoard('locked')
                          : priceWords(other)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="m-0 rounded-[14px] bg-c-raised px-4 py-3.5 text-[16px] leading-[1.45] text-c-text-3">
        {t('move.note')}
      </p>
      {move.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {move.error.message}
        </p>
      ) : null}
      <PanelActions
        cancel={t('cancel')}
        confirm={chosen ? t('move.to', { name: label(chosen) }) : t('panel.move')}
        disabled={!chosen || move.isPending}
        onCancel={onClose}
        onConfirm={() => {
          if (!chosen) return;
          move.mutate({ id: game.id, request: { toTableId: chosen.id } }, { onSuccess: onClose });
        }}
      />
    </section>
  );
}

function ReplacePanel({ table, game, board, onClose }: PanelProps) {
  const { t } = useTranslation('table');
  const { t: tBoard } = useTranslation('board');
  const replace = useReplacePlayer();
  const headingId = useId();
  const searchId = useId();
  const [leaving, setLeaving] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const typed = query.trim();
  const found = usePlayers(typed || undefined);
  const recent = useRecentPlayers();
  const inGame = gamePlayerIds(game);
  const nameOf = (playerId: string) => board.players[playerId]?.name ?? playerId;
  const everyone = usePlayers();

  const candidates = typed
    ? rankPlayerResults(
        (found.data ?? []).filter((player) => !inGame.includes(player.id)),
        typed,
      )
    : (recent.data ?? []).filter((player) => !inGame.includes(player.id)).slice(0, 4);
  const coming = candidates.find((player) => player.id === incoming);
  const incomingPerson = coming ?? everyone.data?.find((player) => player.id === incoming);
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });

  return (
    <section aria-labelledby={headingId} className={cx(PANEL, 'gap-4')}>
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="m-0 text-[26px] font-bold leading-tight">
          {t('replace.title', { name })}
        </h2>
        <span className="text-[17px] text-c-text-2">{t('replace.text')}</span>
      </div>
      <h3 className="m-0 text-[17px] font-semibold">{t('replace.leaving')}</h3>
      <div className="flex gap-3">
        {inGame.map((playerId) => {
          const selected = leaving === playerId;
          const phone = everyone.data?.find((player) => player.id === playerId)?.phoneTail;
          return (
            <button
              key={playerId}
              type="button"
              aria-pressed={selected}
              onClick={() => setLeaving(playerId)}
              className={cx(
                'flex min-h-[76px] min-w-0 flex-1 flex-col items-start justify-center rounded-[16px] px-4 text-start transition-colors duration-150',
                selected
                  ? 'border-[3px] border-c-brass bg-c-selected'
                  : 'border border-c-line-2 bg-c-raised active:bg-c-raised-2',
                focusRing.counter,
              )}
            >
              <span className="text-[20px] font-bold">
                <bdi>{nameOf(playerId)}</bdi>
              </span>
              {phone ? (
                <bdi dir="ltr" className="text-start text-[15px] text-c-text-2">
                  {phone}
                </bdi>
              ) : null}
            </button>
          );
        })}
      </div>
      <h3 className="m-0 text-[17px] font-semibold">{t('replace.coming')}</h3>
      <div
        className={cx(
          'flex min-h-[60px] items-center gap-3 rounded-[14px] border-2 border-c-line-2 bg-c-page px-4 focus-within:border-c-brass',
          focusWithinRing.counter,
        )}
      >
        <Search aria-hidden="true" size={22} strokeWidth={2} className="shrink-0 text-c-text-2" />
        <input
          id={searchId}
          type="search"
          value={query}
          aria-label={t('replace.search')}
          placeholder={t('replace.search')}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[20px] text-c-text outline-none placeholder:text-c-text-2"
        />
      </div>
      {candidates.length === 0 ? (
        <p className="m-0 text-[17px] text-c-text-2">{typed ? t('replace.none') : ''}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {candidates.map((player) => {
            const selected = incoming === player.id;
            return (
              <li key={player.id} className="flex">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setIncoming(player.id)}
                  className={cx(
                    'flex min-h-[64px] w-full items-center justify-between gap-3 rounded-[14px] px-4 text-start transition-colors duration-150',
                    selected
                      ? 'border-2 border-c-ok-line bg-c-ok-bg'
                      : 'border border-c-line bg-c-raised active:bg-c-raised-2',
                    focusRing.counter,
                  )}
                >
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className={cx('text-[19px]', selected ? 'font-bold' : 'font-semibold')}>
                      <bdi>{player.name}</bdi>
                    </span>
                    <bdi dir="ltr" className="text-[15px] text-c-text-2">
                      {player.phoneTail}
                    </bdi>
                  </span>
                  {selected ? (
                    <Check
                      aria-hidden="true"
                      size={22}
                      strokeWidth={3}
                      className="shrink-0 text-c-ok-ink"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {replace.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {replace.error.message}
        </p>
      ) : null}
      <PanelActions
        cancel={t('cancel')}
        confirm={
          leaving && incomingPerson ? (
            <span>
              <RichText
                ns="table"
                i18nKey="replace.confirm"
                values={{ out: firstName(nameOf(leaving)), in: firstName(incomingPerson.name) }}
              />
            </span>
          ) : (
            t('panel.replace')
          )
        }
        disabled={!leaving || !incoming || replace.isPending}
        onCancel={onClose}
        onConfirm={() => {
          if (!leaving || !incoming) return;
          replace.mutate(
            { id: game.id, request: { outId: leaving, inId: incoming } },
            { onSuccess: onClose },
          );
        }}
      />
    </section>
  );
}
