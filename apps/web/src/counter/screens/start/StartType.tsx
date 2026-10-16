import { doublePrice, frameCharge } from '@stockers/shared';
import { Wrench } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { roomPath, tablePath } from '../../components/table-paths';
import { useStartDraft } from '../../start/draft';
import { TypeCards } from '../../start/TypeCards';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from './TableGate';

/** The Century rate if the owners have not set one (the seed's price card has 15). */
export const FALLBACK_RATE = 15;

/**
 * Screen 7, `/table/:id/start`: a free snooker table, "What are they playing?". Single frame, double frame or
 * Century with the Century rate for this game, "Mark out of order", and "Next: pick players". Every other kind of
 * table skips this step: a room has its own screen (P08), and pool, foosball, carrom, ludo and PlayStation go
 * straight to the two players.
 */
export function StartType() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <TypeStep {...context} />}</TableGate>;
}

function TypeStep({ table, category }: TableContext) {
  const { t } = useTranslation('start');
  const { t: tBoard } = useTranslation('board');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const draft = useStartDraft();

  useEffect(() => {
    draft.begin(table.id);
    // `begin` is stable and only the table decides whether a new draft starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.id]);

  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });

  if (table.kind === 'room')
    return <Navigate to={roomPath(pathname, table.id, '/start')} replace />;
  if (table.game) return <Navigate to={tablePath(pathname, table.id)} replace />;
  if (table.kind !== 'snooker' && table.price !== null && !table.outOfOrder) {
    return <Navigate to={tablePath(pathname, table.id, '/start/players')} replace />;
  }

  // A table that cannot be started says why, in the same dialog, with only a way out.
  if (table.outOfOrder || table.price === null) {
    return (
      <CounterDialog
        lead={table.number}
        title={table.outOfOrder ? t('outOfOrder.is', { name }) : t('outOfOrder.noPrice', { name })}
        subtitle={table.outOfOrder ? table.outOfOrder.note : tBoard('locked')}
        onClose={close}
        actions={
          <Button theme="counter" size="counter-main" onClick={close}>
            {t('cancel')}
          </Button>
        }
      />
    );
  }

  const price = table.price;
  const ownersRate = category?.centuryRate ?? FALLBACK_RATE;
  const rate = draft.rate ?? ownersRate;
  const kind = draft.kind;
  const century = category?.centuryAllowed ?? true;

  return (
    <CounterDialog
      lead={table.number}
      title={t('free', { name })}
      subtitle={t('choose')}
      onClose={close}
      actions={
        <>
          <Button
            theme="counter"
            variant="outline"
            size="counter-main"
            icon={<Wrench size={20} strokeWidth={2} />}
            className="min-h-[60px] text-[17px]"
            onClick={() => navigate(tablePath(pathname, table.id, '/start/out-of-order'))}
          >
            {t('outOfOrder.button')}
          </Button>
          <div className="flex-1" />
          <Button theme="counter" size="counter-main" onClick={close}>
            {t('cancel')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            onClick={() =>
              navigate(
                tablePath(
                  pathname,
                  table.id,
                  kind === 'double' ? '/start/double' : '/start/players',
                ),
              )
            }
          >
            {t('next')}
          </Button>
        </>
      }
    >
      <TypeCards
        prices={{ single: frameCharge(price), double: doublePrice(price), century: rate }}
        centuryAllowed={century}
        selected={kind}
        onSelect={draft.setKind}
        rate={rate}
        onRate={(next) => draft.setRate(next)}
        rateNote={t('rate.note')}
      />
    </CounterDialog>
  );
}
