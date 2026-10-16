import { Wrench } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { TextArea } from '@/ui/inputs';
import { useMarkOutOfOrder } from '../../api';
import { boardOfTableScreen, tablePath } from '../../components/table-paths';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from './TableGate';

/**
 * `/table/:id/start/out-of-order`: "Mark out of order" on screen 7 asks for a note, and the table turns grey on the
 * board with that note. Only a free table can be marked (no approved screen; docs/NO_DESIGN.md). Putting it back in
 * order is the owners' (Games and prices).
 */
export function OutOfOrder() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <NoteStep {...context} />}</TableGate>;
}

function NoteStep({ table }: TableContext) {
  const { t } = useTranslation('start');
  const { t: tBoard } = useTranslation('board');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const mark = useMarkOutOfOrder();
  const [note, setNote] = useState('');
  const noteId = useId();

  if (!mark.isSuccess && (table.game || table.outOfOrder)) {
    return <Navigate to={tablePath(pathname, table.id, '/start')} replace />;
  }
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const text = note.trim();

  const submit = () =>
    mark.mutate(
      { tableId: table.id, request: { note: text } },
      { onSuccess: () => navigate(boardOfTableScreen(pathname)) },
    );

  return (
    <CounterDialog
      icon={<Wrench size={28} strokeWidth={2} />}
      title={t('outOfOrder.title', { name })}
      subtitle={t('outOfOrder.text')}
      onClose={close}
      actions={
        <>
          <div className="flex-1" />
          <Button
            theme="counter"
            size="counter-main"
            onClick={() => navigate(tablePath(pathname, table.id, '/start'))}
          >
            {t('cancel')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            disabled={text === '' || mark.isPending}
            onClick={submit}
          >
            {t('outOfOrder.confirm')}
          </Button>
        </>
      }
    >
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
      </div>
      {mark.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {mark.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
