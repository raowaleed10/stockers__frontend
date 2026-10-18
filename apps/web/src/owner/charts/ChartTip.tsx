import type { TooltipProps } from 'recharts';

/** What each bar or point of a chart says when it is tapped or hovered: one line for a bar, a few for a line chart. */
export interface TipRow {
  tip: string[];
}

/**
 * The small white box a chart shows on a tap (docs/04 §7: "a tooltip on tap or hover"). The words are made before the chart is
 * drawn (`tip` on each row), so the chart never writes a sentence or a sum.
 */
export function ChartTip({ active, payload }: TooltipProps<number, string>) {
  const row = payload?.[0]?.payload as TipRow | undefined;
  if (!active || !row || row.tip.length === 0) return null;
  return (
    <div
      role="status"
      // The chart is drawn left to right in both languages, but a sentence in it reads the way the page does.
      dir={document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'}
      className="rounded-[8px] border border-o-line bg-o-card px-2.5 py-1.5 text-[13px] leading-snug text-o-ink shadow-thumb"
    >
      {row.tip.map((line, index) => (
        <div key={index} className={index === 0 ? 'font-semibold' : undefined}>
          {line}
        </div>
      ))}
    </div>
  );
}
