import type { PersonRef } from '@stockers/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatementTable, type StatementRow } from './StatementTable';

const shabir: PersonRef = { id: 'w1', name: 'Shabir', role: 'worker' };
const zain: PersonRef = { id: 'w2', name: 'Zain', role: 'worker' };

const lines: StatementRow[] = [
  {
    id: 'a',
    playerId: 'p',
    at: '2026-09-15T21:10:00+05:00',
    kind: 'frame',
    text: 'Frame, Table 2, lost to Imran',
    detail: 'lost to Imran',
    charge: 250,
    balance: 250,
    doneBy: shabir,
  },
  {
    id: 'b',
    playerId: 'p',
    at: '2026-09-16T04:02:00+05:00',
    kind: 'left-without-checkout',
    text: 'Left without checkout, moved to credit',
    balance: 250,
    doneBy: zain,
  },
  {
    id: 'c',
    playerId: 'p',
    at: '2026-10-03T21:20:00+05:00',
    kind: 'payment',
    text: 'Paid in cash',
    paid: 600,
    balance: -350,
    doneBy: zain,
  },
  {
    id: 'd',
    playerId: 'p',
    at: '2026-10-03T22:00:00+05:00',
    kind: 'frame',
    text: 'Frame, Table 1',
    charge: 350,
    balance: 0,
    doneBy: shabir,
  },
];

describe('StatementTable (statement)', () => {
  it('has the Date, Details, Charge, Paid and Balance columns, named for screen readers', () => {
    render(<StatementTable lines={lines} theme="counter" caption="Statement for Kamran" />);
    const table = screen.getByRole('table', { name: 'Statement for Kamran' });
    for (const header of ['Date', 'Details', 'Charge', 'Paid', 'Balance']) {
      expect(within(table).getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
  });

  it('writes the date and time of each line, and dashes for what is empty', () => {
    render(<StatementTable lines={lines} theme="counter" caption="s" />);
    expect(screen.getByText('15 Sep, 9:10 PM')).toBeInTheDocument();
    expect(screen.getByText('16 Sep, 4:02 AM')).toBeInTheDocument();
    const row = screen.getByText('Left without checkout, moved to credit').closest('tr');
    // no charge and no payment on that line
    expect(within(row as HTMLElement).getAllByText('–')).toHaveLength(2);
  });

  it('writes the running balance in words: owed, advance, or 0', () => {
    render(<StatementTable lines={lines} theme="counter" caption="s" />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('250 owed')).toBeInTheDocument();
    expect(within(rows[2]).getByText('350 advance')).toBeInTheDocument();
    expect(within(rows[3]).getByText('0')).toBeInTheDocument();
  });

  it('makes the final balance bold', () => {
    render(<StatementTable lines={lines} theme="counter" caption="s" />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[3]).getByText('0').className).toContain('font-bold');
    expect(within(rows[0]).getByText('250 owed').className).not.toContain('font-bold');
  });

  it('tints a line that left without checkout', () => {
    render(<StatementTable lines={lines} theme="counter" caption="s" />);
    const row = screen.getByText('Left without checkout, moved to credit').closest('tr');
    expect(row?.className).toContain('bg-c-warn-bg');
    expect(
      screen.getByText('Frame, Table 2, lost to Imran').closest('tr')?.className ?? '',
    ).not.toContain('bg-c-warn-bg');
  });

  it('shows who did each line when asked (golden rule 8)', () => {
    render(<StatementTable lines={lines} theme="owner" caption="s" showDoneBy />);
    expect(screen.getByRole('columnheader', { name: 'By' })).toBeInTheDocument();
    expect(screen.getAllByText('Shabir')).toHaveLength(2);
    expect(screen.getAllByText('Zain')).toHaveLength(2);
  });

  it('has no By column unless asked', () => {
    render(<StatementTable lines={lines} theme="owner" caption="s" />);
    expect(screen.queryByRole('columnheader', { name: 'By' })).not.toBeInTheDocument();
  });

  it('shows a pencil on each line for owners and reports which line was picked', async () => {
    const onEdit = vi.fn();
    render(<StatementTable lines={lines} theme="owner" caption="s" editable onEdit={onEdit} />);
    const pencils = screen.getAllByRole('button', { name: /^Edit: / });
    expect(pencils).toHaveLength(4);
    await userEvent.click(screen.getByRole('button', { name: 'Edit: Paid in cash' }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
  });

  it('has no pencils unless editable', () => {
    render(<StatementTable lines={lines} theme="owner" caption="s" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('StatementTable (bill)', () => {
  it('lists each charge with its time and its amount', () => {
    render(
      <StatementTable
        lines={lines.filter((line) => line.charge)}
        theme="counter"
        variant="bill"
        caption="Tonight, sheet 48"
      />,
    );
    const list = screen.getByRole('list', { name: 'Tonight, sheet 48' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Frame, Table 2, lost to Imran');
    expect(items[0]).toHaveTextContent('9:10 PM, lost to Imran');
    expect(items[0]).toHaveTextContent('Rs 250');
    expect(items[1]).toHaveTextContent('Rs 350');
  });

  it('shows what the caller puts under the lines', () => {
    render(
      <StatementTable
        lines={lines.slice(0, 1)}
        theme="counter"
        variant="bill"
        caption="Tonight"
        footer={<p>Total to pay</p>}
      />,
    );
    expect(screen.getByText('Total to pay')).toBeInTheDocument();
  });
});
