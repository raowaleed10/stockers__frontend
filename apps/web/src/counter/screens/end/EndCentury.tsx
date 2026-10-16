import { centuryBreakdown, formatRs, MINUTE_MS } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/lib/use-format';
import { useNow } from '@/lib/clock';
import { CounterDialog } from '@/ui/CounterDialog';
import { MoneyText } from '@/ui/MoneyText';
import { useEndCentury } from '../../api';
import { RichText } from '../../components/RichText';
import { ChargeButton, KeepButton } from '../../end/buttons';
import { useCloseTable } from '../../start/use-close';
import type { EndScreenProps } from './EndGame';

/**
 * Screen 21, `/table/:id/end` for a Century: "End Century for Saad Hussain?". The time on the table, the whole minutes
 * charged (extra seconds are not), the rate set at the start, and the minutes paused (not charged). The charge is
 * minutes x rate and goes on his bill; how the players share it is up to them (D11).
 */
export function EndCentury({ table, board, game }: EndScreenProps) {
  const { t } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const format = useFormat();
  const close = useCloseTable();
  const now = useNow(1000);
  const end = useEndCentury();

  const info = centuryBreakdown(game, now);
  const who = board.players[game.underPlayerId ?? '']?.name ?? '';
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const money = (value: number) => formatRs(value, format.lang);
  const seconds = Math.floor(info.onTableMs / 1000);

  const stats: { label: string; value: string }[] = [
    {
      label: t('century.onTable'),
      value: t('century.sec', { min: Math.floor(info.onTableMs / MINUTE_MS), sec: seconds % 60 }),
    },
    {
      label: t('century.minutesCharged'),
      value: t('century.min', { count: info.chargedMinutes }),
    },
    {
      label: t('century.rate'),
      value: t('century.perMinute', { rate: money(info.rate) }),
    },
    { label: t('century.paused'), value: t('century.min', { count: info.pausedMinutes }) },
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
          i18nKey="century.kicker"
          values={{ name, time: format.clock(game.startedAt) }}
        />
      }
      title={t('century.title', { who })}
      onClose={close}
      actions={
        <>
          <KeepButton onClick={close}>{t('keep')}</KeepButton>
          <div className="flex-1" />
          <ChargeButton
            disabled={end.isPending}
            onClick={() => end.mutate(game.id, { onSuccess: close })}
          >
            {t('century.confirm', { amount: money(info.amount) })}
          </ChargeButton>
        </>
      }
    >
      <dl className="m-0 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-0 flex-col gap-1 rounded-[16px] bg-c-raised px-5 py-4"
          >
            <dt className="text-[16px] text-c-text-2">{stat.label}</dt>
            <dd className="m-0 font-num text-[40px] font-semibold leading-tight">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-2 border-c-ok-line bg-c-ok-bg px-6 py-5">
        <span className="text-[20px] font-semibold">
          <RichText
            ns="end"
            i18nKey="century.sum"
            values={{ minutes: info.chargedMinutes, rate: money(info.rate), who }}
          />
        </span>
        <MoneyText value={info.amount} size="total" />
      </div>
      <p className="m-0 text-[16px] text-c-text-2">{t('century.note')}</p>
      {end.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {end.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
