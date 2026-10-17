import { drawerAfterExpense, formatAmount, formatRs, type ExpenseCategory } from '@stockers/shared';
import { Banknote } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { TextArea } from '@/ui/inputs';
import { focusRing, focusWithinRing } from '@/ui/theme';
import { useAddDrawerExpense, useMe, useToday } from '../../api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { boardOfTableScreen } from '../../components/table-paths';

/**
 * What the counter offers for an expense from the drawer (screen 29), and the owners' category each one is saved under.
 * Every chip is its own category on the owner side (D65), shown in Expenses as paid from "Drawer cash".
 */
const KINDS = [
  { id: 'food', category: 'food' },
  { id: 'petrol', category: 'petrol' },
  { id: 'tea', category: 'tea-milk' },
  { id: 'cleaning', category: 'cleaning' },
  { id: 'repairs', category: 'repairs' },
  { id: 'other', category: 'other' },
] as const satisfies readonly { id: string; category: ExpenseCategory }[];

type Kind = (typeof KINDS)[number]['id'];

const QUICK = [200, 500, 1000, 2000];
const MAX_DIGITS = 7;

/** A choice drawn as screen 29 draws it: 60 px tall, a 2 px brass edge and bold words when it is the one picked. */
function Choice({
  selected,
  onClick,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  className?: string;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'rounded-[14px] text-c-text transition-colors duration-150',
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
 * Screen 29, `/expense`: "Expense from the drawer", a dialog over the board. A worker takes cash from the drawer for food,
 * petrol, tea and milk, cleaning, repairs or something else, with a required note and the amount. It comes off the cash the
 * drawer should have (it shows before and after), and the owners see it in Expenses and Activity with his name (D53).
 * Taking the cash asks once ("Take Rs 500 from the drawer for Food?"), then the cream Undo toast keeps it for 2 minutes (D65).
 */
export function ExpenseDialog() {
  const { t } = useTranslation('expense');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const me = useMe();
  const today = useToday();
  const add = useAddDrawerExpense();
  const noteId = useId();
  const amountId = useId();
  const [kind, setKind] = useState<Kind | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);

  const close = () => navigate(boardOfTableScreen(pathname));
  const money = (value: number) => formatRs(value, lang);
  const expected = today.data?.drawerExpected;
  const valid = amount !== null && amount > 0;
  const ready = kind !== null && valid && note.trim() !== '';

  const take = () => {
    const picked = KINDS.find((option) => option.id === kind);
    if (!picked || amount === null || !valid) return;
    add.mutate({ category: picked.category, amount, note: note.trim() }, { onSuccess: close });
  };

  if (asking && kind !== null && amount !== null) {
    return (
      <ConfirmDialog
        title={t('confirm.title', { amount: money(amount), what: t(`kinds.${kind}`) })}
        subtitle={t('confirm.sub', { note: note.trim() })}
        yes={t('confirm.yes')}
        no={t('confirm.no')}
        pending={add.isPending}
        error={add.error?.message}
        onYes={take}
        onNo={() => setAsking(false)}
      />
    );
  }

  return (
    <CounterDialog
      tone="brass"
      width={1060}
      titleSize="lg"
      icon={<Banknote size={30} strokeWidth={2.4} />}
      kicker={t('addedBy', { name: me.data?.worker.name ?? '' })}
      title={t('title')}
      subtitle={t('sub')}
      showClose={false}
      onClose={close}
      actions={
        <>
          <span className="min-w-0 flex-[1_1_360px] text-[16px] text-c-text-2">{t('footer')}</span>
          <Button theme="counter" size="counter-main" className="px-[26px]" onClick={close}>
            {t('cancel')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="px-[30px] text-[19px]"
            disabled={!ready || add.isPending}
            onClick={() => setAsking(true)}
          >
            {valid ? t('take', { amount: money(amount) }) : t('takeNone')}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-2.5">
          <span id={`${noteId}-what`} className="text-[18px] font-semibold">
            {t('what')}
          </span>
          <div role="group" aria-labelledby={`${noteId}-what`} className="flex flex-wrap gap-2.5">
            {KINDS.map((option) => (
              <Choice
                key={option.id}
                selected={kind === option.id}
                onClick={() => setKind(option.id)}
                className="min-h-[60px] px-[22px] text-[18px]"
              >
                {t(`kinds.${option.id}`)}
              </Choice>
            ))}
          </div>
          <label htmlFor={noteId} className="mt-2 text-[18px] font-semibold">
            {t('note')}
          </label>
          <TextArea
            id={noteId}
            theme="counter"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="bg-c-page text-[18px]"
          />
        </div>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5">
          <label htmlFor={amountId} className="text-[18px] font-semibold">
            {t('amount')}
          </label>
          <div
            className={cx(
              'flex min-h-[76px] items-center gap-2.5 rounded-[16px] border-2 border-c-brass bg-c-page px-5',
              focusWithinRing.counter,
            )}
          >
            <span aria-hidden="true" className="text-[22px] text-c-text-2">
              {t('rs')}
            </span>
            <input
              id={amountId}
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
          <div role="group" aria-label={t('quick')} className="flex flex-wrap gap-2">
            {QUICK.map((value) => (
              <Choice
                key={value}
                selected={amount === value}
                onClick={() => setAmount(value)}
                className="min-h-[56px] flex-1 text-[17px]"
              >
                {formatAmount(value)}
              </Choice>
            ))}
          </div>
          <div className="flex items-baseline justify-between gap-3 rounded-[14px] border border-c-line bg-c-page px-4 py-3.5 text-[17px] text-c-text-3">
            <span>{t('drawer')}</span>
            {expected === undefined ? null : valid ? (
              <span>
                <s
                  className="text-c-strike"
                  aria-label={t('drawerWas', { amount: money(expected) })}
                >
                  {money(expected)}
                </s>{' '}
                <b
                  className="text-[20px] text-c-text"
                  aria-label={t('drawerNow', {
                    amount: money(drawerAfterExpense(expected, amount)),
                  })}
                >
                  {money(drawerAfterExpense(expected, amount))}
                </b>
              </span>
            ) : (
              <b className="text-[20px] text-c-text">{money(expected)}</b>
            )}
          </div>
        </div>
      </div>
      {add.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {add.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
