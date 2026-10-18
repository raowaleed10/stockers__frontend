import { dayAge, hourLabel, share, type Dashboard, type NeedsLook } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { noonOf, useOwnerFormat } from '../../use-owner-format';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The words of one line of "Needs a look", made from its data. The dot's colour is its tone. */
export interface NeedsLine {
  key: string;
  tone: NeedsLook['tone'];
  text: string;
}

/** "Needs a look" as the screens write it (36, 53): each line is made here from its data, never from a stored sentence. */
export function useNeedsLines(items: NeedsLook[]): NeedsLine[] {
  const { t } = useTranslation('dashboard');
  const fmt = useOwnerFormat();
  return items.map((item): NeedsLine => {
    switch (item.kind) {
      case 'double':
        return {
          key: item.kind,
          tone: item.tone,
          text: t('needs.double', {
            count: item.count,
            table: fmt.table(item.table),
            minutes: item.minutes,
          }),
        };
      case 'discounts':
        return {
          key: item.kind,
          tone: item.tone,
          text: t('needs.discounts', { count: item.count, total: fmt.money(item.total) }),
        };
      case 'stock': {
        const parts = item.low.map((one) => t('needs.low', { name: one.name, left: one.left }));
        if (item.soldOut.length > 0) {
          parts.push(t('needs.soldOut', { names: item.soldOut.join(', ') }));
        }
        return { key: item.kind, tone: item.tone, text: parts.join(' ') };
      }
      case 'discard':
        return {
          key: item.kind,
          tone: item.tone,
          text:
            t('needs.discard', { count: item.count, table: fmt.table(item.table) }) +
            (item.reason ? t(`needs.reason.${item.reason}`) : ''),
        };
    }
  });
}

/** What both the dashboard and the phone home work out from `GET /dashboard`. */
export function useDashboardFigures(data: Dashboard) {
  const fmt = useOwnerFormat();
  const { t } = useTranslation('dashboard');

  // The 30 days: the first is `earnedPerDay.from`, the last is today.
  const days = data.earnedPerDay.values.map((value, index) => {
    const iso = noonOf(
      new Date(Date.parse(noonOf(data.earnedPerDay.from)) + index * DAY_MS).toISOString(),
    );
    return { iso, value };
  });
  const lastIndex = days.length - 1;
  const open = data.earnedPerDay.todayOpen;
  const dayTips = days.map((day, index) =>
    open && index === lastIndex
      ? t('days.todayTip', { amount: fmt.money(day.value) })
      : t('days.tip', { day: fmt.day(day.iso), amount: fmt.money(day.value) }),
  );
  const values = days.map((day) => day.value);
  const best = data.earnedPerDay.best;

  const total = data.month.earned;
  const byGame = data.month.byGame;
  const gameRows = (['frames', 'century', 'rooms', 'canteen'] as const).map((id) => ({
    id,
    value: byGame[id] ?? 0,
    pct: share(byGame[id] ?? 0, total),
  }));
  const canteenProfit = (byGame.canteen ?? 0) - data.month.canteenCost;

  // The change against the same days of the month before ("22% more than the first 3 days of September").
  const monthKey = data.month.key;
  const previousKey = (() => {
    const [year, month] = monthKey.split('-').map(Number);
    return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
  })();
  const vs = data.month.vsLastMonthPct;
  const vsText = t(vs > 0 ? 'month.more' : vs < 0 ? 'month.less' : 'month.same', {
    pct: Math.abs(vs),
    days: data.month.days,
    previous: fmt.month(previousKey),
  });

  // Busy hours run from 12 PM to 4 AM: the club's day starts at noon, so 12 comes first and 0 to 4 last.
  const hours = Object.keys(data.busyHours)
    .map(Number)
    .sort((a, b) => ((a + 12) % 24) - ((b + 12) % 24));
  const hourValues = hours.map((h) => data.busyHours[String(h)] ?? 0);
  const peak = Math.max(0, ...hourValues);
  const peakHour = hours[hourValues.indexOf(peak)] ?? 0;
  const round1 = (n: number) => String(Math.round(n * 10) / 10);
  const hourTips = hours.map((h, i) =>
    t('busy.tip', { hour: hourLabel(h, fmt.lang), n: round1(hourValues[i]) }),
  );
  const hourAt = (index: number) =>
    hourLabel(hours[Math.min(index, hours.length - 1)] ?? 0, fmt.lang);
  const busyLabels = [
    hourAt(0),
    hourAt(4),
    hourAt(8),
    t('busy.peak', { hour: hourLabel(peakHour, fmt.lang), n: round1(peak) }),
    hourAt(hours.length - 1),
  ];

  const nowMs = Date.parse(data.at);
  const debts = data.topDebtors.map((debtor) => ({
    ...debtor,
    days: debtor.oldestUnpaidAt ? dayAge(nowMs, debtor.oldestUnpaidAt) : 0,
  }));

  return {
    days,
    values,
    dayTips,
    open,
    best,
    bestDay: fmt.day(noonOf(best.date)),
    from: fmt.longDate(days[0]?.iso ?? data.earnedPerDay.from),
    to: fmt.longDate(days[lastIndex]?.iso ?? data.earnedPerDay.from),
    min: fmt.money(Math.min(...values)),
    max: fmt.money(Math.max(...values)),
    gameRows,
    canteenProfit,
    vsText,
    hours,
    hourValues,
    hourTips,
    busyLabels,
    peak: round1(peak),
    peakLabel: hourLabel(peakHour, fmt.lang),
    debts,
    updated: fmt.clock(data.at),
    opened: fmt.clock(data.sheet.openedAt),
  };
}
