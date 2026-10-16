import {
  elapsed,
  formatAmount,
  formatRs,
  isGameOverLimit,
  MINUTE_MS,
  splitEvenly,
} from '@stockers/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { MoneyText } from '@/ui/MoneyText';
import { Segmented } from '@/ui/Segmented';
import { focusRing } from '@/ui/theme';
import { useEndGame } from '../../api';
import { tablePath } from '../../components/table-paths';
import { ChargeButton, KeepButton } from '../../end/buttons';
import { useEndDraft } from '../../end/draft';
import { useCloseTable } from '../../start/use-close';
import { firstName } from '../table/game-info';
import type { EndScreenProps } from './EndGame';

type Mode = 'half' | 'one' | 'custom';
type SideIndex = 0 | 1;

const MAX_DIGITS = 6;

/**
 * Screen 20, `/table/:id/end` for a double frame: "Which side lost?", then how the price is split: half each, one player
 * pays all, or a custom split that must add up to the price (D9). One player alone on a side pays all of it. Charging
 * goes on to "Charge double?" (19) first when the frame is past its own time limit; a custom split doubles with it.
 */
export function EndDouble({ table, board, game }: EndScreenProps) {
  const { t } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const now = useNow(1000);
  const end = useEndGame();
  const draft = useEndDraft();
  const groupId = useId();

  const [side, setSide] = useState<SideIndex | null>(null);
  const [mode, setMode] = useState<Mode>('half');
  const [payer, setPayer] = useState<string | null>(null);
  const [custom, setCustom] = useState<Record<string, number>>({});

  const sides = game.sides ?? [[], []];
  const nameOf = (id: string) => board.players[id]?.name ?? id;
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const elapsedMs = elapsed(game.startedAt, now, game.pausedMs, game.pausedAt);
  const minutes = Math.round(elapsedMs / MINUTE_MS);
  const total = game.price;
  const names = (ids: string[]) => ids.map(nameOf).join(t('and'));

  const losers = side === null ? [] : sides[side];
  const shared = losers.length > 1;
  const even = splitEvenly(total, losers.length > 0 ? losers : ['_']);
  const evenShares = Object.fromEntries(losers.map((id, i) => [id, Object.values(even)[i] ?? 0]));
  const payerId = payer && losers.includes(payer) ? payer : losers[0];
  const amounts: Record<string, number> =
    !shared && losers[0] !== undefined
      ? { [losers[0]]: total }
      : mode === 'one'
        ? Object.fromEntries(losers.map((id) => [id, id === payerId ? total : 0]))
        : mode === 'custom'
          ? Object.fromEntries(losers.map((id) => [id, custom[id] ?? evenShares[id]]))
          : evenShares;
  const sum = Object.values(amounts).reduce((acc, value) => acc + value, 0);
  const adds = losers.length > 0 && sum === total;

  const pickSide = (next: SideIndex) => {
    setSide(next);
    setMode('half');
    setPayer(null);
    setCustom({});
  };

  // Two players share the price, so changing one share changes the other: the two always add up.
  const edit = (id: string, digits: string) => {
    const value = Math.min(total, digits === '' ? 0 : Number(digits.slice(0, MAX_DIGITS)));
    const other = losers.find((candidate) => candidate !== id);
    setCustom({ ...(other ? { [other]: total - value } : {}), [id]: value });
  };

  const chargedIds = mode === 'one' && shared ? [payerId ?? ''] : losers;

  const submit = () => {
    if (side === null || !adds) return;
    const split = mode === 'custom' && shared ? amounts : undefined;
    if (isGameOverLimit(game, elapsedMs)) {
      draft.set({ gameId: game.id, loserIds: chargedIds, split });
      navigate(tablePath(pathname, table.id, '/end/overtime'));
      return;
    }
    end.mutate(
      {
        id: game.id,
        request: { loserIds: chargedIds, ...(split ? { split } : {}) },
      },
      { onSuccess: close },
    );
  };

  return (
    <CounterDialog
      width={1166}
      titleSize={34}
      headerAlign="end"
      kickerPlain
      showClose={false}
      kicker={t('double.kicker', { name, minutes })}
      title={t('double.title')}
      aside={<MoneyText value={total} size="big" className="text-c-text" />}
      onClose={close}
      actions={
        <>
          <KeepButton onClick={close}>{t('keep')}</KeepButton>
          <div className="flex-1" />
          <ChargeButton disabled={side === null || !adds || end.isPending} onClick={submit}>
            {side === null
              ? t('double.choose')
              : t('double.charge', {
                  names: chargedIds.map((id) => firstName(nameOf(id))).join(t('and')),
                })}
          </ChargeButton>
        </>
      }
    >
      <div className="flex flex-wrap gap-4">
        {([0, 1] as const).map((index) => {
          const selected = side === index;
          return (
            <button
              key={index}
              type="button"
              aria-pressed={selected}
              onClick={() => pickSide(index)}
              className={cx(
                'flex min-h-[150px] min-w-0 flex-[1_1_380px] flex-col justify-center gap-1.5 rounded-[22px] px-6 text-start transition-colors duration-150',
                selected
                  ? 'border-[3px] border-c-brass bg-c-selected'
                  : 'border-2 border-c-line-2 bg-c-raised active:bg-c-raised-2',
                focusRing.counter,
              )}
            >
              <span
                className={cx(
                  'text-[17px]',
                  selected ? 'font-semibold text-c-brass' : 'text-c-text-2',
                )}
              >
                {selected
                  ? t(index === 0 ? 'double.lostA' : 'double.lostB')
                  : t(index === 0 ? 'double.sideA' : 'double.sideB')}
              </span>
              <span className="text-[28px] font-bold leading-tight">{names(sides[index])}</span>
            </button>
          );
        })}
      </div>

      {side !== null ? (
        <section
          aria-labelledby={groupId}
          className="flex flex-col gap-3.5 rounded-[18px] border border-c-line bg-c-raised px-[22px] py-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id={groupId} className="m-0 text-[20px] font-bold">
              {t('double.split', { amount: formatRs(total, lang) })}
            </h3>
            {shared ? (
              <Segmented<Mode>
                theme="counter"
                label={t('double.splitLabel')}
                drawn={52}
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'half', label: t('double.half') },
                  { value: 'one', label: t('double.one') },
                  { value: 'custom', label: t('double.custom') },
                ]}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3.5">
            {losers.map((id) => (
              <ShareRow
                key={id}
                name={nameOf(id)}
                amount={amounts[id] ?? 0}
                rs={t('double.rs')}
                editable={mode === 'custom' && shared}
                picks={mode === 'one' && shared}
                picked={id === payerId}
                payLabel={t('double.pays', { name: firstName(nameOf(id)) })}
                onPick={() => setPayer(id)}
                onEdit={(digits) => edit(id, digits)}
              />
            ))}
          </div>
          {!adds ? (
            <p role="alert" className="m-0 text-[16px] text-c-danger-ink">
              {t('double.mismatch', { sum: formatRs(sum, lang), total: formatRs(total, lang) })}
            </p>
          ) : null}
        </section>
      ) : null}
      {end.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {end.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}

/** One loser and what he pays (screen 20). It is a field in a custom split and a button when one player pays all. */
function ShareRow({
  name,
  amount,
  rs,
  editable,
  picks,
  picked,
  payLabel,
  onPick,
  onEdit,
}: {
  name: string;
  amount: number;
  rs: string;
  editable: boolean;
  picks: boolean;
  picked: boolean;
  payLabel: string;
  onPick: () => void;
  onEdit: (digits: string) => void;
}) {
  const id = useId();
  const look = cx(
    'flex min-h-[72px] min-w-0 flex-[1_1_280px] items-center justify-between rounded-[14px] bg-c-panel px-5 text-start',
    picked && picks ? 'border-2 border-c-brass' : 'border border-c-line-2',
  );
  const number = 'w-[90px] text-end font-num text-[36px] font-semibold text-c-text';
  // A field only in a custom split; otherwise the amount is words (half each and one pays all are worked out for him).
  const value = (
    <span className="flex items-baseline gap-1.5" dir="ltr">
      <span className="text-[18px] text-c-text-2">{rs}</span>
      {editable ? (
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={formatAmount(amount)}
          onChange={(event) => onEdit(event.target.value.replace(/\D/g, ''))}
          className={cx(number, 'h-14 bg-transparent outline-none')}
        />
      ) : (
        <span className={number}>{formatAmount(amount)}</span>
      )}
    </span>
  );
  if (picks) {
    return (
      <button
        type="button"
        aria-pressed={picked}
        aria-label={payLabel}
        onClick={onPick}
        className={cx(look, focusRing.counter)}
      >
        <span className="text-[20px] font-semibold">{name}</span>
        {value}
      </button>
    );
  }
  if (editable) {
    return (
      <div className={look}>
        <label htmlFor={id} className="text-[20px] font-semibold">
          {name}
        </label>
        {value}
      </div>
    );
  }
  return (
    <div role="group" aria-label={name} className={look}>
      <span className="text-[20px] font-semibold">{name}</span>
      {value}
    </div>
  );
}
