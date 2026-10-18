import type { ReactNode } from 'react';
import { cx } from '@/ui/cx';

export interface HBarRow {
  label: ReactNode;
  /** The amount, written (`Rs 51,400`, `106,800`). */
  value: ReactNode;
  /** A share written after the amount (`60%`), for the `share` look. */
  note?: ReactNode;
  /** How long the bar is, 0 to 100 (`share` or `barWidth` in shared works it out). */
  width: number;
}

/**
 * A list of horizontal bars, in the two looks of the owner screens:
 *  - `share` (screen 36, "Where October's money came from"): the name and the amount with its share on one line, the bar on
 *    a grey track under it;
 *  - `table` (screen 37, "By table"): the name, the bar and the amount on one row.
 * It is plain HTML, because a bar is only a width; the numbers are made by the caller.
 */
export function HBarList({
  rows,
  look,
  className,
}: {
  rows: HBarRow[];
  look: 'share' | 'table';
  className?: string;
}) {
  return (
    <ul
      className={cx(
        'm-0 flex list-none flex-col p-0',
        look === 'share' ? 'gap-3' : 'gap-2.5',
        className,
      )}
    >
      {rows.map((row, index) =>
        look === 'share' ? (
          <li key={index} className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-3 text-[16px]">
              <span>{row.label}</span>
              <span className="font-bold">
                {row.value}
                {row.note ? (
                  <span className="ms-1 font-normal text-o-ink-2">{row.note}</span>
                ) : null}
              </span>
            </div>
            <div className="h-3.5 rounded-[4px] bg-o-page" aria-hidden="true">
              <div
                className="h-3.5 rounded-[4px] bg-o-chart"
                style={{ width: `${Math.min(100, Math.max(0, row.width))}%` }}
              />
            </div>
          </li>
        ) : (
          <li
            key={index}
            className="grid grid-cols-[80px_1fr_90px] items-center gap-2.5 text-[16px]"
          >
            <span>{row.label}</span>
            <div
              aria-hidden="true"
              className="h-3 rounded-[4px] bg-o-chart"
              style={{ width: `${Math.min(100, Math.max(0, row.width))}%` }}
            />
            <span className="text-end font-bold">{row.value}</span>
          </li>
        ),
      )}
    </ul>
  );
}
