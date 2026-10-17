import type { Game, GameView } from '@stockers/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import i18n from '@/lib/i18n';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { TextArea } from '@/ui/inputs';
import { focusRing } from '@/ui/theme';
import { formatRs } from '@stockers/shared';
import { useCorrectEnd, useGame } from '../../api';
import { boardOfTableScreen, tablePath } from '../../components/table-paths';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';
import { EndDouble } from './EndDouble';
import { OvertimeStep } from './Overtime';
import { WhoLost } from './WhoLost';

type Step = 'who' | 'overtime' | 'stop';

/**
 * The second step of "Tapped the wrong player? Undo" (screen 18, D63), over the board:
 * `/table/:id/correct/:gameId` asks who lost the frame again, `/overtime` asks "charge double?" for a frame that ran over
 * its limit, and `/stop` is "Nobody pays". The game can be an earlier frame while the next one is running. These pages
 * only exist while a correction is open (Undo was tapped less than 2 minutes ago); a reload after that, or after the
 * answer, goes back to the board.
 */
export function CorrectFrame({ step = 'who' }: { step?: Step }) {
  const { id, gameId = '' } = useParams<{ id: string; gameId: string }>();
  return (
    <TableGate tableId={id}>
      {(context) => <CorrectStep {...context} gameId={gameId} step={step} />}
    </TableGate>
  );
}

function CorrectStep({ gameId, step, ...context }: TableContext & { gameId: string; step: Step }) {
  const { pathname } = useLocation();
  const view = useGame(gameId);
  // The answer closes the correction; the page keeps the frame it had until its own navigation has run.
  const [kept, setKept] = useState<GameView | undefined>();
  if (view.data?.game.correction && view.data !== kept) setKept(view.data);
  const current = view.data?.game.correction ? view.data : kept;

  // A game cached from before Undo has no correction yet: wait for the fresh answer before deciding it is over.
  if (view.isPending || (view.isFetching && !current)) return null;
  if (!current) return <Navigate to={boardOfTableScreen(pathname)} replace />;
  if (step === 'overtime') return <OvertimeStep {...context} correcting={current} />;
  if (step === 'stop') return <CorrectDiscard {...context} view={current} />;
  if (current.game.type === 'double') {
    return <EndDouble {...context} game={current.game} correcting />;
  }
  return <WhoLost {...context} game={current.game} correcting />;
}

const REASONS = ['left', 'power', 'table', 'other'] as const;

/**
 * "Nobody pays" after Undo: the frame is discarded. It asks for a reason like the Discard of the stop screen (14), and the
 * owners see it in Activity with the worker's name. The reason is saved in English, whatever language the counter is in.
 */
function CorrectDiscard({ table, view }: TableContext & { view: GameView }) {
  const { t } = useTranslation('end');
  const { t: tTable } = useTranslation('table');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const correct = useCorrectEnd();
  const noteId = useId();
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [note, setNote] = useState('');
  const game: Game = view.game;

  const loserId = game.result?.loserIds[0] ?? '';
  const name = view.players[loserId]?.name ?? '';
  const english = i18n.getFixedT('en', 'table');
  const reasonText = reason ? english(`stop.reasons.${reason}`) : '';
  const back = tablePath(pathname, table.id, `/correct/${game.id}`);

  return (
    <CounterDialog
      title={t('correct.nobodyTitle')}
      subtitle={t('correct.nobodySub', {
        amount: formatRs(game.result?.amount ?? 0, lang),
        name,
      })}
      showClose={false}
      onClose={() => navigate(back)}
      actions={
        <>
          <div className="flex-1" />
          <Button theme="counter" size="counter-main" className="px-[26px]" onClick={close}>
            {t('correct.keep')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="px-[34px]"
            disabled={!reason || correct.isPending}
            onClick={() =>
              correct.mutate(
                {
                  id: game.id,
                  request: {
                    discard: { reason: reasonText, ...(note.trim() ? { note: note.trim() } : {}) },
                  },
                },
                { onSuccess: close },
              )
            }
          >
            {t('who.nobody')}
          </Button>
        </>
      }
    >
      <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 text-[18px] font-bold">{tTable('stop.reason')}</legend>
        <div className="flex flex-wrap gap-2.5">
          {REASONS.map((key) => {
            const selected = reason === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setReason(key)}
                className={cx(
                  'min-h-touch rounded-full px-5 text-[17px] text-c-text transition-colors duration-150',
                  selected
                    ? 'border-2 border-c-brass bg-c-selected font-semibold'
                    : 'border border-c-line-2 bg-c-raised active:bg-c-raised-2',
                  focusRing.counter,
                )}
              >
                {tTable(`stop.reasons.${key}`)}
              </button>
            );
          })}
        </div>
        <label htmlFor={noteId} className="mt-1 text-[16px] text-c-text-2">
          {tTable('stop.note')}
        </label>
        <TextArea
          id={noteId}
          theme="counter"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="bg-c-page"
        />
      </fieldset>
      {correct.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {correct.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
