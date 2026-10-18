import { compactMoney } from '@stockers/shared';
import { useId } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTip, type TipRow } from './ChartTip';

export interface BarChartWeekProps {
  /** The last 7 days, the oldest first. */
  values: number[];
  /** The weekday under each bar (`Sun` … `Sat`). */
  weekdays: string[];
  tips: string[];
  /** The best day and the open day carry their amount above the bar. */
  bestIndex: number;
  /** The last bar is today and is still open: light green with stripes. */
  openLast?: boolean;
  summary: string;
  height?: number;
  className?: string;
}

/** Earned per day, last 7 days (screen 53): seven thick bars, the best day and today labelled, today hatched. */
export function BarChartWeek({
  values,
  weekdays,
  tips,
  bestIndex,
  openLast = false,
  summary,
  height = 144,
  className,
}: BarChartWeekProps) {
  const hatch = `hatch-${useId().replace(/:/g, '')}`;
  const lastIndex = values.length - 1;
  const rows = values.map(
    (value, index): { value: number; day: string; text: string } & TipRow => ({
      value,
      day: weekdays[index] ?? '',
      text: index === bestIndex || (openLast && index === lastIndex) ? compactMoney(value) : '',
      tip: [tips[index] ?? ''],
    }),
  );

  return (
    // The plot keeps one order in both languages (earliest on the left), so a label always sits under its bar.
    <div dir="ltr" role="img" aria-label={summary} className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 16, right: 6, bottom: 0, left: 6 }} barCategoryGap={6}>
          <defs>
            <pattern
              id={hatch}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill="var(--o-green-tint)" />
              <rect width="2.5" height="6" fill="var(--o-chart)" />
            </pattern>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 13, fill: 'var(--o-ink-2)' }}
            interval={0}
          />
          <YAxis hide domain={[0, 'dataMax']} />
          <ReferenceLine y={0} stroke="var(--o-line-2)" />
          <Tooltip content={<ChartTip />} cursor={false} isAnimationActive={false} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((_, index) => (
              <Cell
                key={index}
                fill={openLast && index === lastIndex ? `url(#${hatch})` : 'var(--o-chart)'}
                stroke={openLast && index === lastIndex ? 'var(--o-chart)' : undefined}
                strokeWidth={openLast && index === lastIndex ? 1.5 : 0}
              />
            ))}
            <LabelList
              dataKey="text"
              position="top"
              offset={6}
              style={{ fontSize: 12, fontWeight: 700, fill: 'var(--o-ink)', stroke: 'none' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
