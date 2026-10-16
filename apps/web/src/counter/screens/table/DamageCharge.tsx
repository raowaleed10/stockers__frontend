import { formatAmount, formatRs, type Game } from '@stockers/shared';
import { Wrench } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import i18n from '@/lib/i18n';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { TextArea } from '@/ui/inputs';
import { PersonCard } from '@/ui/PersonCard';
import { focusRing } from '@/ui/theme';
import { useDamageCharge, usePlayers } from '../../api';
import { RichText } from '../../components/RichText';
import { boardOfTableScreen } from '../../components/table-paths';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';
import { firstName, gamePlayerIds, whoIsPlaying } from './game-info';

const ITEMS = ['cue', 'ball', 'cloth', 'other'] as const;
const QUICK = [500, 1000, 1500, 2000];
const MAX_DIGITS = 7;

/** A choice you tap, one of a few: 60 px tall, a brass border and bolder words when it is the one picked. */
function Choice({
  selected,
  className,
  onClick,
  children,
}: {
  selected: boolean;
  className: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'text-c-text transition-colors duration-150',
        selected
          ? 'border-2 border-c-brass bg-c-raised-2 font-bold'
          : 'border border-c-line-2 bg-c-raised active:bg-c-raised-2',
        focusRing.counter,
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Screen 15, `/table/:id/damage`: a broken cue, a damaged ball or torn cloth goes on a player's bill with a note.
 * Who pays (one of the players on the table), what was damaged, the amount with four quick buttons, and a note that
 * is required. Nothing is picked to begin with: it is money, so each answer is the worker's. It shows on the player's
 * statement as a damage charge and the owners see it in Activity with the worker's name.
 */
export function DamageCharge() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <DamageStep {...context} />}</TableGate>;
}

function DamageStep({ table, board }: TableContext) {
  const { t } = useTranslation('table');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const charge = useDamageCharge();
  const everyone = usePlayers();
  const noteId = useId();
  const amountId = useId();
  const [payer, setPayer] = useState<string | null>(null);
  const [item, setItem] = useState<(typeof ITEMS)[number] | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const game: Game | undefined = table.game;

  if (!game) {
    return charge.isSuccess ? null : <Navigate to={boardOfTableScreen(pathname)} replace />;
  }

  const nameOf = (playerId: string) => board.players[playerId]?.name ?? playerId;
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const who = whoIsPlaying(game, nameOf, t('panel.vs'));
  const players = gamePlayerIds(game);
  const ready =
    payer !== null && item !== null && amount !== null && amount > 0 && note.trim() !== '';
  // The item is written in English, like every note the owners read.
  const english = i18n.getFixedT('en', 'table');

  const submit = () => {
    if (!ready || payer === null || item === null || amount === null) return;
    charge.mutate(
      {
        id: game.id,
        request: {
          playerId: payer,
          item: english(`damage.items.${item}`),
          amount,
          note: note.trim(),
        },
      },
      { onSuccess: close },
    );
  };

  return (
    <CounterDialog
      size="xl"
      tone="brass"
      titleSize="lg"
      icon={<Wrench size={30} strokeWidth={2.4} />}
      kicker={<RichText ns="table" i18nKey="damage.kicker" values={{ name, who }} />}
      title={t('damage.title')}
      subtitle={t('damage.text')}
      showClose={false}
      onClose={close}
      actions={
        <>
          <span className="min-w-0 flex-[1_1_360px] text-[16px] text-c-text-2">
            {payer ? (
              <RichText
                ns="table"
                i18nKey="damage.footer"
                values={{ name: firstName(nameOf(payer)) }}
              />
            ) : (
              t('damage.footerPlain')
            )}
          </span>
          <Button
            theme="counter"
            size="counter-main"
            className="px-[26px] text-[18px]"
            onClick={close}
          >
            {t('cancel')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="px-[30px] text-[19px]"
            disabled={!ready || charge.isPending}
            onClick={submit}
          >
            {payer && amount ? (
              <span>
                <RichText
                  ns="table"
                  i18nKey="damage.add"
                  values={{ amount: formatRs(amount, lang), name: firstName(nameOf(payer)) }}
                />
              </span>
            ) : (
              t('damage.addPlain')
            )}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2.5">
        <span id="payer-label" className="text-[18px] font-semibold">
          {t('damage.who')}
        </span>
        <div role="group" aria-labelledby="payer-label" className="flex flex-wrap gap-3">
          {players.map((playerId) => (
            <PersonCard
              key={playerId}
              variant="choice"
              className="flex-[1_1_300px]"
              name={nameOf(playerId)}
              phoneTail={everyone.data?.find((player) => player.id === playerId)?.phoneTail ?? ''}
              selected={payer === playerId}
              onClick={() => setPayer(playerId)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-2.5">
          <span id="item-label" className="text-[18px] font-semibold">
            {t('damage.what')}
          </span>
          <div role="group" aria-labelledby="item-label" className="flex flex-wrap gap-2.5">
            {ITEMS.map((key) => (
              <Choice
                key={key}
                selected={item === key}
                className="min-h-[60px] rounded-[14px] px-6 text-[18px]"
                onClick={() => setItem(key)}
              >
                {t(`damage.items.${key}`)}
              </Choice>
            ))}
          </div>
          <label htmlFor={noteId} className="mt-2 text-[18px] font-semibold">
            {t('damage.note')}
          </label>
          <TextArea
            id={noteId}
            theme="counter"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="border bg-c-page"
          />
        </div>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5">
          <label htmlFor={amountId} className="text-[18px] font-semibold">
            {t('damage.amount')}
          </label>
          <div className="flex min-h-[76px] items-center gap-2.5 rounded-[16px] border-2 border-c-brass bg-c-page px-5">
            <span className="text-[22px] text-c-text-2">{t('damage.rs')}</span>
            <input
              id={amountId}
              dir="ltr"
              inputMode="numeric"
              autoComplete="off"
              value={amount === null ? '' : formatAmount(amount)}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
                setAmount(digits === '' ? null : Number(digits));
              }}
              className="min-w-0 flex-1 bg-transparent font-num text-[46px] font-bold text-c-text outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((value) => (
              <Choice
                key={value}
                selected={amount === value}
                className="min-h-touch flex-1 rounded-[12px] text-[17px]"
                onClick={() => setAmount(value)}
              >
                {formatAmount(value)}
              </Choice>
            ))}
          </div>
        </div>
      </div>
      {charge.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {charge.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
