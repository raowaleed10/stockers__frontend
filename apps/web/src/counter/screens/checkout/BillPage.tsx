import {
  creditAgeDays,
  formatDate,
  formatMonthYear,
  formatRs,
  formatWeekday,
  toClubIso,
  type StatementLine,
} from '@stockers/shared';
import { Tag } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useBoard, useCheckoutBill, usePayCheckout } from '../../api';
import { useCheckoutDraft } from '../../checkout/draft';
import { discountRequest } from '../../checkout/request';
import { splitLine } from '../../checkout/split-line';
import { PageHeader } from '../../components/PageHeader';
import type { PaidNote } from './CheckoutList';

/**
 * Screen 25, `/checkout/:playerId`: a player's bill as a statement. The old credit with its date and age, then tonight's
 * lines, then the total to pay (old credit + tonight − advance − the discount, if one is given). On the right: Paid in
 * full (one tap, with the method picked under it), Paid part (the part payment page, 26) and Put all on credit; "Give a
 * discount" opens the dialog of screen 27 over this page. A payment is saved with the worker's name (D52).
 */
export function BillPage() {
  const { playerId = '' } = useParams<{ playerId: string }>();
  const { t } = useTranslation('checkout');
  const { lang, clock } = useFormat();
  const navigate = useNavigate();
  const now = useNow(60_000);
  const bill = useCheckoutBill(playerId);
  const board = useBoard();
  const pay = usePayCheckout();
  const draft = useCheckoutDraft();

  useEffect(() => {
    draft.begin(playerId);
    // `begin` is stable and only the player decides whether a new bill starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  if (bill.isError) {
    return (
      <Shell>
        <PageHeader
          back={t('bill.back')}
          onBack={() => navigate('/checkout')}
          title={t('notFound')}
        />
      </Shell>
    );
  }
  if (!bill.data) return <Shell />;

  const data = bill.data;
  const { player } = data;
  const first = player.name.trim().split(/\s+/)[0] ?? player.name;
  const money = (value: number) => formatRs(value, lang);
  const iso = toClubIso(now);

  const discount = draft.discount?.amount ?? 0;
  const due = Math.max(0, data.total - discount);
  const method = draft.method ?? data.methods[0]?.id ?? 'cash';
  const sheet = board.data?.sheet.number;

  // What is sent: the discount with its reason in English (the owners read one wording), and the payment.
  const discountBody = draft.discount ? discountRequest(draft.discount) : undefined;

  const save = (parts: { method: string; amount: number }[], toCredit: number) => {
    const paid = parts.reduce((sum, part) => sum + part.amount, 0);
    pay.mutate(
      {
        playerId,
        request: { playerId, parts, toCredit, ...(discountBody ? { discount: discountBody } : {}) },
      },
      {
        onSuccess: (result) => {
          draft.reset();
          const note: PaidNote = {
            name: player.name,
            paid,
            toCredit: result.settlement.toCredit,
            advance: result.settlement.advance,
          };
          navigate('/checkout', { state: { paid: note } });
        },
      },
    );
  };

  const subtitle = [
    player.phone ? player.phone : player.phoneTail,
    t('bill.since', { when: formatMonthYear(player.since, lang) }),
  ]
    .filter(Boolean)
    .join('. ');

  const days =
    data.oldCredit > 0 && player.oldestUnpaidAt ? creditAgeDays(player.oldestUnpaidAt, iso) : 0;

  return (
    <Shell>
      <PageHeader
        back={t('bill.back')}
        onBack={() => navigate('/checkout')}
        title={player.name}
        subtitle={`${subtitle}.`}
      />
      <main className="flex flex-1 flex-wrap items-start gap-5 px-6 pb-6 pt-5">
        <section
          aria-label={t('bill.label')}
          className="flex min-w-0 flex-[999_1_560px] flex-col gap-1 rounded-[22px] border border-c-line bg-c-panel px-6 py-[22px]"
        >
          {data.oldCredit > 0 ? (
            <div className="mb-2.5 flex items-center justify-between gap-3 rounded-[14px] border border-c-warn-line bg-c-warn-bg px-4 py-3.5">
              <span className="flex min-w-0 flex-col">
                <span className="text-[19px] font-bold text-c-warn-ink">{t('bill.oldCredit')}</span>
                {player.oldestUnpaidAt ? (
                  <span className="text-[15px] text-c-text-3">
                    {t('bill.unpaidSince', {
                      when: `${formatWeekday(player.oldestUnpaidAt, lang)} ${formatDate(player.oldestUnpaidAt, lang)}`,
                      count: days,
                    })}
                  </span>
                ) : null}
              </span>
              <span className="text-[22px] font-bold">{money(data.oldCredit)}</span>
            </div>
          ) : null}
          {data.advance > 0 ? (
            <div className="mb-2.5 flex items-center justify-between gap-3 rounded-[14px] border border-c-ok-line bg-c-ok-bg px-4 py-3.5">
              <span className="flex min-w-0 flex-col">
                <span className="text-[19px] font-bold text-c-ok-ink">{t('bill.advance')}</span>
                <span className="text-[15px] text-c-text-3">{t('bill.advanceUsed')}</span>
              </span>
              <span className="text-[22px] font-bold">{`− ${money(data.advance)}`}</span>
            </div>
          ) : null}

          <h2 className="mb-1.5 mt-1.5 text-[18px] font-bold text-c-text-2">
            {t('bill.tonight', { sheet: sheet ?? '' })}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {data.tonight.map((line) => (
              <LineRow
                key={line.id}
                line={line}
                time={clock(line.at)}
                amount={money(line.charge ?? 0)}
              />
            ))}
          </ul>
          <div className="flex justify-between px-1 pb-1 pt-3.5 text-[18px] text-c-text-2">
            <span>{t('bill.tonightTotal')}</span>
            <span className="font-semibold text-c-text">{money(data.tonightTotal)}</span>
          </div>
          {draft.discount ? (
            <div className="flex justify-between px-1 pt-1 text-[18px] text-c-ok-ink">
              <span>
                {t('bill.discount', { reason: t(`discount.reasons.${draft.discount.reason}`) })}
              </span>
              <span className="font-semibold">{`− ${money(discount)}`}</span>
            </div>
          ) : null}
          <div className="mt-2 flex items-baseline justify-between border-t-2 border-c-line-2 px-1 pt-4">
            <span className="text-[24px] font-bold">{t('bill.total')}</span>
            <span className="font-num text-[60px] font-bold leading-none">{money(due)}</span>
          </div>
        </section>

        <section
          aria-label={t('bill.payment')}
          className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5"
        >
          <button
            type="button"
            disabled={pay.isPending}
            onClick={() => save(due > 0 ? [{ method, amount: due }] : [], 0)}
            className={cx(
              'flex min-h-[96px] flex-col items-start justify-center rounded-[18px] bg-c-brass px-6 text-start text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press disabled:opacity-40',
              focusRing.counter,
            )}
          >
            <span className="text-[24px] font-bold">{t('bill.full')}</span>
            <span className="text-[17px] font-medium">
              {due > 0 ? t('bill.fullSub', { amount: money(due) }) : t('bill.nothingToPay')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/checkout/${playerId}/part`)}
            className={cx(
              'flex min-h-[84px] flex-col items-start justify-center rounded-[18px] border border-c-info-line bg-c-info-bg px-6 text-start text-c-text transition-colors duration-150 active:bg-c-raised-2',
              focusRing.counter,
            )}
          >
            <span className="text-[22px] font-bold">{t('bill.part')}</span>
            <span className="text-[16px] text-c-info-ink">{t('bill.partSub')}</span>
          </button>
          <button
            type="button"
            disabled={pay.isPending || due <= 0}
            onClick={() => save([], due)}
            className={cx(
              'flex min-h-[84px] flex-col items-start justify-center rounded-[18px] border border-c-warn-line bg-c-warn-bg px-6 text-start text-c-text transition-colors duration-150 active:bg-c-raised-2 disabled:opacity-40',
              focusRing.counter,
            )}
          >
            <span className="text-[22px] font-bold">{t('bill.credit')}</span>
            <span className="text-[16px] text-c-warn-ink">
              {t('bill.creditSub', { name: first, amount: money(due) })}
            </span>
          </button>

          <fieldset className="m-0 mt-1 flex min-w-0 flex-col gap-3 rounded-[18px] border-0 bg-c-panel p-[18px]">
            <legend className="float-start mb-1 p-0 text-[18px] font-bold">
              {t('bill.paidBy')}
            </legend>
            <div className="clear-both grid grid-cols-2 gap-2.5">
              {data.methods.map((option) => {
                const selected = option.id === method;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => draft.setMethod(option.id)}
                    className={cx(
                      'min-h-[64px] rounded-[14px] px-2 text-[19px] text-c-text transition-colors duration-150',
                      selected
                        ? 'border-2 border-c-brass bg-c-selected font-bold'
                        : 'border border-c-line-2 bg-c-raised font-semibold active:bg-c-raised-2',
                      focusRing.counter,
                    )}
                  >
                    {t(`methods.${option.id}` as never, { defaultValue: option.name })}
                  </button>
                );
              })}
            </div>
            <span className="text-[15px] text-c-text-2">{t('bill.twoWays')}</span>
          </fieldset>

          <button
            type="button"
            onClick={() => navigate(`/checkout/${playerId}/discount`)}
            className={cx(
              'flex min-h-[60px] items-center justify-center gap-2.5 rounded-[14px] border border-c-line-3 bg-transparent text-[18px] font-semibold text-c-text transition-colors duration-150 active:bg-c-raised',
              focusRing.counter,
            )}
          >
            <Tag aria-hidden="true" size={20} strokeWidth={2} />
            {t('bill.giveDiscount')}
          </button>
          {pay.error ? (
            <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
              {pay.error.message}
            </p>
          ) : null}
        </section>
      </main>
      <Outlet />
    </Shell>
  );
}

/** The page's own frame: no top bar and no action bar, the header and the content fill the screen (screens 24 to 27). */
function Shell({ children }: { children?: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}

function LineRow({ line, time, amount }: { line: StatementLine; time: string; amount: string }) {
  const { title, rest } = splitLine(line.text);
  return (
    <li className="flex items-center justify-between gap-3 border-b border-c-line px-1 py-3.5">
      <span className="flex min-w-0 flex-col">
        <span className="text-[19px] font-semibold">{title}</span>
        <span className="text-[15px] text-c-text-2">
          <bdi>{time}</bdi>
          {rest ? `, ${rest}` : ''}
        </span>
      </span>
      <span className="text-[20px] font-semibold">{amount}</span>
    </li>
  );
}
