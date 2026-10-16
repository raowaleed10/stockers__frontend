import { formatRs, type Game } from '@stockers/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import i18n from '@/lib/i18n';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { TextArea } from '@/ui/inputs';
import { focusRing } from '@/ui/theme';
import { useCancelGame, useDiscardGame, useDisputeGame } from '../../api';
import { RichText } from '../../components/RichText';
import { boardOfTableScreen } from '../../components/table-paths';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';
import { whoIsPlaying } from './game-info';

type Choice = 'discard' | 'dispute' | 'cancel';
const CHOICES: Choice[] = ['discard', 'dispute', 'cancel'];
const REASONS = ['left', 'power', 'table', 'other'] as const;

/**
 * Screen 14, `/table/:id/stop`: stop a game without its normal charge. Discard it (nobody pays), mark it as a dispute
 * (it waits, and an owner decides who pays), or cancel it because it was started by mistake. A reason is always asked
 * for; the note is optional. The owners see every one with its reason in Activity. The reason is saved in English,
 * whatever language the counter is in, so the owners read one wording.
 */
export function StopFrame() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <StopStep {...context} />}</TableGate>;
}

function StopStep({ table, board }: TableContext) {
  const { t } = useTranslation('table');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const discard = useDiscardGame();
  const dispute = useDisputeGame();
  const cancel = useCancelGame();
  const noteId = useId();
  const [choice, setChoice] = useState<Choice>('discard');
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [note, setNote] = useState('');
  const game: Game | undefined = table.game;

  const finished = discard.isSuccess || dispute.isSuccess || cancel.isSuccess;
  if (!game) {
    return finished ? null : <Navigate to={boardOfTableScreen(pathname)} replace />;
  }

  const nameOf = (playerId: string) => board.players[playerId]?.name ?? playerId;
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const type = game.type;
  const money = formatRs(game.price, lang);
  const priceText =
    type === 'century' || type === 'room' ? t(`stop.price.${type}`, { price: money }) : money;
  const pending = discard.isPending || dispute.isPending || cancel.isPending;
  const error = discard.error ?? dispute.error ?? cancel.error;

  // What is written down is English, like every reason the owners read; the words on the chips are the counter's.
  const english = i18n.getFixedT('en', 'table');
  const reasonText = reason ? english(`stop.reasons.${reason}`) : '';
  const written = note.trim() ? `${reasonText}. ${note.trim()}` : reasonText;

  const submit = () => {
    if (!reason) return;
    const options = { onSuccess: close };
    if (choice === 'discard') {
      discard.mutate(
        {
          id: game.id,
          request: { reason: reasonText, ...(note.trim() ? { note: note.trim() } : {}) },
        },
        options,
      );
    } else if (choice === 'dispute') {
      dispute.mutate({ id: game.id, request: { note: written } }, options);
    } else {
      cancel.mutate({ id: game.id, request: { reason: written } }, options);
    }
  };

  const confirmWord =
    choice === 'discard'
      ? type === 'single' || type === 'double'
        ? t('stop.confirm.discard')
        : t('stop.confirm.discardGame')
      : t(`stop.confirm.${choice}`);

  return (
    <CounterDialog
      title={t('stop.title', { name })}
      subtitle={
        <RichText
          ns="table"
          i18nKey="stop.subtitle"
          values={{
            who: whoIsPlaying(game, nameOf, t('panel.vs')),
            what: t(`stop.what.${type}`),
            price: priceText,
          }}
        />
      }
      showClose={false}
      onClose={close}
      actions={
        <>
          <div className="flex-1" />
          <Button theme="counter" size="counter-main" className="px-[26px]" onClick={close}>
            {t('stop.keep')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="px-[34px]"
            disabled={!reason || pending}
            onClick={submit}
          >
            {confirmWord}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-3">
        {CHOICES.map((option) => {
          const selected = choice === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => setChoice(option)}
              className={cx(
                'flex min-h-[140px] min-w-0 flex-[1_1_260px] flex-col gap-2 rounded-[18px] px-[18px] text-start transition-colors duration-150',
                selected
                  ? 'border-[3px] border-c-brass bg-c-selected py-[14px]'
                  : 'border border-c-line-2 bg-c-raised py-4 active:bg-c-raised-2',
                focusRing.counter,
              )}
            >
              <span className="text-[22px] font-bold leading-tight">
                {t(`stop.options.${option}.title`)}
              </span>
              <span className="text-[16px] leading-[1.4] text-c-text-3">
                {t(`stop.options.${option}.text`)}
              </span>
            </button>
          );
        })}
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 text-[18px] font-bold">{t('stop.reason')}</legend>
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
                {t(`stop.reasons.${key}`)}
              </button>
            );
          })}
        </div>
        <label htmlFor={noteId} className="mt-1 text-[16px] text-c-text-2">
          {t('stop.note')}
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
      {error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
