import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { DataTable, type DataColumn } from '@/ui/DataTable';
import { EmptyState } from '@/ui/EmptyState';
import { Field } from '@/ui/Field';
import { MoneyText } from '@/ui/MoneyText';
import { OwnerAside } from '@/ui/OwnerAside';
import { Segmented } from '@/ui/Segmented';
import { StatementTable } from '@/ui/StatementTable';
import { Toast } from '@/ui/Toast';
import { MoneyInput, Select, TextArea, TextInput } from '@/ui/inputs';
import type { Theme } from '@/ui/theme';
import { BILL_LINES, EXPENSES, STATEMENT_LINES, type ExpenseRow } from './sample';

const noop = () => undefined;

export function OwnerAsideDemo() {
  const { t } = useTranslation('kit');
  const [amount, setAmount] = useState<number | null>(2000);
  const [reason, setReason] = useState('salaries');
  const [half, setHalf] = useState<'am' | 'pm'>('am');
  const reasons = [
    { id: 'salaries', label: t('aside.salaries') },
    { id: 'bills', label: t('aside.bills') },
    { id: 'generator', label: t('aside.generator') },
  ];
  return (
    <OwnerAside
      static
      title={t('aside.title')}
      onClose={noop}
      className="max-w-[420px]"
      actions={
        <>
          <Button theme="owner" variant="secondary" className="min-h-[52px] flex-1">
            {t('dlg.cancel')}
          </Button>
          <Button theme="owner" variant="primary" className="min-h-[52px] flex-[2]">
            {t('aside.save')}
          </Button>
        </>
      }
    >
      <Field theme="owner" label={t('aside.amount')}>
        {(control) => (
          <MoneyInput {...control} theme="owner" size="lg" value={amount} onChange={setAmount} />
        )}
      </Field>
      <div role="group" aria-label={t('aside.whatFor')} className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold">{t('aside.whatFor')}</span>
        <div className="flex flex-wrap gap-1.5">
          {reasons.map((item) => (
            <Chip
              key={item.id}
              theme="owner"
              selected={reason === item.id}
              onClick={() => setReason(item.id)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>
      <Segmented
        theme="owner"
        label={t('seg.from')}
        size="lg"
        value={half}
        onChange={setHalf}
        className="self-start"
        options={[
          { value: 'am', label: t('seg.am') },
          { value: 'pm', label: t('seg.pm') },
        ]}
      />
      <Card theme="owner" tone="soft" padding="sm" className="text-[15px] leading-[1.45]">
        {t('card.info')}
      </Card>
      <span className="text-[14px] text-o-amber-ink-2">{t('aside.note')}</span>
    </OwnerAside>
  );
}

export function FieldsDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field theme={theme} label={t('field.reason')} hint={t('field.reasonHint')}>
        {(control) => (
          <TextInput
            {...control}
            theme={theme}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
      </Field>
      <Field theme={theme} label={t('field.amount')} error={t('field.amountError')}>
        {(control) => <MoneyInput {...control} theme={theme} value={null} onChange={noop} />}
      </Field>
      <Field theme={theme} label={t('field.reason')} className="sm:col-span-2">
        {(control) => (
          <TextArea
            {...control}
            theme={theme}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        )}
      </Field>
      <Field theme={theme} label={t('field.paidFrom')}>
        {(control) => (
          <Select {...control} theme={theme} defaultValue="counter">
            <option value="owner">{t('field.owner')}</option>
            <option value="counter">{t('field.counterCash')}</option>
            <option value="bank">{t('field.bank')}</option>
          </Select>
        )}
      </Field>
      <Field theme={theme} label={t('field.amount')}>
        {(control) => (
          <MoneyInput {...control} theme={theme} size="lg" value={2000} onChange={noop} />
        )}
      </Field>
    </div>
  );
}

export function DataTableDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const columns: DataColumn<ExpenseRow>[] = [
    { key: 'when', header: t('table.when'), width: '20%', nowrap: true },
    { key: 'what', header: t('table.what'), cell: (row) => t(`table.${row.what}`) },
    { key: 'type', header: t('table.type'), cell: (row) => t(`table.${row.type}`) },
    { key: 'from', header: t('table.from'), cell: (row) => t(`table.${row.from}`) },
    { key: 'by', header: t('table.by') },
    {
      key: 'amount',
      header: 'Rs',
      align: 'end',
      nowrap: true,
      cell: (row) => <MoneyText value={row.amount} className="font-bold" />,
    },
  ];
  const total = EXPENSES.reduce((sum, row) => sum + row.amount, 0);
  return (
    <Card theme={theme} padding="none" className="overflow-hidden">
      <DataTable
        theme={theme}
        caption={t('table.caption')}
        columns={columns}
        rows={EXPENSES}
        getRowKey={(row) => row.id}
        zebra
        minWidth={620}
        footer={['', '', '', '', '', <MoneyText key="total" value={total} />]}
      />
    </Card>
  );
}

export function StatementDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const counter = theme === 'counter';
  return (
    <div className="flex flex-col gap-6">
      {counter ? (
        <div className="flex flex-col gap-2.5">
          <Card
            theme="counter"
            tone="amber"
            padding="sm"
            className="flex items-center justify-between gap-3"
          >
            <span className="flex flex-col">
              <span className="text-[19px] font-bold text-c-warn-ink">{t('card.oldCredit')}</span>
              <span className="text-[15px] text-c-text-3">{t('card.oldCreditNote')}</span>
            </span>
            <MoneyText value={500} className="text-[22px] font-bold" />
          </Card>
          <StatementTable
            theme={theme}
            variant="bill"
            caption={t('stmt.billCaption')}
            lines={BILL_LINES}
            footer={
              <>
                <div className="flex justify-between px-1 pt-3.5 text-[18px] text-c-text-2">
                  <span>{t('stmt.tonight')}</span>
                  <MoneyText value={600} className="font-semibold text-c-text" />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-3 border-t-2 border-c-line-2 px-1 pt-4">
                  <span className="text-[24px] font-bold">{t('stmt.totalToPay')}</span>
                  <MoneyText value={1100} size="hero" />
                </div>
              </>
            }
          />
        </div>
      ) : null}
      <Card theme={theme} padding="none" className="overflow-hidden">
        <StatementTable
          theme={theme}
          caption={t('stmt.statementCaption')}
          lines={STATEMENT_LINES}
          showDoneBy={!counter}
          editable={!counter}
          onEdit={noop}
        />
      </Card>
    </div>
  );
}

export function EmptyAndToastDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col gap-4">
      <Card theme={theme} padding="none">
        <EmptyState
          theme={theme}
          title={t('empty.title')}
          description={t('empty.text')}
          action={
            <Button theme={theme} variant="primary" icon={<Plus size={20} />}>
              {t('empty.action')}
            </Button>
          }
        />
      </Card>
      {open ? (
        <Toast
          theme={theme}
          message={t('toast.message')}
          action={{ label: t('toast.undo'), onPress: () => setOpen(false) }}
        />
      ) : (
        <Button theme={theme} variant="outline" onClick={() => setOpen(true)}>
          {t('toast.message')}
        </Button>
      )}
    </div>
  );
}
