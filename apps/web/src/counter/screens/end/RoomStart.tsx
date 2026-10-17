import {
  formatAmount,
  formatRs,
  isValidRoomHourly,
  ROOM_HOURLY_MAX,
  ROOM_HOURLY_MIN,
  roomPreview,
} from '@stockers/shared';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useStartRoom } from '../../api';
import { newPlayerPath, tablePath } from '../../components/table-paths';
import { exampleWords, perMinuteMoney } from '../../end/duration';
import { useStartDraft } from '../../start/draft';
import { PlayerSearch } from '../../start/PlayerSearch';
import { showPhone } from '../../start/player-parts';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';

/** The price of an hour when the owners have not set one (decision Q8). */
const FALLBACK_HOURLY = 1500;
const STEP = 100;
const MAX_DIGITS = 5;

/**
 * Screen 22, `/room/:id/start`: "Start Room 2". The room is under one player and the whole bill goes to him; the price of
 * an hour starts at the owners' price (Rs 1,500) and the worker can change it with the steppers (100 at a time) or by
 * typing, from Rs 100 to Rs 10,000 (D65); the three boxes under it show the first hour, the price of a minute after it, and an example. The start time is
 * filled in when he taps Start.
 */
export function RoomStart() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <RoomStep {...context} />}</TableGate>;
}

function RoomStep({ table, category }: TableContext) {
  const { t } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const draft = useStartDraft();
  const start = useStartRoom();
  const priceId = useId();
  const [query, setQuery] = useState('');
  const owners = table.price ?? FALLBACK_HOURLY;
  const [hourly, setHourly] = useState<number | null>(null);

  // One name for the room: the Century's single slot is the same thing.
  useEffect(() => {
    draft.begin(table.id);
    draft.setKind('century');
    // `begin` and `setKind` are stable and only the table decides whether a new draft starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.id]);

  if (table.kind !== 'room')
    return <Navigate to={tablePath(pathname, table.id, '/start')} replace />;
  if (!start.isSuccess && table.game)
    return <Navigate to={tablePath(pathname, table.id)} replace />;
  if (table.outOfOrder) {
    return <Navigate to={tablePath(pathname, table.id, '/back-in-order')} replace />;
  }

  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const player = draft.players[0];
  const price = hourly ?? owners;
  const priceOk = isValidRoomHourly(price);
  const preview = roomPreview(priceOk ? price : owners, category?.minMinutes ?? 60);
  const money = (value: number) => formatRs(value, lang);

  const submit = () => {
    if (!player || !priceOk) return;
    start.mutate(
      { tableId: table.id, request: { underPlayerId: player.id, hourly: price } },
      {
        onSuccess: () => {
          draft.reset();
          close();
        },
      },
    );
  };

  const stepper =
    'flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] border border-c-line-2 bg-c-panel text-[30px] font-semibold text-c-text transition-colors duration-150 active:bg-c-raised disabled:opacity-40';

  return (
    <CounterDialog
      width={1066}
      titleSize="lg"
      lead={table.number}
      leadSize={80}
      kickerPlain
      showClose={false}
      kicker={t('room.kickerStart', { name })}
      title={t('room.titleStart', { name })}
      onClose={close}
      actions={
        <>
          <span className="min-w-0 flex-[1_1_300px] text-[16px] text-c-text-2">
            {t('room.startTime')}
          </span>
          <Button theme="counter" size="counter-main" className="px-6 text-[19px]" onClick={close}>
            {t('cancel')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="px-[34px] text-[20px]"
            disabled={!player || !priceOk || start.isPending}
            onClick={submit}
          >
            {t('room.start', { name })}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2.5">
        <span className="text-[18px] font-bold">{t('room.under')}</span>
        {player ? (
          <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-3 rounded-[16px] border-2 border-c-ok-line bg-c-ok-bg px-[18px] py-2">
            <span className="flex min-w-0 flex-col">
              <span className="text-[22px] font-bold">{player.name}</span>
              <span className="text-[15px] text-c-text-2">
                {t('room.whole', {
                  tail: player.phone ? showPhone(player.phone) : (player.phoneTail ?? ''),
                })}
              </span>
            </span>
            <Button
              theme="counter"
              className="px-4 text-[16px]"
              drawn={52}
              onClick={() => draft.remove(player.id)}
            >
              {t('room.change')}
            </Button>
          </div>
        ) : (
          <PlayerSearch
            label={t('room.search')}
            query={query}
            onQuery={setQuery}
            exclude={[]}
            variant="compact"
            rows={2}
            onPick={(picked) => {
              draft.pick(picked);
              setQuery('');
            }}
            onAddNew={(typed) => {
              draft.setReturnTo(pathname);
              navigate(newPlayerPath(pathname, table.id), { state: { name: typed } });
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-[18px] rounded-[18px] border border-c-line bg-c-raised px-[22px] py-5">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-1">
          <label htmlFor={priceId} className="text-[19px] font-bold">
            {t('room.price')}
          </label>
          <span className="text-[16px] text-c-text-2">
            {t('room.priceNote', { amount: money(owners) })}
          </span>
        </div>
        <div className="flex items-center gap-2.5" dir="ltr">
          <button
            type="button"
            aria-label={t('room.lower')}
            disabled={price <= ROOM_HOURLY_MIN}
            onClick={() => setHourly(Math.max(ROOM_HOURLY_MIN, price - STEP))}
            className={cx(stepper, focusRing.counter)}
          >
            −
          </button>
          <div className="flex min-h-[64px] items-center gap-1.5 rounded-[16px] border-2 border-c-brass bg-c-page px-4 focus-within:border-c-brass">
            <span className="text-[18px] text-c-text-2">{t('double.rs')}</span>
            <input
              id={priceId}
              inputMode="numeric"
              autoComplete="off"
              value={formatAmount(price)}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
                setHourly(digits === '' ? 0 : Number(digits));
              }}
              className="w-[110px] bg-transparent text-center font-num text-[40px] font-semibold text-c-text outline-none"
            />
          </div>
          <button
            type="button"
            aria-label={t('room.raise')}
            disabled={price >= ROOM_HOURLY_MAX}
            onClick={() => setHourly(Math.min(ROOM_HOURLY_MAX, price + STEP))}
            className={cx(stepper, focusRing.counter)}
          >
            +
          </button>
        </div>
      </div>

      {priceOk ? null : (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {t('room.hourlyRange', { min: money(ROOM_HOURLY_MIN), max: money(ROOM_HOURLY_MAX) })}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {[
          { label: t('room.first'), value: money(preview.firstAmount) },
          { label: t('room.afterEvery'), value: perMinuteMoney(preview.perMinute, lang) },
          {
            label: t('room.example', { duration: exampleWords(preview.exampleMinutes, t) }),
            value: money(preview.exampleAmount),
          },
        ].map((box) => (
          <div
            key={box.label}
            className="flex min-w-0 flex-[1_1_260px] flex-col gap-1 rounded-[16px] border border-c-line bg-c-page px-5 py-4"
          >
            <span className="text-[16px] text-c-text-2">{box.label}</span>
            <span className="font-num text-[34px] font-semibold leading-tight">{box.value}</span>
          </div>
        ))}
      </div>
      {start.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {start.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
