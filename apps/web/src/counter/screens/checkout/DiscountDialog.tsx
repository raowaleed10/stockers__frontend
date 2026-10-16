import { formatRs, isValidDiscount } from '@stockers/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useCheckoutBill } from '../../api';
import { DISCOUNT_REASONS, useCheckoutDraft, type DiscountReason } from '../../checkout/draft';

const QUICK = [50, 100, 250] as const;
const MAX_DIGITS = 6;

/**
 * Screen 27, `/checkout/:playerId/discount`: "Give Bilal a discount", over his bill. An amount with quick chips, one of
 * five reasons (required) and a note (optional); on the right the bill, the discount and the new total. The discount
 * is whole rupees above 0 and never more than the bill (Q6). It is kept with the checkout and saved with it, with the
 * worker's name, on the statement and in Activity. It starts empty: money is never filled in for the worker.
 */
export function DiscountDialog() {
  const { playerId = '' } = useParams<{ playerId: string }>();
  const { t } = useTranslation('checkout');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const bill = useCheckoutBill(playerId);
  const draft = useCheckoutDraft();
  const amountId = useId();
  const noteId = useId();
  const [amount, setAmount] = useState<number | null>(draft.discount?.amount ?? null);
  const [reason, setReason] = useState<DiscountReason | null>(draft.discount?.reason ?? null);
  const [note, setNote] = useState(draft.discount?.note ?? '');

  const close = () => navigate(`/checkout/${playerId}`);
  if (!bill.data) return null;

  const total = bill.data.total;
  const first = bill.data.player.name.trim().split(/\s+/)[0] ?? bill.data.player.name;
  const money = (value: number) => formatRs(value, lang);
  const typed = amount ?? 0;
  const tooMuch = amount !== null && amount > 0 && !isValidDiscount(total, amount);
  const ready = amount !== null && isValidDiscount(total, amount) && reason !== null;

  const apply = () => {
    if (!ready || amount === null || reason === null) return;
    draft.setDiscount({ amount, reason, note });
    close();
  };

  return (
    <CounterDialog
      width={1166}
      titleSize={30}
      showClose={false}
      title={t('discount.title', { name: first })}
      subtitle={t('discount.text')}
      onClose={close}
      side={
        <div className="flex min-h-full flex-col gap-3.5">
          <div className="flex flex-col overflow-hidden rounded-[18px] border border-c-line bg-c-raised">
            <div className="flex justify-between border-b border-c-line px-5 py-4 text-[19px]">
              <span>{t('discount.bill')}</span>
              <span className="font-semibold">{money(total)}</span>
            </div>
            <div className="flex justify-between border-b border-c-line px-5 py-4 text-[19px] text-c-ok-ink">
              <span>{t('discount.row')}</span>
              <span className="font-semibold">{`− ${money(typed)}`}</span>
            </div>
            <div className="flex items-baseline justify-between px-5 py-[18px]">
              <span className="text-[21px] font-bold">{t('discount.newTotal')}</span>
              <span className="font-num text-[46px] font-bold leading-none">
                {money(Math.max(0, total - typed))}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                className={cx(
                  'min-h-[64px] rounded-[14px] border border-c-line-2 bg-c-raised font-num text-[28px] font-semibold text-c-text transition-colors duration-150 active:bg-c-raised-2',
                  focusRing.counter,
                )}
              >
                {money(value)}
              </button>
            ))}
          </div>
          <div className="mt-auto flex gap-3 pt-3.5">
            <Button
              theme="counter"
              size="counter-main"
              className="flex-1 px-4 text-[19px]"
              onClick={close}
            >
              {t('discount.cancel')}
            </Button>
            <Button
              theme="counter"
              variant="primary"
              size="counter-main"
              className="flex-[2] px-4 text-[20px]"
              disabled={!ready}
              onClick={apply}
            >
              {ready
                ? t('discount.apply', { amount: money(amount ?? 0) })
                : t('discount.applyNone')}
            </Button>
          </div>
          {draft.discount ? (
            <Button
              theme="counter"
              variant="ghost"
              className="text-[17px]"
              onClick={() => {
                draft.setDiscount(null);
                close();
              }}
            >
              {t('discount.remove')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={amountId} className="text-[18px] font-semibold">
          {t('discount.amount')}
        </label>
        <div className="flex min-h-[76px] items-center gap-2.5 rounded-[16px] border-2 border-c-brass bg-c-page px-5">
          <span className="text-[22px] text-c-text-2">{t('discount.rs')}</span>
          <input
            id={amountId}
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            value={amount === null ? '' : String(amount)}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
              setAmount(digits === '' ? null : Number(digits));
            }}
            aria-invalid={tooMuch || undefined}
            className="min-w-0 flex-1 bg-transparent font-num text-[48px] font-semibold text-c-text outline-none"
          />
        </div>
        {tooMuch ? (
          <p role="alert" className="m-0 text-[16px] text-c-danger-ink">
            {t('discount.tooMuch', { total: money(total) })}
          </p>
        ) : null}
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 text-[18px] font-semibold">{t('discount.reason')}</legend>
        <div className="flex flex-wrap gap-2.5">
          {DISCOUNT_REASONS.map((key) => {
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
                {t(`discount.reasons.${key}`)}
              </button>
            );
          })}
        </div>
        <label htmlFor={noteId} className="mt-1 text-[16px] text-c-text-2">
          {t('discount.note')}
        </label>
        <input
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-[60px] rounded-[14px] border-2 border-c-line-2 bg-c-page px-4 text-[18px] text-c-text outline-none focus-visible:border-c-brass"
        />
      </fieldset>
    </CounterDialog>
  );
}
