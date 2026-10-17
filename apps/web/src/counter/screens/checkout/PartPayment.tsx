import { formatRs, paymentPreview, type PaymentMethod } from '@stockers/shared';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { IconButton } from '@/ui/IconButton';
import { Keypad } from '@/ui/Keypad';
import { focusRing } from '@/ui/theme';
import { useCheckoutBill } from '../../api';
import { useCheckoutDraft } from '../../checkout/draft';
import { PageHeader } from '../../components/PageHeader';
import { ConfirmPayment, type PaymentPlan } from './ConfirmPayment';

/**
 * Screen 26, `/checkout/:playerId/part`: "Bilal Ahmed pays part". The money received now as one line for each method (cash
 * and Easypaisa), a keypad that types into the line that is selected, and three boxes: the total (after any discount),
 * what is paid now, and what stays as credit. If he gives more than the total the extra is kept as advance (D26).
 * "Save payment" asks once (`ConfirmPayment`, D63), then sends the lines, the credit and the discount together, with the
 * worker's name.
 */
export function PartPayment() {
  const { playerId = '' } = useParams<{ playerId: string }>();
  const { t } = useTranslation('checkout');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const bill = useCheckoutBill(playerId);
  const draft = useCheckoutDraft();
  const [asking, setAsking] = useState<PaymentPlan | null>(null);

  const methods = bill.data?.methods ?? [];
  useEffect(() => {
    draft.begin(playerId);
    if (methods.length > 0) draft.startLines(draft.method ?? methods[0].id);
    // The lines start once, when the bill's methods are known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, methods.length]);

  if (bill.isError) return <Navigate to="/checkout" replace />;
  if (!bill.data) return <div className="flex-1" />;

  const data = bill.data;
  const money = (value: number) => formatRs(value, lang);
  const nameOf = (id: string) =>
    t(`methods.${id}` as never, { defaultValue: methods.find((m) => m.id === id)?.name ?? id });

  const discount = draft.discount?.amount ?? 0;
  const total = Math.max(0, data.total - discount);
  const parts = draft.lines.filter((line) => line.amount > 0);
  const preview = paymentPreview(total, parts);
  const typing = draft.typing;
  const spare: PaymentMethod[] = methods.filter((m) => !draft.lines.some((l) => l.method === m.id));

  const subtitle = draft.discount
    ? t('part.subtitle', {
        total: money(total),
        discount: money(discount),
        reason: t(`discount.reasons.${draft.discount.reason}`),
      })
    : t('part.subtitlePlain', { total: money(total) });

  const save = () => {
    if (parts.length === 0) return;
    setAsking({ parts, toCredit: preview.toCredit, advance: preview.advance });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        back={t('part.back')}
        onBack={() => navigate(`/checkout/${playerId}`)}
        title={t('part.title', { name: data.player.name })}
        subtitle={subtitle}
      />
      <main className="flex flex-1 flex-wrap items-start gap-5 px-6 pb-6 pt-5">
        <section
          aria-label={t('part.payments')}
          className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5"
        >
          <div className="flex flex-col gap-3 rounded-[22px] border border-c-line bg-c-panel px-[22px] py-5">
            <h2 className="m-0 text-[20px] font-bold">{t('part.received')}</h2>
            {draft.lines.map((line) => {
              const selected = typing === line.method;
              return (
                <div
                  key={line.method}
                  className={cx(
                    'flex items-center gap-3.5 rounded-[16px] px-[18px]',
                    selected
                      ? 'min-h-[80px] border-2 border-c-brass bg-c-selected'
                      : 'min-h-[78px] border border-c-line-2 bg-c-raised',
                  )}
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={t('part.typeInto', { method: nameOf(line.method) })}
                    onClick={() => draft.select(line.method)}
                    className={cx(
                      'flex min-h-[72px] min-w-0 flex-1 items-center gap-3.5 bg-transparent text-start text-c-text',
                      focusRing.counter,
                    )}
                  >
                    <span className="flex-1 text-[21px] font-semibold">{nameOf(line.method)}</span>
                    <span className="font-num text-[40px] font-semibold">{money(line.amount)}</span>
                  </button>
                  <IconButton
                    theme="counter"
                    variant="ghost"
                    drawn={52}
                    label={t('part.remove', { method: nameOf(line.method) })}
                    icon={<X size={20} strokeWidth={2.2} />}
                    onClick={() => draft.removeLine(line.method)}
                  />
                </div>
              );
            })}
            {spare.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                <span className="self-center text-[16px] text-c-text-2">
                  {t('part.addAnother')}
                </span>
                {spare.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => draft.addLine(method.id)}
                    className={cx(
                      'min-h-touch rounded-[12px] border border-dashed border-c-line-3 bg-transparent px-[18px] text-[17px] text-c-text active:bg-c-raised',
                      focusRing.counter,
                    )}
                  >
                    {t('part.add', { method: nameOf(method.id) })}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Box label={t('part.total')} value={money(total)} />
            <Box label={t('part.paidNow')} value={money(preview.paid)} tone="ok" />
            {preview.advance > 0 ? (
              <Box label={t('part.advance')} value={money(preview.advance)} tone="ok" />
            ) : (
              <Box label={t('part.credit')} value={money(preview.toCredit)} tone="warn" />
            )}
          </div>
          <p className="m-0 text-[16px] text-c-text-2">{t('part.note')}</p>
        </section>

        <section
          aria-label={t('part.keypad')}
          // The designs' 380 px is the content width, so the panel is 422 px with its padding (box-content).
          className="box-content flex min-w-0 flex-[1_1_380px] flex-col gap-3 rounded-[22px] border border-c-line bg-c-panel p-5"
        >
          <span className="text-[17px] text-c-text-2">
            {typing ? t('part.typing', { method: nameOf(typing) }) : t('part.pick')}
          </span>
          <Keypad keys="amount" onDigit={draft.digit} onDelete={draft.deleteDigit} />
          <button
            type="button"
            disabled={parts.length === 0}
            onClick={save}
            className={cx(
              'mt-1.5 flex min-h-[80px] flex-col items-center justify-center rounded-[16px] bg-c-brass text-[21px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press disabled:opacity-40',
              focusRing.counter,
            )}
          >
            {t('part.save')}
            <span className="text-[16px] font-medium">
              {preview.toCredit > 0
                ? t('part.goesToCredit', { amount: money(preview.toCredit) })
                : preview.advance > 0
                  ? t('part.keptAdvance', { amount: money(preview.advance) })
                  : t('part.paidInFull')}
            </span>
          </button>
        </section>
      </main>
      <ConfirmPayment
        playerId={playerId}
        name={data.player.name}
        plan={asking}
        methods={methods}
        onClose={() => setAsking(null)}
      />
    </div>
  );
}

function Box({
  label,
  value,
  tone = 'plain',
}: {
  label: string;
  value: string;
  tone?: 'plain' | 'ok' | 'warn';
}) {
  const look = {
    plain: ['border-c-line bg-c-panel', 'text-c-text-2'],
    ok: ['border-c-ok-line bg-c-ok-bg', 'text-c-ok-ink'],
    warn: ['border-c-warn-line bg-c-warn-bg', 'text-c-warn-ink'],
  }[tone];
  return (
    <div className={cx('flex flex-col gap-1 rounded-[18px] border px-5 py-[18px]', look[0])}>
      <span className={cx('text-[16px]', look[1])}>{label}</span>
      <span className="font-num text-[40px] font-bold leading-[1.2]">{value}</span>
    </div>
  );
}
