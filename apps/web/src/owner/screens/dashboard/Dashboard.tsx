import type { Dashboard as DashboardData } from '@stockers/shared';
import { Bell, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { cx } from '@/ui/cx';
import { MoneyText } from '@/ui/MoneyText';
import { StatCard } from '@/ui/StatCard';
import { focusRing } from '@/ui/theme';
import { exportSheet } from '../../api/calls';
import { BarChartDays } from '../../charts/BarChartDays';
import { BusyHours } from '../../charts/BusyHours';
import { HBarList } from '../../charts/HBarList';
import { RichText } from '../../components/RichText';
import { useDownload } from '../../use-download';
import { useOwnerFormat } from '../../use-owner-format';
import { useDashboardFigures, useNeedsLines } from './dashboard-data';

const DOT: Record<'red' | 'amber' | 'grey', string> = {
  red: 'bg-o-red',
  amber: 'bg-sl-pause',
  grey: 'bg-o-ink-2',
};

// The link is 44 px tall to press, drawn where the design draws a plain line of text: its extra height overlaps the space around it.
const LINK =
  'mt-[-6.4px] -mb-[12.4px] flex min-h-touch-owner items-center self-start text-[16px] font-semibold text-o-green underline';

/**
 * Screen 36, `/` on a computer: today's money, the month so far, credit, earned per day, where the month's money came from,
 * the busy hours, the biggest debts, the top players and "Needs a look". Everything comes from `GET /dashboard`; the screen
 * writes the words and the percentages, it does no money maths of its own.
 */
export function Dashboard({ data }: { data: DashboardData }) {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation();
  const { t: tShell } = useTranslation('shell');
  const fmt = useOwnerFormat();
  const f = useDashboardFigures(data);
  const needs = useNeedsLines(data.needsLook);
  const file = useDownload();
  const { today, month, credit } = data;

  const methods = Object.entries(today.onlineByMethod).filter(([, amount]) => amount > 0);
  const methodName = (id: string) =>
    id === 'bank' ? t('hand.bank') : t(`hand.method.${id}` as never, { defaultValue: id });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-o-h1 font-bold">{t('title', { day: fmt.day(data.at, true) })}</h1>
          <span className="text-[17px] text-o-ink-2">
            <RichText
              ns="dashboard"
              i18nKey="sheetLine"
              values={{ number: data.sheet.number, time: f.opened, updated: f.updated }}
            />
          </span>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/alerts"
            aria-label={
              data.unread > 0 ? tShell('bell', { count: data.unread }) : tc('notifications')
            }
            className={cx(
              'relative flex h-12 w-12 items-center justify-center rounded-[12px] border border-o-line bg-o-card text-o-ink',
              focusRing.owner,
            )}
          >
            <Bell aria-hidden="true" size={22} strokeWidth={2} />
            {data.unread > 0 ? (
              <span
                aria-hidden="true"
                className="absolute end-[5px] top-[5px] h-2.5 w-2.5 rounded-full bg-o-red"
              />
            ) : null}
          </Link>
          <Button
            theme="owner"
            icon={<Download size={20} strokeWidth={2} />}
            disabled={file.pending}
            onClick={() =>
              void file.download(
                () => exportSheet(data.sheet.id, 'pdf'),
                `sheet-${data.sheet.number}.pdf`,
              )
            }
          >
            {t('download')}
          </Button>
        </div>
      </div>
      {file.failed ? (
        <p role="alert" className="m-0 text-[15px] font-semibold text-o-red">
          {t('downloadFailed')}
        </p>
      ) : null}

      <section aria-label={t('earned')} className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard
          theme="owner"
          tabular={false}
          size="lg"
          tone="solid"
          label={t('earned')}
          value={<MoneyText tabular={false} value={today.earned} />}
          note={t('earnedNote', {
            frames: today.frames,
            century: today.centuryMinutes,
            rooms: today.rooms,
          })}
        />
        <StatCard
          theme="owner"
          tabular={false}
          size="lg"
          label={t('received')}
          value={<MoneyText tabular={false} value={today.received} />}
          note={t('receivedNote', {
            cash: fmt.money(today.cashReceived),
            online: fmt.money(today.online),
          })}
        />
        <StatCard
          theme="owner"
          tabular={false}
          size="lg"
          labelTone="amber"
          label={t('credit')}
          value={<MoneyText tabular={false} value={today.newCredit} />}
          note={t('creditNote', { amount: fmt.money(today.oldCreditPaid) })}
        />
        <StatCard
          theme="owner"
          tabular={false}
          size="lg"
          label={t('inUse')}
          value={t('inUseValue', { used: today.tablesInUse, total: today.tablesTotal })}
          note={
            today.overLimit > 0 ? (
              <span className="font-semibold text-o-red">
                {t('over', { count: today.overLimit, minutes: today.limitMinutes })}
              </span>
            ) : undefined
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <Card theme="owner" className="flex flex-col gap-2.5">
          <h2 className="m-0 text-[17px] font-bold">
            {t('month.title', { month: fmt.month(month.key), count: month.days })}
          </h2>
          {(
            [
              ['earned', month.earned, false],
              ['expenses', month.expenses, true],
              ['canteen', month.canteenCost, true],
            ] as const
          ).map(([id, value, minus]) => (
            <div key={id} className="flex justify-between text-[17px]">
              <span className="text-o-ink-2">{t(`month.${id}`)}</span>
              <span className="font-semibold">
                {minus ? '− ' : ''}
                {fmt.money(value)}
              </span>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-t border-o-line pt-2">
            <span className="text-[17px] font-bold">{t('month.profit')}</span>
            <span className="font-num text-[34px] font-bold text-o-green">
              {fmt.money(month.profit)}
            </span>
          </div>
          <span className="text-[15px] text-o-ink-2">{f.vsText}</span>
        </Card>

        <Card theme="owner" className="flex flex-col gap-2.5">
          <h2 className="m-0 text-[17px] font-bold">{t('creditCard.title')}</h2>
          <span className="font-num text-[42px] font-bold leading-none">
            <MoneyText tabular={false} value={credit.total} />
          </span>
          <span className="text-[16px] text-o-ink-2">
            {t('creditCard.owe', { count: credit.players })}
          </span>
          <div className="flex items-center justify-between gap-2 rounded-[12px] bg-o-amber-tint px-3 py-2.5 text-[16px]">
            <span className="font-semibold text-o-amber-ink">{t('creditCard.old')}</span>
            <span className="font-bold">
              {t('creditCard.oldValue', {
                amount: fmt.money(credit.olderThan15Days.total),
                count: credit.olderThan15Days.players,
              })}
            </span>
          </div>
        </Card>

        <Card theme="owner" className="flex flex-col gap-2.5">
          <h2 className="m-0 text-[17px] font-bold">{t('hand.title')}</h2>
          <span className="font-num text-[42px] font-bold leading-none">
            <MoneyText tabular={false} value={today.moneyInHand} />
          </span>
          <span className="text-[16px] text-o-ink-2">
            {t('hand.note', {
              received: fmt.money(today.received),
              expenses: fmt.money(today.expensesPaidToday),
            })}
          </span>
          <div className="flex flex-wrap gap-2 text-[15px]">
            {methods.map(([id, amount]) => (
              <span key={id} className="rounded-[8px] bg-o-page px-2.5 py-1.5">
                {t('hand.chip', { name: methodName(id), amount: fmt.money(amount) })}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <Card theme="owner" padding="lg" className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <h2 className="m-0 text-[20px] font-bold">{t('days.title')}</h2>
          <span className="text-[15px] text-o-ink-2">
            {t('days.note', { day: f.bestDay, amount: fmt.money(f.best.earned) })}
          </span>
        </div>
        <BarChartDays
          values={f.values}
          tips={f.dayTips}
          openLast={f.open}
          xLabels={[
            ...[0, 7, 14, 21].map((i) => fmt.date(f.days[i]?.iso ?? data.at)),
            f.open ? t('days.today') : fmt.date(f.days.at(-1)?.iso ?? data.at),
          ]}
          summary={t('days.summary', { from: f.from, to: f.to, min: f.min, max: f.max })}
        />
      </Card>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <Card theme="owner" padding="lg" className="flex flex-col gap-3.5">
          <h2 className="m-0 text-[20px] font-bold">
            {t('share.title', { month: fmt.month(month.key) })}
          </h2>
          <HBarList
            look="share"
            rows={f.gameRows.map((row) => ({
              label: t(`share.${row.id}`),
              value: fmt.money(row.value),
              note: `${row.pct}%`,
              width: row.pct,
            }))}
          />
          <span className="text-[15px] text-o-ink-2">
            {t('share.note', { profit: fmt.money(f.canteenProfit) })}
          </span>
        </Card>

        <Card theme="owner" padding="lg" className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-[20px] font-bold">{t('busy.title')}</h2>
            <span className="text-[15px] text-o-ink-2">{t('busy.note')}</span>
          </div>
          <BusyHours
            values={f.hourValues}
            tips={f.hourTips}
            max={data.today.tablesTotal}
            xLabels={f.busyLabels}
            summary={t('busy.summary', {
              n: f.peak,
              total: data.today.tablesTotal,
              hour: f.peakLabel,
            })}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <Card theme="owner" padding="lg" className="flex flex-col gap-1.5">
          <h2 className="m-0 mb-1.5 text-[20px] font-bold">{t('debts.title')}</h2>
          {f.debts.slice(0, 4).map((debtor) => (
            <div
              key={debtor.playerId}
              className="flex justify-between border-b border-o-divider py-2 text-[16px]"
            >
              <span>
                {debtor.name}{' '}
                <span className={debtor.days > 15 ? 'text-o-amber-ink' : 'text-o-ink-2'}>
                  {t('debts.age', { count: debtor.days })}
                </span>
              </span>
              <span className="font-bold">{fmt.money(debtor.balance)}</span>
            </div>
          ))}
          <Link to="/players" className={LINK}>
            {t('debts.all', { count: credit.players })}
          </Link>
        </Card>

        <Card theme="owner" padding="lg" className="flex flex-col gap-1.5">
          <h2 className="m-0 mb-1.5 text-[20px] font-bold">{t('top.title')}</h2>
          {data.topPlayers.slice(0, 4).map((player) => (
            <div
              key={player.playerId}
              className="flex justify-between border-b border-o-divider py-2 text-[16px]"
            >
              <span>
                {player.name}{' '}
                <span className="text-o-ink-2">{t('top.visits', { count: player.visits })}</span>
              </span>
              <span className="font-bold">{fmt.money(player.spent)}</span>
            </div>
          ))}
          <Link to="/reports" className={LINK}>
            {t('top.open')}
          </Link>
        </Card>

        <Card
          theme="owner"
          padding="lg"
          aria-label={t('needs.title')}
          className="flex flex-col gap-2"
        >
          <h2 className="m-0 mb-1.5 text-[20px] font-bold">{t('needs.title')}</h2>
          {needs.length === 0 ? (
            <span className="text-[16px] text-o-ink-2">{t('needs.none')}</span>
          ) : (
            needs.map((line) => (
              <div key={line.key} className="flex items-start gap-2.5 text-[16px]">
                <span
                  aria-hidden="true"
                  className={cx('mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full', DOT[line.tone])}
                />
                <span>{line.text}</span>
              </div>
            ))
          )}
          <Link to="/activity" className={LINK}>
            {t('needs.open')}
          </Link>
        </Card>
      </div>
    </>
  );
}
