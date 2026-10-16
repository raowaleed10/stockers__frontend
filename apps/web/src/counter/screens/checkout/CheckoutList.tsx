import {
  formatRs,
  rankPlayerResults,
  type PlayerWithTail,
  type WaitingBill,
} from '@stockers/shared';
import { Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { Segmented } from '@/ui/Segmented';
import { focusRing, focusWithinRing } from '@/ui/theme';
import { useCheckoutList, usePlayers } from '../../api';
import { useBillLine, type BillLineTone } from '../../checkout/bill-line';
import { useCheckoutDraft } from '../../checkout/draft';
import { PageHeader } from '../../components/PageHeader';

type Tab = 'waiting' | 'before';

/** What a bill card shows: the same four things for a bill, an old balance and a search result. */
interface Card {
  id: string;
  name: string;
  tail: string;
  text: string;
  tone: BillLineTone;
  amount: number;
}

const TONE: Record<BillLineTone, string> = {
  plain: 'text-c-text-3',
  warn: 'text-c-warn-ink',
  ok: 'text-c-ok-ink',
};

/** What the bill screen leaves in the router's state after a payment, for the green note on this page. */
export interface PaidNote {
  name: string;
  paid: number;
  toCredit: number;
  advance: number;
}

/**
 * Screen 24, `/checkout`: "Who is paying?". Every player waiting to pay for tonight as a card with his phone's last
 * digits, what the bill is for and the total to pay; the card of the bill opened last has the brass border. A search box
 * finds any player by name or phone, and "Owes from before" lists the old credit. A tap opens his bill (25). The foot says
 * what happens to anyone not checked out when the sheet closes, and the total still waiting tonight.
 */
export function CheckoutList() {
  const { t } = useTranslation('checkout');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { paid?: PaidNote } | null };
  const list = useCheckoutList();
  const lastOpened = useCheckoutDraft((draft) => draft.lastOpened);
  const [tab, setTab] = useState<Tab>('waiting');
  const [query, setQuery] = useState('');
  const queryId = useId();
  const typed = query.trim();
  const found = usePlayers(typed || undefined);
  const everyone = usePlayers();
  const billLine = useBillLine();
  const money = (value: number) => formatRs(value, lang);

  const bills = list.data?.bills ?? [];

  const billCard = (bill: WaitingBill): Card => ({
    id: bill.playerId,
    name: bill.name,
    tail: bill.phoneTail ?? '',
    ...billLine(bill),
    amount: bill.total,
  });

  const cards = useMemo((): Card[] => {
    const billOf = new Map(bills.map((bill) => [bill.playerId, bill]));
    const playerCard = (player: PlayerWithTail): Card => {
      const bill = billOf.get(player.id);
      if (bill) return billCard(bill);
      const owes = Math.max(0, player.balance);
      return {
        id: player.id,
        name: player.name,
        tail: player.phoneTail ?? '',
        ...billLine({
          parts: [],
          oldCredit: owes,
          advance: Math.max(0, -player.balance),
          oldestUnpaidAt: player.oldestUnpaidAt,
        }),
        amount: owes,
      };
    };
    if (typed) {
      return rankPlayerResults(found.data ?? [], typed).map(playerCard);
    }
    if (tab === 'waiting') return bills.map(billCard);
    // Old credit: the bills with some, then the players who owe from before and are not waiting tonight.
    const owing = (everyone.data ?? [])
      .filter((player) => !billOf.has(player.id) && player.balance > 0)
      .sort((a, b) => (a.oldestUnpaidAt ?? '').localeCompare(b.oldestUnpaidAt ?? ''))
      .map(playerCard);
    return [...bills.filter((bill) => bill.oldCredit > 0).map(billCard), ...owing];
    // The cards are rebuilt when the data or the words change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, found.data, everyone.data, tab, typed, lang]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader back={t('list.back')} onBack={() => navigate('/')} title={t('list.title')} />
      <main className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-[18px]">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cx(
              'flex min-h-[68px] min-w-0 flex-[1_1_420px] items-center gap-3 rounded-[16px] border-2 border-c-line-2 bg-c-panel px-[18px] focus-within:border-c-brass',
              focusWithinRing.counter,
            )}
          >
            <Search
              aria-hidden="true"
              size={24}
              strokeWidth={2}
              className="shrink-0 text-c-text-2"
            />
            <label htmlFor={queryId} className="sr-only">
              {t('list.searchLabel')}
            </label>
            <input
              id={queryId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('list.search')}
              autoComplete="off"
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-[20px] text-c-text outline-none placeholder:text-c-text-2"
            />
          </div>
          <Segmented<Tab>
            theme="counter"
            label={t('list.show')}
            size="lg"
            drawn={54}
            value={tab}
            onChange={setTab}
            options={[
              {
                value: 'waiting',
                // The count waits for the list, so the tab never says (0) for a moment.
                label: list.data
                  ? t('list.waiting', { count: bills.length })
                  : t('list.waitingPlain'),
              },
              { value: 'before', label: t('list.before') },
            ]}
          />
        </div>

        {state?.paid ? <PaidBanner note={state.paid} /> : null}

        {list.isError ? (
          <p role="alert" className="m-0 text-[18px] text-c-danger-ink">
            {t('loadFailed')}
          </p>
        ) : null}

        {cards.length === 0 && !list.isPending ? (
          <p className="m-0 rounded-[18px] border border-c-line bg-c-panel px-5 py-6 text-[19px] text-c-text-2">
            {typed
              ? t('list.noneFound')
              : tab === 'waiting'
                ? t('list.nobody')
                : t('list.nobodyOwes')}
          </p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0">
            {cards.map((card) => (
              <li key={card.id} className="flex min-w-0">
                <button
                  type="button"
                  aria-current={lastOpened === card.id ? 'true' : undefined}
                  onClick={() => navigate(`/checkout/${card.id}`)}
                  className={cx(
                    'flex min-h-[136px] w-full min-w-0 flex-col gap-2 rounded-[18px] px-[18px] py-4 text-start transition-colors duration-150 active:bg-c-raised',
                    // The brass border is 3 px and the padding stays, so the card (and its row) is 4 px taller, as the PNG draws it.
                    lastOpened === card.id
                      ? 'border-[3px] border-c-brass bg-c-raised'
                      : 'border border-c-line bg-c-panel',
                    focusRing.counter,
                  )}
                >
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span className="text-[21px] font-bold">{card.name}</span>
                    <bdi dir="ltr" className="text-[15px] text-c-text-2">
                      {card.tail}
                    </bdi>
                  </span>
                  <span className={cx('text-[16px]', TONE[card.tone])}>{card.text}</span>
                  <span className="mt-auto font-num text-[32px] font-bold leading-tight">
                    {money(card.amount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap justify-between gap-3 rounded-[14px] border border-c-line bg-c-panel px-[18px] py-3.5 text-[17px] text-c-text-2">
          <span>{t('list.leftNote')}</span>
          <span className="font-bold text-c-text">
            {t('list.waitingTonight', { amount: money(list.data?.total ?? 0) })}
          </span>
        </div>
      </main>
    </div>
  );
}

/** "Bilal Ahmed paid Rs 1,000. Rs 300 stays as credit." after a payment (docs/NO_DESIGN.md). */
function PaidBanner({ note }: { note: PaidNote }) {
  const { t } = useTranslation('checkout');
  const { lang } = useFormat();
  const money = (value: number) => formatRs(value, lang);
  const rest =
    note.toCredit > 0
      ? t('paid.credit', { amount: money(note.toCredit) })
      : note.advance > 0
        ? t('paid.advance', { amount: money(note.advance) })
        : '';
  return (
    <p
      role="status"
      className="m-0 rounded-[14px] border border-c-ok-line bg-c-ok-bg px-[18px] py-3.5 text-[18px] font-semibold text-c-ok-ink"
    >
      {t('paid.done', { name: note.name, amount: money(note.paid) })} {rest}
    </p>
  );
}
