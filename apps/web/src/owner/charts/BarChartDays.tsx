import { compactMoney, niceAxis } from '@stockers/shared';
import { useId } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTip, type TipRow } from './ChartTip';

export interface BarChartDaysProps {
  /** One value for each day, the oldest first. */
  values: number[];
  /** What each bar says on a tap (`Fri 4 Sep, Rs 25,200`), in the same order. */
  tips: string[];
  /** The last bar is today and is still open: it is drawn hatched. */
  openLast?: boolean;
  /** Under the chart, spread from end to end (`4 Sep`, `11 Sep`, …, `Today, still open`). */
  xLabels: string[];
  /** What a screen reader hears instead of the picture. */
  summary: string;
  /** The height of the bars' area in px (170 on screen 36). */
  height?: number;
  className?: string;
}

/**
 * Earned per day, last 30 days (screen 36): thin green bars with rounded tops on light gridlines, the open day hatched,
 * the axis worked out from the data (0, 12k, 24k, 36k for a best day of Rs 35,600). Built on Recharts with the tokens: one
 * hue, no animation, a tooltip on a tap or hover and a `role="img"` summary.
 */
export function BarChartDays({
  values,
  tips,
  openLast = false,
  xLabels,
  summary,
  height = 170,
  className,
}: BarChartDaysProps) {
  const hatch = `hatch-${useId().replace(/:/g, '')}`;
  const axis = niceAxis(Math.max(0, ...values), 3);
  const rows = values.map((value, index): { value: number } & TipRow => ({
    value,
    tip: [tips[index] ?? ''],
  }));
  const steps = axis.ticks.length - 1;

  return (
    // The plot keeps one order in both languages (earliest on the left), so a label always sits under its bar.
    <div dir="ltr" className={className}>
      <div className="flex gap-2.5">
        <div
          aria-hidden="true"
          className="flex w-[26px] shrink-0 flex-col justify-between pb-0.5 text-end text-[13px] text-o-ink-2"
          style={{ height }}
        >
          {[...axis.ticks].reverse().map((tick) => (
            <span key={tick}>{compactMoney(tick)}</span>
          ))}
        </div>
        <div
          role="img"
          aria-label={summary}
          className="min-w-0 flex-1 border-b border-o-line-2"
          style={{
            height,
            backgroundImage: 'linear-gradient(var(--o-divider) 1px, transparent 1px)',
            backgroundSize: `100% ${100 / steps}%`,
          }}
        >
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={rows}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              barCategoryGap={2}
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
              <Bar
                dataKey="value"
                fill="var(--o-chart)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {rows.map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      openLast && index === rows.length - 1 ? `url(#${hatch})` : 'var(--o-chart)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="mt-3.5 flex justify-between ps-[36px] text-[13px] text-o-ink-2"
      >
        {xLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
