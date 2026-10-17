import { formatRs, type PaymentMethod } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useToday } from '../../api';
import { PageHeader } from '../../components/PageHeader';
import { RichText } from '../../components/RichText';

/** The online methods to list: the ones that are on, then any other that took money tonight, in the owners' order. */
function onlineMethods(methods: PaymentMethod[], online: Record<string, number>): string[] {
  const ids = methods.filter((method) => method.id !== 'cash').map((method) => method.id);
  return [...ids, ...Object.keys(online).filter((id) => id !== 'cash' && !ids.includes(id))];
}

/**
 * Screen 31, `/today`: "Today's totals". The big green card says how much cash should be in the drawer (cash received minus
 * what the workers took out for expenses, D53), beside the online money by method; then the total received, the frames,
 * the Century minutes, what was put on credit and what old credit came back, who is still waiting to pay, and the
 * drawer expenses of the night. No profit: that is for the owners.
 */
export function Today() {
  const { t } = useTranslation('today');
  const { t: tCheckout } = useTranslation('checkout');
  const { lang, clock } = useFormat();
  const navigate = useNavigate();
  const today = useToday();
  const money = (value: number) => formatRs(value, lang);

  const data = today.data;
  const methodName = (id: string) =>
    tCheckout(`methods.${id}` as never, {
      defaultValue: data?.methods.find((method) => method.id === id)?.name ?? id,
    });

  const last = data?.lastDrawerExpense;
  const cardBase = 'flex flex-col gap-1 rounded-[18px] border px-5 py-[18px]';
  const small = 'text-[16px]';
  const number = 'font-num text-[44px] font-bold leading-[1.2]';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        back={t('back')}
        onBack={() => navigate('/')}
        title={t('title')}
        subtitle={
          data ? (
            <RichText
              ns="today"
              i18nKey="sub"
              values={{ number: data.sheet.number, time: clock(data.sheet.openedAt) }}
            />
          ) : undefined
        }
      />
      <main className="flex flex-1 flex-col gap-[18px] px-6 pb-6 pt-[22px]">
        {today.isError ? (
          <p role="alert" className="m-0 text-[18px] text-c-danger-ink">
            {t('loadFailed')}
          </p>
        ) : null}
        {data ? (
          <>
            <section aria-label={t('moneyLabel')} className="flex flex-wrap gap-3.5">
              <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-1.5 rounded-[22px] bg-c-felt px-[26px] py-6">
                <span className="text-[19px] font-semibold">{t('cash.title')}</span>
                <span className="font-num text-[88px] font-bold leading-[0.95]">
                  {money(data.drawerExpected)}
                </span>
                <span className="text-[17px] text-c-on-felt">
                  {data.drawerExpenses > 0
                    ? t('cash.text', {
                        received: money(data.cashReceived),
                        expenses: money(data.drawerExpenses),
                      })
                    : t('cash.textNone', { received: money(data.cashReceived) })}
                </span>
              </div>
              <ul className="m-0 grid min-w-0 flex-[1_1_280px] list-none grid-cols-1 gap-2.5 p-0">
                {onlineMethods(data.methods, data.online).map((id) => (
                  <li
                    key={id}
                    className="flex items-baseline justify-between rounded-[16px] border border-c-line bg-c-panel px-5 py-3.5"
                  >
                    <span className="text-[18px] font-semibold">{methodName(id)}</span>
                    <span className="font-num text-[32px] font-semibold">
                      {money(data.online[id] ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-wrap items-baseline justify-between gap-3 rounded-[16px] border border-c-line bg-c-panel px-[22px] py-4">
              <span className="text-[20px] font-bold">{t('total')}</span>
              <span className="font-num text-[44px] font-bold">{money(data.received)}</span>
            </div>

            <section aria-label={t('activityLabel')} className="grid grid-cols-4 gap-3">
              <div className={cx(cardBase, 'border-c-line bg-c-panel')}>
                <span className={cx(small, 'text-c-text-2')}>{t('frames')}</span>
                <span className={number}>{data.frames}</span>
                <span className="text-[15px] text-c-text-2">
                  {t('doubles', { count: data.doubles })}
                </span>
              </div>
              <div className={cx(cardBase, 'border-c-line bg-c-panel')}>
                <span className={cx(small, 'text-c-text-2')}>{t('century')}</span>
                <span className={number}>{data.centuryMinutes}</span>
                <span className="text-[15px] text-c-text-2">
                  {t('centuryGames', { count: data.centuryGames })}
                </span>
              </div>
              <div className={cx(cardBase, 'border-c-warn-line bg-c-warn-bg')}>
                <span className={cx(small, 'text-c-warn-ink')}>{t('credit')}</span>
                <span className={number}>{money(data.newCredit)}</span>
                <span className="text-[15px] text-c-text-3">
                  {t('players', { count: data.newCreditPlayers })}
                </span>
              </div>
              <div className={cx(cardBase, 'border-c-ok-line bg-c-ok-bg')}>
                <span className={cx(small, 'text-c-ok-ink')}>{t('oldCredit')}</span>
                <span className={number}>{money(data.oldCreditPaid)}</span>
                <span className="text-[15px] text-c-text-3">
                  {t('players', { count: data.oldCreditPlayers })}
                </span>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3.5 rounded-[16px] border border-c-line bg-c-panel px-[22px] py-4">
              <span className="min-w-0 flex-[1_1_360px] text-[18px]">
                {data.waiting.count > 0 ? (
                  <RichText
                    ns="today"
                    i18nKey="waiting"
                    values={{ count: data.waiting.count, amount: money(data.waiting.total) }}
                  />
                ) : (
                  t('waitingNone')
                )}
              </span>
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className={cx(
                  'inline-flex min-h-[60px] items-center rounded-[14px] bg-c-brass px-[26px] text-[19px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press',
                  focusRing.counter,
                )}
              >
                {t('checkout')}
              </button>
            </div>

            <p className="m-0 text-[15px] text-c-text-2">
              {last ? (
                <RichText
                  ns="today"
                  i18nKey={data.drawerExpenses > last.amount ? 'expensesMore' : 'expenses'}
                  values={{
                    amount: money(data.drawerExpenses),
                    what: last.what,
                    who: last.doneBy.name,
                    time: clock(last.at),
                  }}
                />
              ) : (
                t('expensesNone')
              )}
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
