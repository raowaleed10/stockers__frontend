import { canPutBackInOrder } from '@stockers/shared';
import { Wrench } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { TextArea } from '@/ui/inputs';
import { useBackInOrder } from '../../api';
import { boardOfTableScreen } from '../../components/table-paths';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from './TableGate';

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

/**
 * `/table/:id/back-in-order`: what a tap on a grey table opens. A worker can put back a table that a worker marked, with
 * a short note, and Activity keeps his name; a table an owner marked (Adil on Table 7) says so and only an owner can put
 * it back (D60). No approved screen: docs/NO_DESIGN.md.
 */
export function BackInOrder() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <BackStep {...context} />}</TableGate>;
}

function BackStep({ table }: TableContext) {
  const { t } = useTranslation('start');
  const { t: tBoard } = useTranslation('board');
  const format = useFormat();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const put = useBackInOrder();
  const [note, setNote] = useState('');
  const noteId = useId();

  // A table that is already in order has nothing to put back; wait for the write to finish before leaving.
  if (!table.outOfOrder) {
    return put.isSuccess ? null : <Navigate to={boardOfTableScreen(pathname)} replace />;
  }
  const marked = table.outOfOrder;
  const allowed = canPutBackInOrder(marked.by, { role: 'worker' });
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const text = note.trim();
  const who = firstName(marked.by.name);

  return (
    <CounterDialog
      icon={<Wrench size={28} strokeWidth={2} />}
      title={t('outOfOrder.is', { name })}
      subtitle={`${marked.note}. ${tBoard('outOfOrder.marked', { name: who, time: format.clock(marked.at) })}`}
      onClose={close}
      actions={
        <>
          <div className="flex-1" />
          <Button theme="counter" size="counter-main" onClick={close}>
            {t('cancel')}
          </Button>
          {allowed ? (
            <Button
              theme="counter"
              variant="primary"
              size="counter-main"
              disabled={text === '' || put.isPending}
              onClick={() =>
                put.mutate({ tableId: table.id, request: { note: text } }, { onSuccess: close })
              }
            >
              {t('backInOrder.confirm')}
            </Button>
          ) : null}
        </>
      }
    >
      {allowed ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={noteId} className="text-[16px] text-c-text-2">
            {t('outOfOrder.note')}
          </label>
          <TextArea
            id={noteId}
            theme="counter"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-[96px]"
          />
          <p className="m-0 text-[15px] leading-[1.4] text-c-text-2">{t('backInOrder.text')}</p>
        </div>
      ) : (
        <p className="m-0 text-[18px] leading-[1.45] text-c-text-2">
          {t('backInOrder.ownerOnly', { name: who })}
        </p>
      )}
      {put.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {put.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
