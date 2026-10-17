import { formatAmount, formatRs, type PaymentMethod } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { usePayCheckout } from '../../api';
import { useCheckoutDraft, type PaymentLine } from '../../checkout/draft';
import { discountRequest } from '../../checkout/request';
import type { PaidNote } from './CheckoutList';

/** What is about to be saved: the money received in each method, what goes on credit, what is kept as advance. */
export interface PaymentPlan {
  parts: PaymentLine[];
  toCredit: number;
  advance: number;
}

/**
 * "Money actions ask once" (D63): Paid in full, Put all on credit and Save payment (a part payment) each open this sheet
 * before anything is saved. It says the amount and the method in a sentence, for example "Rs 1,000 paid: Cash 600,
 * Easypaisa 400, Rs 300 to credit?", with a big Yes and a big No. Yes saves the payment with the worker's name and goes back
 * to the list with the green note; the cream Undo toast then offers to take it back for 2 minutes. No (or Escape) closes the
 * sheet and nothing is saved. `docs/NO_DESIGN.md` §39.
 */
export function ConfirmPayment({
  playerId,
  name,
  plan,
  methods,
  onClose,
}: {
  playerId: string;
  name: string;
  plan: PaymentPlan | null;
  methods: PaymentMethod[];
  onClose: () => void;
}) {
  const { t } = useTranslation('checkout');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const pay = usePayCheckout();
  const draft = useCheckoutDraft();

  if (!plan) return null;

  const money = (value: number) => formatRs(value, lang);
  const paid = plan.parts.reduce((sum, part) => sum + part.amount, 0);
  const methodName = (id: string) =>
    t(`methods.${id}` as never, { defaultValue: methods.find((m) => m.id === id)?.name ?? id });

  const how = plan.parts
    .filter((part) => part.amount > 0)
    .map((part) => `${methodName(part.method)} ${formatAmount(part.amount)}`)
    .join(t('comma'));
  const rest = `${plan.toCredit > 0 ? t('confirm.toCredit', { amount: money(plan.toCredit) }) : ''}${
    plan.advance > 0 ? t('confirm.advance', { amount: money(plan.advance) }) : ''
  }`;
  const title =
    paid > 0
      ? t('confirm.full', { amount: money(paid), how, rest })
      : plan.toCredit > 0
        ? t('confirm.allCredit', { amount: money(plan.toCredit), name })
        : t('confirm.nothing', { name });

  const yes = () =>
    pay.mutate(
      {
        playerId,
        request: {
          playerId,
          parts: plan.parts.filter((part) => part.amount > 0),
          toCredit: plan.toCredit,
          ...(draft.discount ? { discount: discountRequest(draft.discount) } : {}),
        },
      },
      {
        onSuccess: (result) => {
          draft.reset();
          const note: PaidNote = {
            name,
            paid,
            toCredit: result.settlement.toCredit,
            advance: result.settlement.advance,
          };
          navigate('/checkout', { state: { paid: note } });
        },
      },
    );

  return (
    <CounterDialog
      width={760}
      titleSize={30}
      title={title}
      subtitle={t('confirm.sub', { name })}
      showClose={false}
      onClose={onClose}
      actions={
        <>
          <Button
            theme="counter"
            size="counter-main"
            className="min-h-[76px] min-w-[200px] flex-1 text-[24px]"
            disabled={pay.isPending}
            onClick={onClose}
          >
            {t('confirm.no')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="min-h-[76px] min-w-[200px] flex-1 text-[24px]"
            disabled={pay.isPending}
            onClick={yes}
          >
            {t('confirm.yes')}
          </Button>
        </>
      }
    >
      {pay.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {pay.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
