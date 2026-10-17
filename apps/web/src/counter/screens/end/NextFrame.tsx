import { formatRs, undoSecondsLeft } from '@stockers/shared';
import { Check, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useGame, useMe, useNextFrame, useUndoEnd } from '../../api';
import { RichText } from '../../components/RichText';
import { boardOfTableScreen, tablePath } from '../../components/table-paths';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';
import { firstName } from '../table/game-info';

/** `1:56`, the way screen 18 writes the time left to undo. */
const clockLeft = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * Screen 18, `/table/:id/next`: "Rs 250 added to Bilal Ahmed's bill". It opens after a single frame is charged, with the
 * id of the frame that ended in the router's state (a reload has nothing to show, so it goes back to the board). The
 * session score, then Next frame (same players, the same table), Change players, or Free the table. "Tapped the wrong
 * player? Undo" opens the correction for 2 minutes: who lost again, or Nobody pays (D63, docs/NO_DESIGN.md).
 */
export function NextFrame() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <NextStep {...context} />}</TableGate>;
}

function NextStep({ table, board }: TableContext) {
  const { t } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { pathname, state } = useLocation() as {
    pathname: string;
    state: { gameId?: string } | null;
  };
  const close = useCloseTable();
  const now = useNow(1000);
  const me = useMe();
  const gameId = state?.gameId;
  const view = useGame(gameId ?? '', gameId !== undefined);
  const next = useNextFrame();
  const undo = useUndoEnd();

  if (!gameId) return <Navigate to={boardOfTableScreen(pathname)} replace />;
  // After Undo the screen leaves by its own navigation, to who lost; the frame running again is not a reason to go to the board.
  if (!view.data || undo.isSuccess) return null;

  const { game, session, players, tonight } = view.data;
  const result = game.result;
  if (game.status !== 'ended' || !result) {
    // The game was cached before it ended; the fresh answer is on its way (the live event asked for it). Without a charge
    // to show, once it has come, there is nothing to say here.
    return view.isFetching ? null : <Navigate to={boardOfTableScreen(pathname)} replace />;
  }

  const money = (value: number) => formatRs(value, lang);
  const nameOf = (id: string) => players[id]?.name ?? board.players[id]?.name ?? id;
  const loserId = result.loserIds[0] ?? '';
  const winnerId = (game.playerIds ?? []).find((id) => !result.loserIds.includes(id)) ?? '';
  // From the same answer as the charge, so it never shows the bill from before it.
  const waiting = tonight[loserId]?.waiting ?? result.amount;
  const tableName = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const frameNo = (game.frameNo ?? 1) + 1;

  // "Ali 3 – 0 Bilal": the player ahead first, then each one's wins in this session.
  const frames = session?.frames ?? [];
  const score = (() => {
    const [one, two] = session?.playerIds ?? [];
    if (!one || !two) return '';
    const wins = (id: string) => frames.filter((frame) => !frame.loserIds.includes(id)).length;
    const [ahead, behind] = wins(one) >= wins(two) ? [one, two] : [two, one];
    return `${firstName(nameOf(ahead))} ${wins(ahead)} – ${wins(behind)} ${firstName(nameOf(behind))}`;
  })();

  const left = game.endedAt ? undoSecondsLeft(game.endedAt, now) : 0;
  const canUndo = left > 0 && game.endedBy?.id === me.data?.worker.id;

  const option =
    'flex min-h-[120px] min-w-0 flex-col items-start justify-center gap-1 text-start transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <CounterDialog
      width={1106}
      titleSize={30}
      iconTone="felt"
      icon={<Check size={34} strokeWidth={2.6} />}
      showClose={false}
      title={
        <RichText
          ns="end"
          i18nKey="next.title"
          values={{ amount: money(result.amount), name: nameOf(loserId) }}
        />
      }
      subtitle={t('next.sub', {
        amount: money(waiting),
        winner: nameOf(winnerId),
        n: game.frameNo ?? 1,
      })}
      onClose={close}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-c-info-line bg-c-info-bg px-6 py-5">
        <span className="text-[18px] text-c-info-ink">
          {t('next.session', { name: tableName, count: frames.length })}
        </span>
        <bdi className="font-num text-[44px] font-bold leading-tight">{score}</bdi>
      </div>

      <div className="flex flex-wrap gap-3.5">
        <button
          type="button"
          disabled={next.isPending || table.game !== undefined}
          onClick={() => next.mutate(game.id, { onSuccess: close })}
          className={cx(
            option,
            'flex-[2_1_420px] rounded-[20px] bg-c-brass px-[26px] text-c-brass-ink active:bg-c-brass-press',
            focusRing.counter,
          )}
        >
          <span className="text-[26px] font-bold">{t('next.again')}</span>
          <span className="text-[17px] font-medium">
            {t('next.againSub', { n: frameNo, price: money(game.price) })}
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate(tablePath(pathname, table.id, '/start/players'))}
          className={cx(
            option,
            'flex-[1_1_220px] rounded-[20px] border border-c-line-2 bg-c-raised px-[22px] text-c-text active:bg-c-raised-2',
            focusRing.counter,
          )}
        >
          <span className="text-[22px] font-bold">{t('next.change')}</span>
          <span className="text-[16px] text-c-text-2">
            {t('next.changeSub', { name: tableName })}
          </span>
        </button>
        <button
          type="button"
          onClick={close}
          className={cx(
            option,
            'flex-[1_1_220px] rounded-[20px] border border-c-line-2 bg-c-raised px-[22px] text-c-text active:bg-c-raised-2',
            focusRing.counter,
          )}
        >
          <span className="text-[22px] font-bold">{t('next.free')}</span>
          <span className="text-[16px] text-c-text-2">{t('next.freeSub')}</span>
        </button>
      </div>

      {canUndo ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[16px] text-c-text-2">{t('next.wrong')}</span>
          <button
            type="button"
            disabled={undo.isPending}
            onClick={() =>
              undo.mutate(game.id, {
                onSuccess: () => navigate(tablePath(pathname, table.id, `/correct/${game.id}`)),
              })
            }
            className={cx(
              'inline-flex min-h-touch items-center gap-2.5 rounded-[12px] border border-c-line-2 bg-transparent px-5 text-[17px] font-semibold text-c-text transition-colors duration-150 active:bg-c-raised disabled:opacity-40',
              focusRing.counter,
            )}
          >
            <Undo2 aria-hidden="true" size={20} strokeWidth={2.2} />
            {t('next.undo', { time: clockLeft(left) })}
          </button>
        </div>
      ) : null}
      {(next.error ?? undo.error) ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {(next.error ?? undo.error)?.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
