import {
  barWidth,
  formatChange,
  percentChange,
  toClubIso,
  type Reports as ReportsData,
  type ReportPeriod,
  type ReportsQuery,
} from '@stockers/shared';
import { Download } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { clock } from '@/lib/clock';
import { PHONE_QUERY, useMediaQuery } from '@/ui/use-media';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { cx } from '@/ui/cx';
import { Select } from '@/ui/inputs';
import { Segmented } from '@/ui/Segmented';
import { StatCard } from '@/ui/StatCard';
import { MoneyText } from '@/ui/MoneyText';
import { exportReport } from '../../api/calls';
import { useReports } from '../../api';
import { HBarList } from '../../charts/HBarList';
import { LineChartMonth } from '../../charts/LineChartMonth';
import { YearBars } from '../../charts/YearBars';
import { QueryPage } from '../../components/QueryPage';
import { useDownload } from '../../use-download';
import { noonOf, useOwnerFormat } from '../../use-owner-format';

type Tone = 'green' | 'amber' | 'red';
const TONE: Record<Tone, string> = {
  green: 'text-o-green',
  amber: 'text-o-amber-ink',
  red: 'text-o-red',
};

/** What a change is worth to the owners: more earned is good, more spent is a warning, less earned is bad. */
function toneOf(kind: 'earned' | 'expenses', change: number | null): Tone {
  if (change === null) return 'green';
  if (kind === 'expenses') return change > 0 ? 'amber' : 'green';
  return change < 0 ? 'red' : 'green';
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Screen 37, `/reports`: a month (or a day, or a year) against another. The Day, Month and Year switch and the two lists
 * choose the periods; everything below is worked out from `GET /reports`: four totals, the running total of both periods,
 * by game, by table, the money received by payment method (D24) and the year's bars. A change is `percentChange` of the
 * period compared with. PDF and Excel only ask the server for the file.
 */
export function Reports() {
  const { t } = useTranslation('reports');
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [show, setShow] = useState<string | undefined>();
  const [compare, setCompare] = useState<string | undefined>();
  const query: ReportsQuery = { period, month: show, compare };
  const reports = useReports(query);
  const file = useDownload();
  const showId = useId();
  const compareId = useId();
  const fmt = useOwnerFormat();

  // The names of the periods in the pickers: `September 2026`, `Sat 3 Oct`, `2026`.
  const label = (key: string): string =>
    period === 'year'
      ? key
      : period === 'day'
        ? fmt.day(noonOf(key))
        : `${fmt.month(key)} ${key.slice(0, 4)}`;
  // The shorter name in a column heading and a legend: `September`, `3 Oct`, `2026`.
  const short = (key: string): string =>
    period === 'year' ? key : period === 'day' ? fmt.date(noonOf(key)) : fmt.month(key);

  const data = reports.data;
  const download = (format: 'pdf' | 'xlsx') =>
    void file.download(
      () =>
        exportReport({
          ...query,
          month: data?.month ?? show,
          compare: data?.compare ?? compare,
          format,
        }),
      `report-${data?.month ?? 'report'}.${format}`,
    );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <h1 className="m-0 text-o-h1 font-bold">{t('title')}</h1>
        <div className="flex flex-wrap gap-2.5">
          <Button
            theme="owner"
            icon={<Download size={20} strokeWidth={2} />}
            disabled={file.pending || !data}
            onClick={() => download('pdf')}
          >
            {t('pdf')}
          </Button>
          <Button
            theme="owner"
            icon={<Download size={20} strokeWidth={2} />}
            disabled={file.pending || !data}
            onClick={() => download('xlsx')}
          >
            {t('excel')}
          </Button>
        </div>
      </div>
      {file.failed ? (
        <p role="alert" className="m-0 text-[15px] font-semibold text-o-red">
          {t('downloadFailed')}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-o-line bg-o-card px-3.5 py-3">
        <Segmented<ReportPeriod>
          theme="owner"
          label={t('periodLabel')}
          value={period}
          onChange={(next) => {
            setPeriod(next);
            setShow(undefined);
            setCompare(undefined);
          }}
          options={[
            { value: 'day', label: t('day') },
            { value: 'month', label: t('month') },
            { value: 'year', label: t('year') },
          ]}
        />
        <label htmlFor={showId} className="text-[16px] text-o-ink-2">
          {t('show')}
        </label>
        <div className="w-auto min-w-[150px]">
          <Select
            id={showId}
            theme="owner"
            value={data?.month ?? ''}
            onChange={(event) => {
              setShow(event.target.value);
              setCompare(undefined);
            }}
            className="font-semibold"
          >
            {(data?.periods ?? []).map((key) => (
              <option key={key} value={key}>
                {label(key)}
              </option>
            ))}
          </Select>
        </div>
        <label htmlFor={compareId} className="text-[16px] text-o-ink-2">
          {t('compared')}
        </label>
        <div className="w-auto min-w-[150px]">
          <Select
            id={compareId}
            theme="owner"
            value={data?.compare ?? ''}
            onChange={(event) => setCompare(event.target.value)}
            className="font-semibold"
          >
            {(data?.periods ?? []).map((key) => (
              <option key={key} value={key}>
                {label(key)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <QueryPage query={reports}>{(report) => <Body report={report} short={short} />}</QueryPage>
    </>
  );
}

function Body({ report, short }: { report: ReportsData; short: (key: string) => string }) {
  const fmt = useOwnerFormat();
  // `Sep`, the word at the end of a line in the chart.
  const shortest = (key: string) => (report.period === 'month' ? fmt.month(key, true) : short(key));
  const { t } = useTranslation('reports');
  const { period } = report;
  const phone = useMediaQuery(PHONE_QUERY);

  const earnedChange = percentChange(report.earned[0], report.earned[1]);
  const expensesChange = percentChange(report.expenses[0], report.expenses[1]);
  const profitChange = percentChange(report.profit[0], report.profit[1]);
  const shown = short(report.month);
  const compared = short(report.compare);

  const gameRows = (['frames', 'century', 'rooms', 'canteen'] as const).map((id) => ({
    id,
    pair: report.byGame[id] ?? ([0, 0] as [number, number]),
  }));
  const gameTotal: [number, number] = [
    gameRows.reduce((sum, row) => sum + row.pair[0], 0),
    gameRows.reduce((sum, row) => sum + row.pair[1], 0),
  ];
  const methodTotal: [number, number] = [
    report.byMethod.reduce((sum, row) => sum + row.amounts[0], 0),
    report.byMethod.reduce((sum, row) => sum + row.amounts[1], 0),
  ];
  const topTable = Math.max(0, ...report.byTable.map((row) => row.earned));

  // The race: a month day by day, a year month by month.
  const steps = Math.max(report.race.shown.length, report.race.compared.length);
  const raceName = (index: number) =>
    period === 'year'
      ? fmt.month(`2000-${pad2(index + 1)}`, true)
      : t('race.day', { n: index + 1 });
  const raceLabels =
    period === 'year'
      ? [0, 3, 7, 11].map((i) => raceName(i))
      : [1, 10, 20, steps].map((n) => t('race.day', { n }));
  const shownTotal = report.race.shown.at(-1) ?? 0;
  const comparedTotal = report.race.compared.at(-1) ?? 0;

  // The year's bars: the shown year's 12 months, the open one hatched.
  const yearKey = report.month.slice(0, 4);
  const clubNow = toClubIso(clock.now());
  const openIndex = clubNow.slice(0, 4) === yearKey ? Number(clubNow.slice(5, 7)) - 1 : undefined;
  const yearValues = Array.from(
    { length: 12 },
    (_, i): number | null => report.year[pad2(i + 1)] ?? null,
  );
  const yearTotal = yearValues.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const lastClosed = yearValues.reduce<number>(
    (last, value, i) => (value !== null && i !== openIndex ? i : last),
    0,
  );
  const monthShort = (i: number) => fmt.month(`2000-${pad2(i + 1)}`, true);
  const pickedIndex = period === 'month' ? Number(report.month.slice(5, 7)) - 1 : undefined;

  return (
    <>
      <section aria-label={t('totals')} className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard
          theme="owner"
          tabular={false}
          label={t('earned')}
          value={<MoneyText tabular={false} value={report.earned[0]} />}
          note={<Change kind="earned" change={earnedChange} was={fmt.money(report.earned[1])} />}
        />
        <StatCard
          theme="owner"
          tabular={false}
          label={t('expenses')}
          value={<MoneyText tabular={false} value={report.expenses[0]} />}
          note={
            <Change kind="expenses" change={expensesChange} was={fmt.money(report.expenses[1])} />
          }
        />
        <StatCard
          theme="owner"
          tabular={false}
          tone="solid"
          label={t('profit')}
          value={<MoneyText tabular={false} value={report.profit[0]} />}
          note={
            <>
              <b>
                <Delta value={profitChange} />
              </b>{' '}
              {t('profitNote', { amount: fmt.money(report.profit[1]) })}
            </>
          }
        />
        <StatCard
          theme="owner"
          tabular={false}
          labelTone="amber"
          label={t(`creditEnd.${period}`)}
          value={<MoneyText tabular={false} value={report.creditPendingAtEnd} />}
          note={t('creditNote')}
        />
      </section>

      {steps > 0 ? (
        <Card
          theme="owner"
          padding="lg"
          className="flex flex-col gap-3"
          aria-label={t(`race.${period === 'year' ? 'year' : 'month'}`)}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-[20px] font-bold">
              {t(`race.${period === 'year' ? 'year' : 'month'}`)}
            </h2>
            <div className="flex gap-[18px] text-[15px]">
              <Legend colour="bg-o-chart">{shown}</Legend>
              <Legend colour="bg-o-blue">{compared}</Legend>
            </div>
          </div>
          <LineChartMonth
            shown={report.race.shown}
            compared={report.race.compared}
            tips={(index) => [
              raceName(index),
              `${shown} ${fmt.money(report.race.shown[index] ?? 0)}`,
              `${compared} ${fmt.money(report.race.compared[index] ?? 0)}`,
            ]}
            shownEnd={t('race.shownEnd', {
              name: shortest(report.month),
              amount: fmt.money(shownTotal),
            })}
            comparedEnd={t('race.shownEnd', {
              name: shortest(report.compare),
              amount: fmt.money(comparedTotal),
            })}
            xLabels={raceLabels}
            summary={t('race.summary', {
              shown,
              shownTotal: fmt.money(shownTotal),
              compared,
              comparedTotal: fmt.money(comparedTotal),
            })}
          />
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card
          theme="owner"
          padding="lg"
          className="flex flex-col gap-1"
          aria-label={t('game.title')}
        >
          <h2 className="m-0 mb-2 text-[20px] font-bold">{t('game.title')}</h2>
          <Grid
            head={[t('game.game'), shown, compared, t('game.change')]}
            rows={[
              ...gameRows.map((row) => ({
                key: row.id,
                cells: [
                  t(`game.${row.id}`),
                  fmt.amount(row.pair[0]),
                  fmt.amount(row.pair[1]),
                  <span
                    key="c"
                    className={cx(
                      'font-semibold',
                      TONE[toneOf('earned', percentChange(row.pair[0], row.pair[1]))],
                    )}
                  >
                    <Delta value={percentChange(row.pair[0], row.pair[1])} />
                  </span>,
                ] as ReactNode[],
                strong: 1,
              })),
              {
                key: 'unpriced',
                cells: [t('game.unpriced'), '–', '–', t('game.notPriced')] as ReactNode[],
                muted: true,
              },
            ]}
            total={[
              t('game.total'),
              fmt.amount(gameTotal[0]),
              fmt.amount(gameTotal[1]),
              <span
                key="t"
                className={TONE[toneOf('earned', percentChange(gameTotal[0], gameTotal[1]))]}
              >
                <Delta value={percentChange(gameTotal[0], gameTotal[1])} />
              </span>,
            ]}
          />
        </Card>

        <Card
          theme="owner"
          padding="lg"
          className="flex flex-col gap-2.5"
          aria-label={t('table.title', { period: shown })}
        >
          <h2 className="m-0 mb-1 text-[20px] font-bold">{t('table.title', { period: shown })}</h2>
          <HBarList
            look="table"
            rows={report.byTable.map((row) => ({
              label: fmt.table(row.table),
              value: fmt.amount(row.earned),
              width: barWidth(row.earned, topTable),
            }))}
          />
          <span className="text-[15px] text-o-ink-2">
            {t('table.note')}
            {report.closedTables.map((closed) => (
              <span key={`${closed.table.kind}${closed.table.number}`}>
                {' '}
                {t('table.closed', {
                  table: fmt.table(closed.table),
                  count: closed.days,
                  note: closed.note ?? '',
                })}
              </span>
            ))}
          </span>
        </Card>
      </div>

      <Card
        theme="owner"
        padding="lg"
        className="flex flex-col gap-1"
        aria-label={t('method.title')}
      >
        <h2 className="m-0 mb-2 text-[20px] font-bold">{t('method.title')}</h2>
        <Grid
          head={[t('method.method'), shown, compared, t('game.change')]}
          rows={report.byMethod.map((row) => ({
            key: row.id,
            cells: [
              t(`methods.${row.id}` as never, { defaultValue: row.name }),
              fmt.amount(row.amounts[0]),
              fmt.amount(row.amounts[1]),
              <span
                key="c"
                className={TONE[toneOf('earned', percentChange(row.amounts[0], row.amounts[1]))]}
              >
                <Delta value={percentChange(row.amounts[0], row.amounts[1])} />
              </span>,
            ] as ReactNode[],
            strong: 1,
            dimSecond: true,
          }))}
          total={[
            t('method.total'),
            fmt.amount(methodTotal[0]),
            fmt.amount(methodTotal[1]),
            <Delta key="m" value={percentChange(methodTotal[0], methodTotal[1])} />,
          ]}
        />
        <span className="mt-1.5 text-[15px] text-o-ink-2">{t('method.note')}</span>
      </Card>

      <Card
        theme="owner"
        padding="lg"
        className="flex flex-col gap-3"
        aria-label={t('year2.title', { year: yearKey })}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <h2 className="m-0 text-[20px] font-bold">{t('year2.title', { year: yearKey })}</h2>
          <span className="text-[15px] text-o-ink-2">
            {t('year2.sofar', { amount: fmt.money(yearTotal) })}
          </span>
        </div>
        <YearBars
          values={yearValues}
          pickedIndex={pickedIndex}
          openIndex={
            openIndex !== undefined && yearValues[openIndex] !== null ? openIndex : undefined
          }
          openLabel={t('year2.open')}
          labelled={
            phone
              ? [pickedIndex, openIndex, lastClosed].filter((i): i is number => i !== undefined)
              : undefined
          }
          xLabels={yearValues.map((_, i) => monthShort(i))}
          tips={yearValues.map((value, i) =>
            value === null ? '' : `${fmt.month(`2000-${pad2(i + 1)}`)}, ${fmt.money(value)}`,
          )}
          summary={t('year2.summary', {
            year: yearKey,
            first: fmt.month('2000-01'),
            firstAmount: fmt.money(yearValues[0] ?? 0),
            last: fmt.month(`2000-${pad2(lastClosed + 1)}`),
            lastAmount: fmt.money(yearValues[lastClosed] ?? 0),
          })}
        />
      </Card>
    </>
  );
}

/** `+5.1% vs Rs 735,200`: the change in the colour of what it means, then what it was against. */
function Change({
  kind,
  change,
  was,
}: {
  kind: 'earned' | 'expenses';
  change: number | null;
  was: string;
}) {
  const { t } = useTranslation('reports');
  return (
    <>
      <b className={TONE[toneOf(kind, change)]}>
        <Delta value={change} />
      </b>{' '}
      <span className="text-o-ink-2">{t('vs', { amount: was })}</span>
    </>
  );
}

/** A change against the period before (`+5.1%`). It keeps its own order in Urdu, where a sign beside a number would otherwise jump to the other side. */
function Delta({ value }: { value: number | null }) {
  return <bdi dir="ltr">{formatChange(value)}</bdi>;
}

function Legend({ colour, children }: { colour: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className={cx('h-[3px] w-[22px] rounded-[2px]', colour)} />
      {children}
    </span>
  );
}

interface GridRow {
  key: string;
  cells: ReactNode[];
  /** The index of the column written in bold (the amount of this period). */
  strong?: number;
  muted?: boolean;
  dimSecond?: boolean;
}

const COLS = 'grid grid-cols-[1.6fr_1fr_1fr_0.7fr] gap-2';

/** A table drawn as the designs draw it: a grey heading, light rows, and a bold total. It is a real table for a screen reader. */
function Grid({ head, rows, total }: { head: ReactNode[]; rows: GridRow[]; total: ReactNode[] }) {
  const cell = (index: number) => (index === 0 ? '' : 'text-end');
  return (
    <div role="table" className="flex flex-col">
      <div
        role="row"
        className={cx(COLS, 'border-b border-o-line py-2 text-[14px] font-semibold text-o-ink-2')}
      >
        {head.map((text, index) => (
          <span key={index} role="columnheader" className={cell(index)}>
            {text}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.key}
          role="row"
          className={cx(
            COLS,
            'min-h-[44px] items-center border-b border-o-divider py-2.5 text-[16px] last:border-b-0',
            row.muted && 'text-o-ink-2',
          )}
        >
          {row.cells.map((content, index) => (
            <span
              key={index}
              role="cell"
              className={cx(
                cell(index),
                row.strong === index && 'font-semibold',
                row.dimSecond && index === 2 && 'text-o-ink-2',
              )}
            >
              {content}
            </span>
          ))}
        </div>
      ))}
      <div role="row" className={cx(COLS, 'border-t-2 border-o-line pt-3 text-[17px] font-bold')}>
        {total.map((content, index) => (
          <span key={index} role="cell" className={cell(index)}>
            {content}
          </span>
        ))}
      </div>
    </div>
  );
}
