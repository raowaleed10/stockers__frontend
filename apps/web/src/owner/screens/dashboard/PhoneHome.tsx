import type { Dashboard as DashboardData } from '@stockers/shared';
import { formatAmount } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cx } from '@/ui/cx';
import { StatCard } from '@/ui/StatCard';
import { focusRing } from '@/ui/theme';
import { BarChartWeek } from '../../charts/BarChartWeek';
import { RichText } from '../../components/RichText';
import { noonOf, useOwnerFormat } from '../../use-owner-format';
import { useDashboardFigures, useNeedsLines } from './dashboard-data';

const DOT: Record<'red' | 'amber' | 'grey', string> = {
  red: 'bg-o-red',
  amber: 'bg-sl-pause',
  grey: 'bg-o-ink-2',
};

const LINK = cx(
  'flex min-h-touch-owner items-center text-[16px] font-semibold text-o-green underline',
);

/** A white card of the phone home (screen 53): 16 px padding and 16 px corners. */
function Section({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cx(
        'flex flex-col gap-2.5 rounded-[16px] border border-o-line bg-o-card p-4',
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Screen 53, `/` on a phone: the same data as the dashboard in one column, a dark hero card with today's money, four small
 * numbers, "Needs a look", the last 7 days, the month so far and the biggest debts.
 */
export function PhoneHome({ data }: { data: DashboardData }) {
  const { t } = useTranslation('dashboard');
  const fmt = useOwnerFormat();
  const f = useDashboardFigures(data);
  const needs = useNeedsLines(data.needsLook);
  const { today, month, credit } = data;

  // The last seven days, with the weekday under each bar.
  const week = f.days.slice(-7);
  const weekday = (iso: string) => {
    const text = fmt.weekday(iso);
    return fmt.lang === 'ur' ? text : text.slice(0, 3);
  };
  const bestIndex = Math.max(
    0,
    week.findIndex((day) => noonOf(day.iso).slice(0, 10) === f.best.date),
  );
  const methods = Object.entries(today.onlineByMethod).filter(([, amount]) => amount > 0);
  const methodName = (id: string) =>
    id === 'bank' ? t('hand.bank') : t(`hand.method.${id}` as never, { defaultValue: id });

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h1 className="m-0 text-[24px] font-bold">{t('title', { day: fmt.day(data.at, true) })}</h1>
        <span className="text-[15px] text-o-ink-2">
          <RichText
            ns="dashboard"
            i18nKey="sheetLinePhone"
            values={{ number: data.sheet.number, time: f.opened, updated: f.updated }}
          />
        </span>
      </div>

      <section
        aria-label={t('earned')}
        className="flex flex-col gap-1 rounded-[18px] bg-o-sidebar p-[18px] text-c-text"
      >
        <span className="text-[15px] font-semibold text-c-text-3">{t('earned')}</span>
        <span className="font-num text-[56px] font-bold leading-none">
          {fmt.money(today.earned)}
        </span>
        {/* A hair tighter: this line is 0.2 px wider than the card on a 390 px phone and would wrap its last word. */}
        <span className="text-[15px] tracking-[-0.2px] text-c-text-3">
          {t('earnedNote', {
            frames: today.frames,
            century: today.centuryMinutes,
            rooms: today.rooms,
          })}
        </span>
        <div className="mt-2.5 flex gap-2">
          <Link
            to="/live"
            className={cx(
              'flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-c-raised-2 text-[16px] font-semibold text-c-text no-underline',
              focusRing.owner,
            )}
          >
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-s-play" />
            {t('phone.inUse', { used: today.tablesInUse, total: today.tablesTotal })}
          </Link>
          {today.overLimit > 0 ? (
            <Link
              to="/alerts"
              className={cx(
                'flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-c-raised-2 text-[16px] font-semibold text-c-text no-underline',
                focusRing.owner,
              )}
            >
              <span
                aria-hidden="true"
                className="h-[13px] w-[9px] -rotate-12 rounded-[2px] bg-s-play"
              />
              {t('phone.over', { count: today.overLimit, minutes: today.limitMinutes })}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <StatCard
          theme="owner"
          tabular={false}
          size="sm"
          label={t('phone.received')}
          value={fmt.money(today.received)}
          note={t('phone.receivedNote', {
            cash: formatAmount(today.cashReceived),
            online: formatAmount(today.online),
          })}
        />
        <StatCard
          theme="owner"
          tabular={false}
          size="sm"
          labelTone="amber"
          label={t('phone.credit')}
          value={fmt.money(today.newCredit)}
          note={t('phone.creditNote', { amount: formatAmount(today.oldCreditPaid) })}
        />
        <StatCard
          theme="owner"
          tabular={false}
          size="sm"
          labelTone="green"
          label={t('phone.hand')}
          value={fmt.money(today.moneyInHand)}
          note={t('phone.handNote', { expenses: fmt.money(today.expensesPaidToday) })}
        />
        <StatCard
          theme="owner"
          tabular={false}
          size="sm"
          label={t('phone.online')}
          value={fmt.money(today.online)}
          note={methods
            .map(([id, amount]) => `${methodName(id)} ${formatAmount(amount)}`)
            .join(', ')}
        />
      </section>

      <Section label={t('needs.title')}>
        <h2 className="m-0 text-[18px] font-bold">{t('needs.title')}</h2>
        {needs.length === 0 ? (
          <span className="text-[15px] text-o-ink-2">{t('needs.none')}</span>
        ) : (
          needs.map((line) => (
            <div key={line.key} className="flex items-start gap-2.5 text-[15px] leading-[1.35]">
              <span
                aria-hidden="true"
                className={cx('mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full', DOT[line.tone])}
              />
              <span>{line.text}</span>
            </div>
          ))
        )}
        <Link to="/alerts" className={LINK}>
          {t('needs.all')}
        </Link>
      </Section>

      <Section label={t('phone.daysTitle')}>
        <div className="flex items-baseline justify-between">
          <h2 className="m-0 text-[18px] font-bold">{t('phone.daysTitle')}</h2>
          <span className="text-[14px] text-o-ink-2">{t('phone.daysNote')}</span>
        </div>
        <BarChartWeek
          values={week.map((day) => day.value)}
          weekdays={week.map((day) => weekday(day.iso))}
          tips={f.dayTips.slice(-7)}
          bestIndex={bestIndex}
          openLast={f.open}
          summary={t('phone.daysSummary', {
            day: fmt.weekday(noonOf(f.best.date)),
            best: fmt.money(f.best.earned),
            today: fmt.money(today.earned),
          })}
        />
        <span className="text-[14px] text-o-ink-2">{t('phone.daysOpen')}</span>
      </Section>

      <Section label={t('month.title', { month: fmt.month(month.key), count: month.days })}>
        <h2 className="m-0 text-[18px] font-bold">
          {t('month.title', { month: fmt.month(month.key), count: month.days })}
        </h2>
        {(
          [
            ['earned', month.earned, false],
            ['expenses', month.expenses, true],
            ['canteen', month.canteenCost, true],
          ] as const
        ).map(([id, value, minus]) => (
          <div key={id} className="flex justify-between text-[16px]">
            <span>{t(`month.${id}`)}</span>
            <b>
              {minus ? '− ' : ''}
              {fmt.money(value)}
            </b>
          </div>
        ))}
        <div className="flex items-baseline justify-between border-t border-o-line pt-2.5">
          <span className="text-[17px] font-bold">{t('month.profit')}</span>
          <span className="font-num text-[30px] font-bold text-o-green">
            {fmt.money(month.profit)}
          </span>
        </div>
        <span className="text-[14px] text-o-ink-2">{f.vsText}</span>
      </Section>

      <Section label={t('phone.creditTitle')}>
        <div className="flex items-baseline justify-between">
          <h2 className="m-0 text-[18px] font-bold">{t('phone.creditTitle')}</h2>
          <span className="font-num text-[26px] font-bold">{fmt.money(credit.total)}</span>
        </div>
        <span className="text-[14px] font-semibold text-o-amber-ink">
          {t('phone.creditSub', {
            count: credit.players,
            amount: fmt.money(credit.olderThan15Days.total),
          })}
        </span>
        {f.debts.slice(0, 3).map((debtor) => (
          <div
            key={debtor.playerId}
            className="flex justify-between border-t border-o-divider py-2 text-[16px]"
          >
            <span>
              {debtor.name}{' '}
              <span className={debtor.days > 15 ? 'text-o-amber-ink' : 'text-o-ink-2'}>
                {t('debts.age', { count: debtor.days })}
              </span>
            </span>
            <b>{fmt.money(debtor.balance)}</b>
          </div>
        ))}
        <Link to="/players" className={LINK}>
          {t('phone.creditAll')}
        </Link>
      </Section>
    </>
  );
}
