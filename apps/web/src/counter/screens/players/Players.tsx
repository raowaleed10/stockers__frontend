import {
  accountCounts,
  accountList,
  creditAgeDays,
  formatRs,
  rankPlayerResults,
  statementSince,
  type AccountFilter,
  type PlayerWithTail,
  type StatementPeriod,
} from '@stockers/shared';
import { Plus, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { cx } from '@/ui/cx';
import { Segmented } from '@/ui/Segmented';
import { StatementTable } from '@/ui/StatementTable';
import { focusRing, focusWithinRing } from '@/ui/theme';
import { usePlayers, useStatement } from '../../api';
import { PageHeader } from '../../components/PageHeader';
import { firstName } from '../table/game-info';

const FILTERS: AccountFilter[] = ['all', 'owe', 'advance'];
const PERIODS: StatementPeriod[] = ['zero', 'month', 'all'];

/**
 * Screen 30, `/players` and `/players/:id`: "Players and their statements". The list on the left (search by name or phone,
 * and All, Owe money and Advance with their counts) and the selected player's account on the right, like a bank statement:
 * what he owes or holds, every line with its balance, a period (since his balance was last zero, this month, all), and
 * "Checkout Kamran" for his bill. "New player" adds one and opens his page.
 */
export function Players() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('players');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const now = useNow(60_000);
  const everyone = usePlayers();
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [query, setQuery] = useState('');
  const queryId = useId();
  const typed = query.trim();
  const found = usePlayers(typed || undefined);
  const money = (value: number) => formatRs(value, lang);

  const counts = accountCounts(everyone.data ?? []);
  const list = useMemo(() => {
    const base = typed ? rankPlayerResults(found.data ?? [], typed) : (everyone.data ?? []);
    if (typed) {
      // A search keeps its own order; the filter only takes players out.
      return base.filter(
        (player) =>
          filter === 'all' || (filter === 'owe' ? player.balance > 0 : player.balance < 0),
      );
    }
    return accountList(base, filter);
  }, [typed, found.data, everyone.data, filter]);

  const lineOf = (player: PlayerWithTail) => {
    const tail = player.phoneTail ?? '';
    if (player.balance > 0 && player.oldestUnpaidAt) {
      const days = creditAgeDays(player.oldestUnpaidAt, now);
      return days === 0 ? t('line.tonight', { tail }) : t('line.oldest', { tail, count: days });
    }
    if (player.balance > 0) return t('line.plain', { tail });
    if (player.balance < 0) return t('line.advance', { tail });
    return t('line.clear', { tail });
  };

  return (
    // The page is as tall as the screen: the list scrolls inside it, so a long list never makes the page scroll.
    <div className="flex h-screen min-h-0 flex-col">
      <PageHeader
        back={t('back')}
        onBack={() => navigate('/')}
        title={t('title')}
        actions={
          <Button
            theme="counter"
            variant="outline"
            className="px-5 text-[18px]"
            icon={<Plus size={22} strokeWidth={2.4} />}
            onClick={() => navigate('/players/new?back=players')}
          >
            {t('new')}
          </Button>
        }
      />
      <main className="flex min-h-0 flex-1 flex-wrap items-start gap-5 px-6 pb-6 pt-[18px]">
        <section
          aria-label={t('list')}
          className="flex max-h-full min-h-0 min-w-0 flex-[1_1_380px] flex-col gap-3"
        >
          <div
            className={cx(
              'flex min-h-[64px] items-center gap-3 rounded-[16px] border-2 border-c-line-2 bg-c-panel px-[18px] focus-within:border-c-brass',
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
              {t('searchLabel')}
            </label>
            <input
              id={queryId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search')}
              autoComplete="off"
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-[20px] text-c-text outline-none placeholder:text-c-text-2"
            />
          </div>
          <div role="group" aria-label={t('filterLabel')} className="flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <Chip
                key={option}
                theme="counter"
                drawn={48}
                selected={filter === option}
                onClick={() => setFilter(option)}
              >
                {t(option, { count: counts[option] })}
              </Chip>
            ))}
          </div>

          {everyone.isError ? (
            <p role="alert" className="m-0 text-[18px] text-c-danger-ink">
              {t('loadFailed')}
            </p>
          ) : null}
          {list.length === 0 && !everyone.isPending ? (
            <p className="m-0 rounded-[14px] border border-c-line bg-c-panel px-4 py-5 text-[18px] text-c-text-2">
              {t('none')}
            </p>
          ) : (
            <ul
              aria-label={t('list')}
              className="m-0 flex min-h-0 list-none flex-col gap-3 overflow-y-auto p-0"
            >
              {list.map((player) => {
                const selected = player.id === id;
                return (
                  <li key={player.id} className="flex">
                    <button
                      type="button"
                      aria-current={selected ? 'true' : undefined}
                      onClick={() => navigate(`/players/${player.id}`)}
                      className={cx(
                        'flex min-h-[72px] w-full min-w-0 items-center justify-between gap-3 rounded-[14px] px-4 text-start text-c-text transition-colors duration-150',
                        selected
                          ? 'border-2 border-c-brass bg-c-raised'
                          : 'border border-c-line bg-c-panel active:bg-c-raised',
                        focusRing.counter,
                      )}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[19px] font-bold">{player.name}</span>
                        <span className="text-[14px] text-c-text-2">{lineOf(player)}</span>
                      </span>
                      {player.balance === 0 ? null : (
                        <span
                          className={cx(
                            'shrink-0 text-[19px] font-bold',
                            player.balance > 0 ? 'text-c-warn-ink' : 'text-c-ok-ink',
                          )}
                        >
                          {money(Math.abs(player.balance))}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-label={t('statementLabel')}
          className="flex max-h-full min-w-0 flex-[999_1_640px] flex-col gap-3.5 overflow-y-auto rounded-[22px] border border-c-line bg-c-panel px-6 py-[22px]"
        >
          {id ? <Account id={id} /> : <p className="m-0 text-[18px] text-c-text-2">{t('pick')}</p>}
        </section>
      </main>
    </div>
  );
}

/** One player's account: who he is, what he owes or holds, his lines for a period, and the way to his bill. */
function Account({ id }: { id: string }) {
  const { t } = useTranslation('players');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const now = useNow(60_000);
  const statement = useStatement(id);
  const [period, setPeriod] = useState<StatementPeriod>('zero');

  const data = statement.data;
  const lines = useMemo(
    () => (data ? statementSince(data.lines, period, now) : []),
    [data, period, now],
  );

  if (statement.isError)
    return <p className="m-0 text-[18px] text-c-danger-ink">{t('loadFailed')}</p>;
  if (!data) return null;

  const { player } = data;
  const balance = player.balance;
  const label = balance > 0 ? t('owes') : balance < 0 ? t('advanceTitle') : t('clear');

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3.5">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-[28px] font-bold">{player.name}</h2>
          <span className="text-[16px] text-c-text-2">
            {t('sub', {
              phone: player.phone ?? player.phoneTail ?? '',
              played: player.framesPlayed,
              won: player.framesWon,
            })}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={cx(
              'text-[16px] font-semibold',
              balance > 0 ? 'text-c-warn-ink' : balance < 0 ? 'text-c-ok-ink' : 'text-c-text-2',
            )}
          >
            {label}
          </span>
          <span className="font-num text-[48px] font-bold leading-none">
            {formatRs(Math.abs(balance), lang)}
          </span>
        </div>
      </div>

      {lines.length === 0 ? (
        <p className="m-0 rounded-[16px] border border-c-line px-4 py-5 text-[18px] text-c-text-2">
          {t('empty')}
        </p>
      ) : (
        <StatementTable
          theme="counter"
          size="lg"
          caption={t('caption')}
          lines={lines}
          className="rounded-[16px] border border-c-line"
        />
      )}

      <div className="mt-1 flex flex-wrap gap-3">
        <Segmented<StatementPeriod>
          theme="counter"
          label={t('periodLabel')}
          drawn={52}
          value={period}
          onChange={setPeriod}
          options={PERIODS.map((value) => ({ value, label: t(`period.${value}`) }))}
        />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => navigate(`/checkout/${player.id}`)}
          className={cx(
            'inline-flex min-h-[60px] items-center rounded-[14px] bg-c-brass px-[30px] text-[19px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press',
            focusRing.counter,
          )}
        >
          {t('checkout', { name: firstName(player.name) })}
        </button>
      </div>
    </>
  );
}
