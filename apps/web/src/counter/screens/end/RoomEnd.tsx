import { formatRs, roomBreakdown } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { CounterDialog } from '@/ui/CounterDialog';
import { MoneyText } from '@/ui/MoneyText';
import { useEndRoom } from '../../api';
import { RichText } from '../../components/RichText';
import { boardOfTableScreen, tablePath } from '../../components/table-paths';
import { ChargeButton, KeepButton } from '../../end/buttons';
import { durationWords, perMinuteMoney } from '../../end/duration';
import { useKeptGame } from '../../end/use-kept-game';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';

/**
 * Screen 23, `/room/:id/end`: "End Room 1 for Ali Hassan?". The time in the room, the minutes paused for a power cut
 * (not charged), the first hour at least, then the minutes after it at the hourly price divided by 60; any paisa is
 * rounded to the nearest rupee, once (D12, Q9).
 */
export function RoomEnd() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <RoomEndStep {...context} />}</TableGate>;
}

function RoomEndStep({ table, category, board }: TableContext) {
  const { t } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const format = useFormat();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const now = useNow(1000);
  const end = useEndRoom();
  const game = useKeptGame(table);

  if (!game) return <Navigate to={boardOfTableScreen(pathname)} replace />;
  if (game.type !== 'room') return <Navigate to={tablePath(pathname, table.id, '/end')} replace />;

  const info = roomBreakdown(game, now, category?.minMinutes ?? 60);
  const who = board.players[game.underPlayerId ?? '']?.name ?? '';
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const money = (value: number) => formatRs(value, format.lang);

  const rows: { label: string; value: string; tone?: 'warn' }[] = [
    { label: t('room.inRoom'), value: durationWords(info.onRoomMs, t) },
    ...(info.pausedMinutes > 0
      ? [
          {
            label: t('room.pausedFor'),
            value: `− ${t('duration.m', { m: info.pausedMinutes })}`,
            tone: 'warn' as const,
          },
        ]
      : []),
    { label: t('room.firstHour'), value: money(info.firstAmount) },
    ...(info.extraMinutes > 0
      ? [
          {
            label: t('room.next', {
              minutes: info.extraMinutes,
              rate: perMinuteMoney(game.price / 60, format.lang),
            }),
            value: money(info.extraAmount),
          },
        ]
      : []),
  ];

  return (
    <CounterDialog
      width={966}
      titleSize="lg"
      lead={table.number}
      leadSize={80}
      kickerPlain
      showClose={false}
      kicker={
        <RichText
          ns="end"
          i18nKey="room.kickerEnd"
          values={{ name, time: format.clock(game.startedAt), price: money(game.price) }}
        />
      }
      title={t('room.titleEnd', { name, who })}
      onClose={close}
      actions={
        <>
          <KeepButton onClick={close}>{t('room.keep')}</KeepButton>
          <div className="flex-1" />
          <ChargeButton
            disabled={end.isPending}
            onClick={() => end.mutate(game.id, { onSuccess: close })}
          >
            {t('room.confirm', { amount: money(info.amount) })}
          </ChargeButton>
        </>
      }
    >
      <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[18px] border border-c-line bg-c-raised p-0">
        {rows.map((row) => (
          <li
            key={row.label}
            className={`flex flex-wrap justify-between gap-x-4 border-b border-c-line px-[22px] py-4 text-[19px] last:border-b-0 ${
              row.tone === 'warn' ? 'text-c-warn-ink' : ''
            }`}
          >
            <span>{row.label}</span>
            <bdi className="font-semibold">{row.value}</bdi>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-2 border-c-ok-line bg-c-ok-bg px-6 py-5">
        <span className="text-[20px] font-semibold">
          <RichText ns="end" i18nKey="room.goesOn" values={{ who }} />
        </span>
        <MoneyText value={info.amount} size="total" />
      </div>
      <p className="m-0 text-[16px] text-c-text-2">{t('room.round')}</p>
      {end.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {end.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
