import type { BoardTable } from '@stockers/shared';
import {
  clubDayNumber,
  elapsed,
  formatClock,
  formatDate,
  formatRs,
  formatSlot,
  isOver30,
  toClubIso,
} from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import '@/dev/data/data-i18n';
import { isApiError } from '@/lib/api-client';
import { useNow } from '@/lib/clock';
import { Button } from '@/ui/Button';
import { useLive, useMe, useSignIn, useSignOut, useWorkers } from '../../api';

/** The key of each kind of sign-in event in the page's words. */
const EVENT_WORD = {
  'sign-in': 'signIn',
  'sign-out': 'signOut',
  'auto-sign-out': 'autoSignOut',
  'not-your-time': 'notYourTime',
  'pin-lockout': 'pinLockout',
} as const;

type RowStatus = 'free' | 'playing' | 'over30' | 'paused' | 'outOfOrder' | 'noPrice';

function statusOf(table: BoardTable, now: number): RowStatus {
  if (table.outOfOrder) return 'outOfOrder';
  if (table.price === null) return 'noPrice';
  const game = table.game;
  if (!game) return 'free';
  if (game.status === 'paused') return 'paused';
  const ms = elapsed(game.startedAt, now, game.pausedMs, game.pausedAt);
  return (game.type === 'single' || game.type === 'double') && isOver30(ms) ? 'over30' : 'playing';
}

/**
 * Development only (route `/dev/data` under the owner base path): the workers and the live tables,
 * read from the mock owner API. Any password signs in while the mock is on.
 */
export default function DataPage() {
  const { t } = useTranslation(['data', 'common']);
  const now = useNow();
  const me = useMe();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const workers = useWorkers();
  const live = useLive();

  const names = live.data?.players ?? {};
  const nameOf = (id: string) => names[id]?.name ?? id;
  const refused = [signIn.error, workers.error, live.error].find(isApiError);

  return (
    <main className="min-h-screen bg-o-page px-6 py-8 text-o-ink">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold">{t('title', { ns: 'data' })}</h1>
          <p className="max-w-[760px] text-[16px] text-o-ink-2">{t('intro', { ns: 'data' })}</p>
          <p className="text-[16px]">
            {t('clock', { ns: 'data' })}: <bdi dir="ltr">{formatClock(toClubIso(now))}</bdi>
          </p>
        </header>

        <section aria-labelledby="session" className="flex flex-col gap-3">
          <h2 id="session" className="text-[20px] font-bold">
            {t('session.title', { ns: 'data' })}
          </h2>
          <p data-testid="session">
            {me.data
              ? t('session.signedIn', { ns: 'data', name: me.data.owner.name })
              : me.isLoading
                ? t('loading', { ns: 'data' })
                : t('session.nobody', { ns: 'data' })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              theme="owner"
              variant="primary"
              onClick={() => signIn.mutate({ ownerId: 'aqil', password: 'dev' })}
            >
              {t('session.signInAs', { ns: 'data', name: 'Aqil', pin: 'any password' })}
            </Button>
            <Button theme="owner" onClick={() => signOut.mutate()}>
              {t('session.signOut', { ns: 'data' })}
            </Button>
          </div>
          {refused ? (
            <p role="alert" className="text-[16px] text-o-red" data-testid="refused">
              {t('result.refused', { ns: 'data', code: refused.code, message: refused.message })}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="workers" className="flex flex-col gap-3">
          <h2 id="workers" className="text-[20px] font-bold">
            {t('workers.title', { ns: 'data' })}
          </h2>
          <ul className="flex flex-col gap-2" data-testid="workers">
            {(workers.data ?? []).map((worker) => {
              const { signedIn, lastSignIn } = worker;
              const today = (at: string) =>
                clubDayNumber(at) === clubDayNumber(toClubIso(now))
                  ? t('workers.today', { ns: 'data' })
                  : formatDate(at);
              return (
                <li
                  key={worker.id}
                  data-worker={worker.id}
                  className="flex flex-col gap-2 rounded-card border border-o-line bg-o-card px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <span className="min-w-[120px] text-[18px] font-bold">{worker.name}</span>
                    <span>
                      {t('workers.time', { ns: 'data' })}:{' '}
                      <bdi dir="ltr">{formatSlot(worker.slot)}</bdi>
                    </span>
                  </div>
                  <p className="font-semibold" data-testid={`status-${worker.id}`}>
                    {signedIn
                      ? t('workers.signedInSince', { ns: 'data', time: formatClock(signedIn.at) })
                      : lastSignIn
                        ? t('workers.lastSignedIn', {
                            ns: 'data',
                            day: today(lastSignIn.at),
                            from: formatClock(lastSignIn.at),
                            until: lastSignIn.until ? formatClock(lastSignIn.until) : '',
                          })
                        : t('workers.neverSignedIn', { ns: 'data' })}
                  </p>
                  {worker.signsOutAt ? (
                    <p data-testid={`signs-out-${worker.id}`}>
                      {t('workers.signsOutAt', {
                        ns: 'data',
                        time: formatClock(worker.signsOutAt),
                      })}
                    </p>
                  ) : null}
                  <ol
                    className="flex list-none flex-col gap-1 p-0"
                    data-testid={`events-${worker.id}`}
                  >
                    {worker.sessionEvents.map((event) => (
                      <li key={event.id} data-kind={event.kind} className="text-o-ink-2">
                        <bdi dir="ltr">
                          {today(event.at)} {formatClock(event.at)}
                        </bdi>{' '}
                        {t(`workers.events.${EVENT_WORD[event.kind]}`, { ns: 'data' })}
                      </li>
                    ))}
                  </ol>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="live" className="flex flex-col gap-3">
          <h2 id="live" className="text-[20px] font-bold">
            {t('live.title', { ns: 'data' })}
          </h2>
          <table className="w-full border-collapse text-start" data-testid="live">
            <caption className="sr-only">{t('live.title', { ns: 'data' })}</caption>
            <thead>
              <tr className="text-o-ink-2">
                <th scope="col" className="py-2 text-start">
                  {t('board.table', { ns: 'data' })}
                </th>
                <th scope="col" className="py-2 text-start">
                  {t('board.status', { ns: 'data' })}
                </th>
                <th scope="col" className="py-2 text-start">
                  {t('board.game', { ns: 'data' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {(live.data?.tables ?? []).map((table) => {
                const status = statusOf(table, now);
                const game = table.game;
                const players = game?.playerIds ?? [];
                return (
                  <tr key={table.id} data-table={table.id} className="border-t border-o-line">
                    <th scope="row" className="py-2 text-start font-semibold">
                      {table.name}
                    </th>
                    <td className="py-2">{t(`status.${status}`, { ns: 'common' })}</td>
                    <td className="py-2">
                      {game
                        ? `${
                            players.length === 2
                              ? t('board.versus', {
                                  ns: 'data',
                                  a: nameOf(players[0]),
                                  b: nameOf(players[1]),
                                })
                              : game.underPlayerId
                                ? t('board.under', { ns: 'data', name: nameOf(game.underPlayerId) })
                                : ''
                          } ${formatRs(game.price)}`
                        : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
