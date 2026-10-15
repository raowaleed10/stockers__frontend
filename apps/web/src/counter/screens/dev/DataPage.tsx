import type { PublicWorker } from '@stockers/shared';
import { formatClock, formatRs, formatSlot, tableStatus, toClubIso } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useNow } from '@/lib/clock';
import { isApiError } from '@/lib/api-client';
import '@/dev/data/data-i18n';
import { Button } from '@/ui/Button';
import {
  useBoard,
  useEndGame,
  useMe,
  usePauseAll,
  usePublicWorkers,
  useResumeAll,
  useSignIn,
  useSignOut,
  useStartGame,
} from '../../api';

/** Two sample players for the "Start game" button. They are in the mock data. */
const SAMPLE_PLAYERS: [string, string] = ['ahmed-nawaz', 'ali-akbar'];
const PINS: Record<string, string> = { shabir: '1111', zain: '2222' };

function Message({ error }: { error: unknown }) {
  const { t } = useTranslation('data');
  if (!isApiError(error)) return null;
  return (
    <p role="alert" className="text-[16px] text-c-danger-ink">
      {t('result.refused', { code: error.code, message: error.message })}
    </p>
  );
}

/**
 * Development only (route `/dev/data`): the board and the workers, read from the mock API, and
 * buttons that change it. It is here to check the data layer, not as a screen of the product.
 */
export default function DataPage() {
  const { t } = useTranslation(['data', 'common']);
  const now = useNow();
  const me = useMe();
  const workers = usePublicWorkers();
  const board = useBoard('all');
  const signIn = useSignIn();
  const signOut = useSignOut();
  const start = useStartGame();
  const end = useEndGame();
  const pauseAll = usePauseAll();
  const resumeAll = useResumeAll();

  const used = board.data?.tables.filter((tb) => tb.game).length ?? 0;
  const names = board.data?.players ?? {};
  const nameOf = (id: string) => names[id]?.name ?? id;

  return (
    <main className="min-h-screen bg-c-page px-6 py-8 text-c-text">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold">{t('title', { ns: 'data' })}</h1>
          <p className="max-w-[760px] text-[16px] text-c-text-2">{t('intro', { ns: 'data' })}</p>
          <p className="text-[16px]">
            {t('clock', { ns: 'data' })}: <bdi dir="ltr">{formatClock(toClubIso(now))}</bdi>
          </p>
        </header>

        <section aria-labelledby="session" className="flex flex-col gap-3">
          <h2 id="session" className="text-[22px] font-bold">
            {t('session.title', { ns: 'data' })}
          </h2>
          <p data-testid="session">
            {me.data
              ? `${t('session.signedIn', { ns: 'data', name: me.data.worker.name })} ${t('session.until', { ns: 'data', time: formatClock(me.data.until) })}`
              : me.isLoading
                ? t('loading', { ns: 'data' })
                : t('session.nobody', { ns: 'data' })}
          </p>
          <div className="flex flex-wrap gap-3">
            {(workers.data ?? []).map((worker: PublicWorker) => (
              <Button
                key={worker.id}
                theme="counter"
                variant="primary"
                onClick={() =>
                  signIn.mutate({ workerId: worker.id, pin: PINS[worker.id] ?? '0000' })
                }
              >
                {t('session.signInAs', {
                  ns: 'data',
                  name: worker.name,
                  pin: PINS[worker.id] ?? '0000',
                })}
              </Button>
            ))}
            <Button theme="counter" onClick={() => signOut.mutate()}>
              {t('session.signOut', { ns: 'data' })}
            </Button>
          </div>
          {signIn.isSuccess ? <p>{t('result.ok', { ns: 'data' })}</p> : null}
          <div data-testid="sign-in-error">
            <Message error={signIn.error} />
          </div>
        </section>

        <section aria-labelledby="workers" className="flex flex-col gap-3">
          <h2 id="workers" className="text-[22px] font-bold">
            {t('workers.title', { ns: 'data' })}
          </h2>
          <ul className="flex flex-col gap-2" data-testid="workers">
            {(workers.data ?? []).map((worker) => (
              <li
                key={worker.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-card border border-c-line bg-c-panel px-4 py-3"
              >
                <span className="min-w-[120px] text-[20px] font-bold">{worker.name}</span>
                <span>
                  {t('workers.time', { ns: 'data' })}:{' '}
                  <bdi dir="ltr">{formatSlot(worker.slot)}</bdi>
                </span>
                <span className="font-semibold">
                  {worker.canSignInNow
                    ? t('workers.yourTimeNow', { ns: 'data' })
                    : t('workers.notNow', { ns: 'data' })}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="board" className="flex flex-col gap-3">
          <h2 id="board" className="text-[22px] font-bold">
            {t('board.title', { ns: 'data' })}
          </h2>
          <p>{t('board.inUse', { ns: 'data', used, total: board.data?.tables.length ?? 0 })}</p>
          <div className="flex flex-wrap gap-3">
            <Button theme="counter" onClick={() => pauseAll.mutate()}>
              {t('board.pauseAll', { ns: 'data' })}
            </Button>
            <Button theme="counter" onClick={() => resumeAll.mutate()}>
              {t('board.resumeAll', { ns: 'data' })}
            </Button>
          </div>
          <Message error={board.error ?? start.error ?? end.error ?? pauseAll.error} />
          <table className="w-full border-collapse text-start" data-testid="board">
            <caption className="sr-only">{t('board.title', { ns: 'data' })}</caption>
            <thead>
              <tr className="text-start text-c-text-2">
                <th scope="col" className="py-2 text-start">
                  {t('board.table', { ns: 'data' })}
                </th>
                <th scope="col" className="py-2 text-start">
                  {t('board.status', { ns: 'data' })}
                </th>
                <th scope="col" className="py-2 text-start">
                  {t('board.game', { ns: 'data' })}
                </th>
                <th scope="col" className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(board.data?.tables ?? []).map((table) => {
                const status = tableStatus(table, now);
                const game = table.game;
                const players = game?.playerIds ?? [];
                return (
                  <tr key={table.id} data-table={table.id} className="border-t border-c-line">
                    <th scope="row" className="py-2 text-start font-semibold">
                      {table.name}
                    </th>
                    <td className="py-2">{t(`status.${status}`, { ns: 'common' })}</td>
                    <td className="py-2">
                      {game ? (
                        <>
                          {players.length === 2
                            ? t('board.versus', {
                                ns: 'data',
                                a: nameOf(players[0]),
                                b: nameOf(players[1]),
                              })
                            : game.underPlayerId
                              ? t('board.under', { ns: 'data', name: nameOf(game.underPlayerId) })
                              : null}{' '}
                          <span className="font-semibold">{formatRs(game.price)}</span>
                        </>
                      ) : status === 'free' ? (
                        t('board.free', { ns: 'data' })
                      ) : null}
                    </td>
                    <td className="py-2 text-end">
                      {status === 'free' && table.kind === 'snooker' ? (
                        <Button
                          theme="counter"
                          variant="primary"
                          onClick={() =>
                            start.mutate({
                              tableId: table.id,
                              type: 'single',
                              playerIds: SAMPLE_PLAYERS,
                            })
                          }
                        >
                          {t('board.startGame', { ns: 'data' })}
                        </Button>
                      ) : game && game.type === 'single' ? (
                        <Button
                          theme="counter"
                          onClick={() =>
                            end.mutate({
                              id: game.id,
                              request: { loserIds: [game.playerIds?.[1] ?? ''] },
                            })
                          }
                        >
                          {t('board.endFrame', { ns: 'data' })}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="waiting" className="flex flex-col gap-3">
          <h2 id="waiting" className="text-[22px] font-bold">
            {t('waiting.title', { ns: 'data' })}
          </h2>
          {board.data && board.data.waiting.length === 0 ? (
            <p>{t('waiting.none', { ns: 'data' })}</p>
          ) : null}
          <ul className="flex flex-col gap-2" data-testid="waiting">
            {(board.data?.waiting ?? []).map((bill) => (
              <li
                key={bill.playerId}
                className="flex flex-wrap gap-x-6 rounded-card border border-c-line bg-c-panel px-4 py-3"
              >
                <span className="min-w-[160px] font-bold">{bill.name}</span>
                <span className="text-c-text-2">
                  {bill.parts.map((part) => `${part.count} ${part.item ?? part.kind}`).join(', ')}
                </span>
                <span className="ms-auto font-bold">{formatRs(bill.tonight)}</span>
              </li>
            ))}
          </ul>
          {board.data ? (
            <p className="font-semibold">
              {t('waiting.total', {
                ns: 'data',
                amount: formatRs(board.data.waiting.reduce((sum, bill) => sum + bill.tonight, 0)),
              })}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
