import {
  basketTotal,
  canAddOne,
  formatRs,
  stockState,
  type CounterCanteenItem,
  type PlayerWithTail,
} from '@stockers/shared';
import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { cx } from '@/ui/cx';
import { IconButton } from '@/ui/IconButton';
import { Segmented } from '@/ui/Segmented';
import { focusRing } from '@/ui/theme';
import { useCanteenItems, usePlayers, useSellCanteen, useToday } from '../../api';
import { PageHeader } from '../../components/PageHeader';
import { PlayerSearch } from '../../start/PlayerSearch';
import { useBusyPlayers } from '../../start/use-busy-players';
import { firstName } from '../table/game-info';

type ItemType = 'all' | CounterCanteenItem['category'];
type Mode = 'player' | 'cash';

const TYPES: ItemType[] = ['all', 'drinks', 'food', 'cigarettes'];

/** An item's tile: its name, its price and what is left. The ones in the order have a brass edge and their count. */
function ItemTile({
  item,
  inOrder,
  onAdd,
}: {
  item: CounterCanteenItem;
  inOrder: number;
  onAdd: () => void;
}) {
  const { t } = useTranslation('canteen');
  const { lang } = useFormat();
  const state = stockState(item);
  const soldOut = state === 'soldOut';
  const stockWords =
    state === 'fresh'
      ? t('item.fresh')
      : soldOut
        ? t('item.soldOut')
        : t(state === 'low' ? 'item.low' : 'item.left', { count: item.stock ?? 0 });
  const full = !canAddOne(item, inOrder);

  return (
    <button
      type="button"
      disabled={soldOut}
      aria-disabled={full || undefined}
      aria-label={`${item.name}, ${formatRs(item.sell, lang)}, ${stockWords}${inOrder > 0 ? `, ${t('item.inBasket', { count: inOrder })}` : ''}`}
      onClick={() => {
        if (!full) onAdd();
      }}
      className={cx(
        'flex min-h-[120px] min-w-0 flex-col justify-between rounded-[16px] px-4 py-3.5 text-start transition-colors duration-150',
        soldOut
          ? 'cursor-not-allowed border border-dashed border-c-soldout-line bg-c-soldout-bg text-c-note-icon'
          : inOrder > 0
            ? 'border-2 border-c-brass bg-c-selected text-c-text'
            : 'border border-c-line bg-c-panel text-c-text active:bg-c-raised',
        focusRing.counter,
      )}
    >
      <span aria-hidden="true" className="flex w-full items-start justify-between gap-2">
        <span className="text-[19px] font-bold">{item.name}</span>
        {inOrder > 0 ? (
          <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-full bg-c-brass px-1 font-bold text-c-brass-ink">
            {inOrder}
          </span>
        ) : null}
      </span>
      <span aria-hidden="true" className="flex w-full items-baseline justify-between gap-2">
        <span className="font-num text-[28px] font-semibold">{formatRs(item.sell, lang)}</span>
        <span
          className={cx(
            'text-[14px]',
            state === 'low'
              ? 'font-semibold text-c-warn-ink'
              : soldOut
                ? 'font-semibold text-c-danger-ink'
                : 'text-c-text-2',
          )}
        >
          {stockWords}
        </span>
      </span>
    </button>
  );
}

/**
 * Screen 28, `/canteen`: "Canteen sale". The items with their stock (made fresh, N left, low, sold out) in four tabs; tap an
 * item to add it to the order. The order is charged to a player's bill (it is paid at checkout with his games) or sold for
 * cash with no name, and the money is taken now (Q10). The stock goes down with each sale, and the server refuses more than is
 * left. After a sale the order is empty again for the next customer.
 */
export function Canteen() {
  const { t } = useTranslation('canteen');
  const { t: tBoard } = useTranslation('board');
  const { t: tCheckout } = useTranslation('checkout');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { playerId?: string } | null };
  const items = useCanteenItems();
  const everyone = usePlayers();
  const today = useToday();
  const busy = useBusyPlayers();
  const sell = useSellCanteen();

  const [type, setType] = useState<ItemType>('all');
  const [mode, setMode] = useState<Mode>('player');
  const [playerId, setPlayerId] = useState<string | null>(state?.playerId ?? null);
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Record<string, number>>({});
  const [method, setMethod] = useState('cash');

  const money = (value: number) => formatRs(value, lang);
  const all = useMemo(() => items.data ?? [], [items.data]);
  const shown = type === 'all' ? all : all.filter((item) => item.category === type);
  const lines = useMemo(
    () =>
      all
        .filter((item) => (order[item.id] ?? 0) > 0)
        .map((item) => ({ item, qty: order[item.id] ?? 0 })),
    [all, order],
  );
  const total = basketTotal(lines.map(({ item, qty }) => ({ sell: item.sell, qty })));
  const player: PlayerWithTail | undefined = everyone.data?.find((p) => p.id === playerId);
  const methods = (today.data?.methods ?? []).map((m) => ({
    id: m.id,
    name: tCheckout(`methods.${m.id}` as never, { defaultValue: m.name }),
  }));

  const change = (itemId: string, by: 1 | -1) =>
    setOrder((current) => {
      const next = Math.max(0, (current[itemId] ?? 0) + by);
      const updated = { ...current, [itemId]: next };
      if (next === 0) delete updated[itemId];
      return updated;
    });

  const tableName = (id: string) => {
    const table = busy.get(id)?.table;
    return table
      ? tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') })
      : undefined;
  };
  const playerLine = (p: PlayerWithTail) => {
    const tail = p.phoneTail ?? '';
    const table = tableName(p.id);
    if (table) return t('player.playing', { tail, table });
    if (p.balance > 0) return t('player.owes', { tail, amount: money(p.balance) });
    return t('player.plain', { tail });
  };

  const ready = lines.length > 0 && (mode === 'cash' || player !== undefined);
  // No question and no note here: the cream Undo toast says what was sold and keeps the Undo for 2 minutes (D65).
  const done = () => {
    setOrder({});
    setPlayerId(null);
    setQuery('');
    setMethod('cash');
  };
  const submit = () => {
    if (!ready) return;
    const request = lines.map(({ item, qty }) => ({ itemId: item.id, qty }));
    if (mode === 'player' && player) {
      sell.mutate({ playerId: player.id, items: request }, { onSuccess: done });
    } else {
      sell.mutate({ playerId: null, items: request, payNow: method }, { onSuccess: done });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader back={t('back')} onBack={() => navigate('/')} title={t('title')} />
      <main className="flex flex-1 flex-wrap items-start gap-5 px-6 pb-6 pt-[18px]">
        <section
          aria-label={t('itemsLabel')}
          className="flex min-w-0 flex-[999_1_600px] flex-col gap-3.5"
        >
          <div role="group" aria-label={t('typesLabel')} className="flex flex-wrap gap-2.5">
            {TYPES.map((option) => {
              const selected = type === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setType(option)}
                  className={cx(
                    'min-h-[56px] rounded-[14px] px-[22px] text-[18px] text-c-text transition-colors duration-150',
                    selected
                      ? 'border-2 border-c-brass bg-c-raised font-bold'
                      : 'border border-c-line bg-c-panel active:bg-c-raised-2',
                    focusRing.counter,
                  )}
                >
                  {t(`types.${option}`)}
                </button>
              );
            })}
          </div>

          {items.isError ? (
            <p role="alert" className="m-0 text-[18px] text-c-danger-ink">
              {t('loadFailed')}
            </p>
          ) : null}
          <ul className="m-0 grid list-none grid-cols-4 gap-3 p-0">
            {shown.map((item) => (
              <li key={item.id} className="flex min-w-0">
                <div className="flex min-w-0 flex-1 flex-col [&>button]:flex-1">
                  <ItemTile
                    item={item}
                    inOrder={order[item.id] ?? 0}
                    onAdd={() => change(item.id, 1)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside
          aria-label={t('orderLabel')}
          className="box-content flex min-w-0 flex-[1_1_380px] flex-col gap-3.5 rounded-[22px] border border-c-line bg-c-panel p-5"
        >
          <h2 className="m-0 text-[21px] font-bold">{t('chargeTo')}</h2>
          <Segmented<Mode>
            theme="counter"
            label={t('chargeTo')}
            value={mode}
            onChange={setMode}
            className="w-full bg-c-page [&>button]:flex-1 [&>button]:text-[17px]"
            options={[
              { value: 'player', label: t('mode.player') },
              { value: 'cash', label: t('mode.cash') },
            ]}
          />

          {mode === 'player' ? (
            player ? (
              <div className="flex min-h-[72px] items-center justify-between gap-3 rounded-[14px] border-2 border-c-ok-line bg-c-ok-bg px-4 py-2">
                <span className="flex min-w-0 flex-col">
                  <span className="text-[20px] font-bold">{player.name}</span>
                  <span className="text-[15px] text-c-text-2">{playerLine(player)}</span>
                </span>
                <Button
                  theme="counter"
                  variant="outline"
                  drawn={48}
                  className="text-[16px]"
                  onClick={() => setPlayerId(null)}
                >
                  {t('player.change')}
                </Button>
              </div>
            ) : (
              <PlayerSearch
                label={t('player.searchLabel')}
                placeholder={t('player.search')}
                query={query}
                onQuery={setQuery}
                exclude={[]}
                rows={4}
                variant="compact"
                onPick={(picked) => setPlayerId(picked.id)}
                onAddNew={(name) => navigate('/players/new?back=canteen', { state: { name } })}
              />
            )
          ) : (
            <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 rounded-[14px] border-0 bg-c-page p-3.5">
              <legend className="float-start mb-1 p-0 text-[17px] font-semibold">
                {t('paidBy')}
              </legend>
              <div className="clear-both grid grid-cols-2 gap-2.5">
                {methods.map((option) => {
                  const selected = option.id === method;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setMethod(option.id)}
                      className={cx(
                        'min-h-[56px] rounded-[14px] px-2 text-[18px] text-c-text transition-colors duration-150',
                        selected
                          ? 'border-2 border-c-brass bg-c-selected font-bold'
                          : 'border border-c-line-2 bg-c-raised font-semibold active:bg-c-raised-2',
                        focusRing.counter,
                      )}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-1 flex flex-col gap-2">
            {lines.length === 0 ? (
              <p className="m-0 py-2 text-[16px] text-c-text-2">{t('basket.empty')}</p>
            ) : (
              lines.map(({ item, qty }) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-c-line py-2">
                  <span className="min-w-0 flex-1 text-[18px] font-semibold">{item.name}</span>
                  <IconButton
                    theme="counter"
                    drawn={48}
                    label={t('basket.less', { name: item.name.toLowerCase() })}
                    icon={<Minus size={20} strokeWidth={2.2} />}
                    onClick={() => change(item.id, -1)}
                  />
                  <span className="min-w-6 text-center text-[20px] font-bold">{qty}</span>
                  <IconButton
                    theme="counter"
                    drawn={48}
                    label={t('basket.more', { name: item.name.toLowerCase() })}
                    icon={<Plus size={20} strokeWidth={2.2} />}
                    disabled={!canAddOne(item, qty)}
                    onClick={() => change(item.id, 1)}
                  />
                  <span className="min-w-[76px] text-end text-[18px] font-semibold">
                    {money(item.sell * qty)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[20px] font-bold">{t('basket.total')}</span>
            <span className="font-num text-[48px] font-bold leading-none">{money(total)}</span>
          </div>
          <button
            type="button"
            disabled={!ready || sell.isPending}
            onClick={submit}
            className={cx(
              'min-h-[76px] rounded-[16px] bg-c-brass px-4 text-[21px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press disabled:opacity-40',
              focusRing.counter,
            )}
          >
            {mode === 'cash'
              ? t('cash', {
                  amount: money(total),
                  method: methods.find((m) => m.id === method)?.name ?? method,
                })
              : player
                ? t('add', { amount: money(total), name: firstName(player.name) })
                : lines.length > 0
                  ? t('addPick')
                  : t('addEmpty')}
          </button>
          <span className="text-[15px] text-c-text-2">{t('note')}</span>
          {sell.error ? (
            <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
              {sell.error.message}
            </p>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
