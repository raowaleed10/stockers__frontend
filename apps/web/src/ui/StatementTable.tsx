import { formatAmount, formatClock, formatDate, type StatementLine } from '@stockers/shared';
import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, type DataColumn } from './DataTable';
import { IconButton } from './IconButton';
import { MoneyText } from './MoneyText';
import { cx } from './cx';
import type { Theme } from './theme';

/** A statement line, plus an optional second line of words ("lost to Ali Raza"). */
export type StatementRow = StatementLine & { detail?: string };

export interface StatementTableProps {
  lines: StatementRow[];
  theme: Theme;
  /**
   * `bill` is the list of tonight's charges with an amount on each row (screen 25).
   * `statement` is the full table with Charge, Paid and Balance (screens 30, 44, 56).
   */
  variant?: 'bill' | 'statement';
  /** Names the table for screen readers. */
  caption: string;
  /** Adds the "By" column: every list shows who did it (golden rule 8). */
  showDoneBy?: boolean;
  /** Owners only: a pencil on each line. */
  editable?: boolean;
  onEdit?: (line: StatementRow) => void;
  /** Under the lines, for example the "Tonight" and "Total to pay" rows of a bill. */
  footer?: ReactNode;
}

const DASH = '–';

/** The lines of a player's bill or statement. The balance after each line is written in words: "250 owed". */
export function StatementTable({
  lines,
  theme,
  variant = 'statement',
  caption,
  showDoneBy = false,
  editable = false,
  onEdit,
  footer,
}: StatementTableProps) {
  const { t } = useTranslation();
  const counter = theme === 'counter';
  const quiet = counter ? 'text-c-text-2' : 'text-o-ink-2';

  if (variant === 'bill') {
    return (
      <div className="flex flex-col">
        <ul aria-label={caption} className="flex flex-col">
          {lines.map((line) => {
            const amount = line.charge ?? (line.paid === undefined ? 0 : -line.paid);
            return (
              <li
                key={line.id}
                className={cx(
                  'flex items-center justify-between gap-4 border-b px-1 py-3.5',
                  counter ? 'border-c-line' : 'border-o-divider',
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-[19px] font-semibold">{line.text}</span>
                  <span className={cx('text-[15px]', quiet)}>
                    <bdi dir="ltr">{formatClock(line.at)}</bdi>
                    {line.detail ? `, ${line.detail}` : ''}
                  </span>
                </span>
                <MoneyText value={amount} size="row" />
              </li>
            );
          })}
        </ul>
        {footer}
      </div>
    );
  }

  const none = <span className={quiet}>{DASH}</span>;
  const last = lines[lines.length - 1];

  const columns: DataColumn<StatementRow>[] = [
    {
      key: 'when',
      header: t('statement.date'),
      width: '17%',
      nowrap: true,
      cell: (line) => <bdi dir="ltr">{`${formatDate(line.at)}, ${formatClock(line.at)}`}</bdi>,
    },
    { key: 'text', header: t('statement.details'), cell: (line) => line.text },
    ...(showDoneBy
      ? [{ key: 'by', header: t('statement.by'), cell: (line: StatementRow) => line.doneBy.name }]
      : []),
    {
      key: 'charge',
      header: t('statement.charge'),
      align: 'end',
      nowrap: true,
      cell: (line) => (line.charge === undefined ? none : formatAmount(line.charge)),
    },
    {
      key: 'paid',
      header: t('statement.paid'),
      align: 'end',
      nowrap: true,
      cell: (line) => (line.paid === undefined ? none : formatAmount(line.paid)),
    },
    {
      key: 'balance',
      header: t('statement.balance'),
      align: 'end',
      nowrap: true,
      cell: (line) => {
        const owed = line.balance > 0;
        const ahead = line.balance < 0;
        return (
          <span
            className={cx(
              line === last && 'font-bold',
              owed && (counter ? 'text-c-warn-ink' : 'text-o-amber-ink'),
              ahead && (counter ? 'text-c-ok-ink' : 'text-o-green'),
            )}
          >
            {line.balance === 0
              ? '0'
              : `${formatAmount(Math.abs(line.balance))} ${t(owed ? 'statement.owed' : 'statement.advance')}`}
          </span>
        );
      },
    },
    ...(editable
      ? [
          {
            key: 'edit',
            header: <span className="sr-only">{t('statement.edit')}</span>,
            align: 'end' as const,
            width: '64px',
            cell: (line: StatementRow) => (
              <IconButton
                theme={theme}
                variant="ghost"
                label={`${t('statement.edit')}: ${line.text}`}
                icon={<Pencil size={18} strokeWidth={2} />}
                onClick={() => onEdit?.(line)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col">
      <DataTable
        theme={theme}
        caption={caption}
        columns={columns}
        rows={lines}
        getRowKey={(line) => line.id}
        highlight={(line) => line.kind === 'left-without-checkout'}
        minWidth={showDoneBy || editable ? 760 : 640}
      />
      {footer}
    </div>
  );
}
