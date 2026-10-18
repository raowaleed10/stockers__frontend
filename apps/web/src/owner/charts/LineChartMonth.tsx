import { compactMoney, niceAxis } from '@stockers/shared';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTip, type TipRow } from './ChartTip';

export interface LineChartMonthProps {
  /** The running total of the period shown, one value for each step (a day), the first step first. */
  shown: number[];
  /** The running total of the period compared with. It may have more or fewer steps. */
  compared: number[];
  /** What each step says on a tap: the step, then the two totals. */
  tips: (index: number) => string[];
  /** The two words at the end of the lines (`Sep Rs 773,000`, `Aug Rs 735,200`). */
  shownEnd: string;
  comparedEnd: string;
  /** Under the chart, spread from end to end (`Day 1`, `Day 10`, `Day 20`, `Day 31`). */
  xLabels: string[];
  summary: string;
  height?: number;
  className?: string;
}

const TOP = 22; // room above the top gridline, as the design's 20 px of its 220

/**
 * Earned through the month, day by day (screen 37): two running totals, this period in green and the one compared with in
 * blue, on light gridlines at 0, 200k, … 800k, with the final total written at the end of each line. Recharts with the
 * tokens: thin lines, no dots, no animation, a tooltip on a tap.
 */
export function LineChartMonth({
  shown,
  compared,
  tips,
  shownEnd,
  comparedEnd,
  xLabels,
  summary,
  height = 240,
  className,
}: LineChartMonthProps) {
  const steps = Math.max(shown.length, compared.length);
  const axis = niceAxis(Math.max(0, ...shown, ...compared), 4);
  const rows = Array.from(
    { length: steps },
    (
      _,
      index,
    ): TipRow & {
      shown?: number;
      compared?: number;
    } => ({
      shown: shown[index],
      compared: compared[index],
      tip: tips(index),
    }),
  );

  // The word at the end of the higher line sits above it and the other below, so they never overlap.
  const yOf = (value: number) => TOP + (1 - value / axis.max) * (height - TOP);
  const endShown = shown.at(-1) ?? 0;
  const endCompared = compared.at(-1) ?? 0;
  const shownAbove = endShown >= endCompared;
  const topOf = (value: number, above: boolean) => Math.max(0, yOf(value) + (above ? -29 : 6));
  const rightOf = (length: number) => (steps > 1 ? (1 - (length - 1) / (steps - 1)) * 100 : 0);

  return (
    // The plot keeps one order in both languages (earliest on the left), so a label always sits under its bar.
    <div dir="ltr" className={className}>
      <div className="flex gap-2.5">
        <div
          aria-hidden="true"
          className="flex shrink-0 flex-col justify-between text-end text-[13px] text-o-ink-2"
          style={{ height, paddingTop: TOP - 8 }}
        >
          {[...axis.ticks].reverse().map((tick) => (
            <span key={tick}>{compactMoney(tick)}</span>
          ))}
        </div>
        <div role="img" aria-label={summary} className="relative min-w-0 flex-1" style={{ height }}>
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={rows} margin={{ top: TOP, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--o-divider)" />
              <XAxis hide />
              <YAxis hide domain={[0, axis.max]} ticks={axis.ticks} />
              <ReferenceLine y={0} stroke="var(--o-line-2)" />
              <Tooltip content={<ChartTip />} isAnimationActive={false} />
              <Line
                dataKey="compared"
                stroke="var(--o-blue)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              <Line
                dataKey="shown"
                stroke="var(--o-chart)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <span
            aria-hidden="true"
            className="absolute bg-o-card px-1 text-[14px] font-bold"
            style={{
              top: topOf(endShown, shownAbove),
              insetInlineEnd: `${rightOf(shown.length)}%`,
            }}
          >
            {shownEnd}
          </span>
          <span
            aria-hidden="true"
            className="absolute bg-o-card px-1 text-[14px] font-bold"
            style={{
              top: topOf(endCompared, !shownAbove),
              insetInlineEnd: `${rightOf(compared.length)}%`,
            }}
          >
            {comparedEnd}
          </span>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="mt-3 flex justify-between ps-[40px] text-[13px] text-o-ink-2"
      >
        {xLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
