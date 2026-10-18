import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTip, type TipRow } from './ChartTip';

export interface BusyHoursProps {
  /** The average number of tables in use at each hour, from the first hour on the left. */
  values: number[];
  /** What each bar says on a tap (`10 PM, 7.8 tables`). */
  tips: string[];
  /** The top of the scale: all the tables the club has. */
  max: number;
  /** Under the chart, spread from end to end (`12 PM`, `4 PM`, `8 PM`, `10 PM peak, 7.8`, `4 AM`). */
  xLabels: string[];
  summary: string;
  height?: number;
  className?: string;
}

/** Busiest hours, last 4 weeks (screen 36): thin blue bars, one for each hour the club is open. */
export function BusyHours({
  values,
  tips,
  max,
  xLabels,
  summary,
  height = 130,
  className,
}: BusyHoursProps) {
  const rows = values.map((value, index): { value: number } & TipRow => ({
    value,
    tip: [tips[index] ?? ''],
  }));
  return (
    // The plot keeps one order in both languages (earliest on the left), so a label always sits under its bar.
    <div dir="ltr" className={className}>
      <div role="img" aria-label={summary} className="border-b border-o-line-2" style={{ height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={rows}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            barCategoryGap={2}
          >
            <XAxis hide />
            <YAxis hide domain={[0, Math.max(max, ...values)]} />
            <Tooltip content={<ChartTip />} cursor={false} isAnimationActive={false} />
            <Bar
              dataKey="value"
              fill="var(--o-blue)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div aria-hidden="true" className="mt-3 flex justify-between text-[13px] text-o-ink-2">
        {xLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
