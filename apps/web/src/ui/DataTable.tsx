import type { ReactNode } from 'react';
import { cx } from './cx';
import { focusRing, type Theme } from './theme';

export interface DataColumn<Row> {
  key: string;
  header: ReactNode;
  /** `end` is for numbers: they line up on the right in English and on the left in Urdu. */
  align?: 'start' | 'end' | 'center';
  /** A CSS width, for example `"22%"`. The rest share what is left. */
  width?: string;
  /** Keep the cell on one line (dates, amounts). */
  nowrap?: boolean;
  /** What to show in the cell. Defaults to `row[key]`. */
  cell?: (row: Row) => ReactNode;
}

export interface DataTableProps<Row> {
  /** Names the table for screen readers, for example "Expenses in October". */
  caption: string;
  columns: DataColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  theme: Theme;
  /** Every second row is tinted. */
  zebra?: boolean;
  /** The header row stays at the top while the rows scroll. */
  stickyHeader?: boolean;
  /** Tints a row amber, for example a line that needs a look. */
  highlight?: (row: Row) => boolean;
  /** A closing row, one entry per column (the Total row of screen 49). */
  footer?: ReactNode[];
  /** Below this width the table scrolls sideways inside its box. */
  minWidth?: number;
  /** `lg` is the roomier table of the counter's statement (screen 30): 17 px lines with 13 px above and below. */
  size?: 'md' | 'lg';
  className?: string;
}

const ALIGN = { start: 'text-start', end: 'text-end', center: 'text-center' } as const;

const LOOK: Record<
  Theme,
  { head: string; cell: string; zebra: string; highlight: string; foot: string }
> = {
  owner: {
    head: 'bg-o-soft text-o-ink-2 border-t border-o-line',
    cell: 'border-t border-o-divider text-o-ink',
    zebra: 'even:bg-o-stripe',
    highlight: 'bg-o-amber-tint',
    foot: 'border-t-2 border-o-line text-o-ink',
  },
  counter: {
    head: 'bg-c-header text-c-text-2 border-b border-c-line',
    cell: 'border-t border-c-line text-c-text',
    zebra: 'even:bg-c-raised/40',
    highlight: 'bg-c-warn-bg',
    foot: 'border-t-2 border-c-line-2 text-c-text',
  },
};

/** A table of rows and columns. Numbers use tabular figures so the digits line up. */
export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  theme,
  zebra = false,
  stickyHeader = false,
  highlight,
  footer,
  minWidth,
  size = 'md',
  className,
}: DataTableProps<Row>) {
  const look = LOOK[theme];
  const roomy = size === 'lg' && theme === 'counter';
  return (
    // relative: so the screen-reader-only caption and headers are clipped by the scroll box, not the page.
    // A box that scrolls must be reachable by keyboard, so a narrow screen can still read every column.
    <div
      role="region"
      aria-label={caption}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG: a scrolling region must take focus
      tabIndex={0}
      className={cx('relative overflow-x-auto', focusRing[theme], className)}
    >
      <table
        className="w-full border-collapse tabular-nums"
        style={minWidth ? { minWidth } : undefined}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cx(
                  'font-semibold',
                  roomy ? 'px-4 py-3 text-[15px]' : 'px-[18px] py-2.5 text-[14px]',
                  look.head,
                  roomy && 'border-b-0 bg-c-raised',
                  ALIGN[column.align ?? 'start'],
                  column.nowrap && 'whitespace-nowrap',
                  stickyHeader && 'sticky top-0 z-10',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className={cx(highlight?.(row) ? look.highlight : zebra && look.zebra)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    'align-middle',
                    roomy ? 'px-4 py-[13px] text-[17px]' : 'px-[18px] py-3 text-[15px]',
                    look.cell,
                    ALIGN[column.align ?? 'start'],
                    column.nowrap && 'whitespace-nowrap',
                  )}
                >
                  {column.cell
                    ? column.cell(row)
                    : String((row as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer ? (
          <tfoot>
            <tr>
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className={cx(
                    'px-[18px] py-3.5 text-[16px] font-bold',
                    look.foot,
                    ALIGN[column.align ?? 'start'],
                  )}
                >
                  {footer[index]}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
