import { compactMoney, niceAxis } from '@stockers/shared';
import { useId } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTip, type TipRow } from './ChartTip';

export interface YearBarsProps {
  /** The 12 months of the year, January first: the money earned, or `null` for a month that has not come. */
  values: (number | null)[];
  /** The month the report is about: its bar is the darker green and its label bold. */
  pickedIndex?: number;
  /** The month that is still open: its bar is hatched and its label says `so far`. */
  openIndex?: number;
  openLabel: string;
  /** Write an amount above only these bars (a phone has no room for twelve); every bar if left out. */
  labelled?: number[];
  /** Under the bars, one for each month (`Jan` … `Dec`). */
  xLabels: string[];
  tips: string[];
  summary: string;
  height?: number;
  className?: string;
}

const LABEL_ROOM = 22; // room above the tallest bar for its label

/** 2026 month by month (screen 37): twelve thin green bars with the amount above each, the month shown darker, the open one hatched. */
export function YearBars({
  values,
  pickedIndex,
  openIndex,
  openLabel,
  labelled,
  xLabels,
  tips,
  summary,
  height = 170,
  className,
}: YearBarsProps) {
  const hatch = `hatch-${useId().replace(/:/g, '')}`;
  const axis = niceAxis(Math.max(0, ...values.map((v) => v ?? 0)), 4);
  const rows = values.map((value, index): { value: number | null; text: string } & TipRow => ({
    value,
    text:
      value === null || (labelled && !labelled.includes(index))
        ? ''
        : index === openIndex
          ? openLabel
          : compactMoney(value),
    tip: [tips[index] ?? ''],
  }));

  return (
    // The plot keeps one order in both languages (earliest on the left), so a label always sits under its bar.
    <div dir="ltr" className={className}>
      <div role="img" aria-label={summary} className="border-b border-o-line-2" style={{ height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={rows}
            margin={{ top: LABEL_ROOM, right: 0, bottom: 0, left: 0 }}
            barCategoryGap={7}
          >
            <defs>
              <pattern
                id={hatch}
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill="var(--o-chart)" />
                <rect width="4" height="8" fill="var(--o-green-hover)" />
              </pattern>
            </defs>
            <XAxis hide />
            <YAxis hide domain={[0, axis.max]} />
            <Tooltip content={<ChartTip />} cursor={false} isAnimationActive={false} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map((_, index) => (
                <Cell
                  key={index}
                  fill={
                    index === openIndex
                      ? `url(#${hatch})`
                      : index === pickedIndex
                        ? 'var(--o-green-hover)'
                        : 'var(--o-chart)'
                  }
                />
              ))}
              <LabelList
                dataKey="text"
                position="top"
                offset={6}
                style={{ fontSize: 13, fill: 'var(--o-ink-2)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div aria-hidden="true" className="mt-3 flex text-[13px] text-o-ink-2">
        {xLabels.map((label) => (
          <span key={label} className="flex-1 text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
