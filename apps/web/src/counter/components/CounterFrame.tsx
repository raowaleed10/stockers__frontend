import type { WorkerSession } from '@stockers/shared';
import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cx } from '@/ui/cx';
import { useBoard } from '../api';
import { useLockStore } from '../session/lock-store';
import { useSwitchWorker } from '../session/use-leave-session';
import { alertsPath } from './alerts-path';
import { CounterActionBar } from './CounterActionBar';
import { CounterTopBar } from './CounterTopBar';
import { IdleLock } from './IdleLock';
import { LockScreen } from './LockScreen';
import { SessionTiming } from './SessionTiming';

/**
 * The frame of every signed-in counter screen: the sign-in time banner, the top bar, the screen itself and the
 * action bar, with the lock over all of it. The board data it needs (sheet, bell count, backup time) comes from
 * the same query the board uses, so there is one call, not two.
 */
export function CounterFrame({ session }: { session: WorkerSession }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const board = useBoard();
  const locked = useLockStore((state) => state.locked);
  const lock = useLockStore((state) => state.lock);
  const switchWorker = useSwitchWorker();
  const frame = useRef<HTMLDivElement>(null);

  // While locked, nothing behind the lock can be reached by touch, keyboard or screen reader.
  useEffect(() => {
    frame.current?.toggleAttribute('inert', locked);
  }, [locked]);

  const go = (path: string) => () => navigate(path);

  return (
    <>
      <div
        ref={frame}
        data-app="counter"
        aria-hidden={locked || undefined}
        // A board taller than the screen scrolls; while locked it must not, so the lock covers exactly the screen.
        className={cx(
          'screen-text flex flex-col bg-c-page font-body text-c-text',
          locked ? 'h-screen overflow-hidden' : 'min-h-screen',
        )}
      >
        <SessionTiming session={session} />
        <CounterTopBar
          sheet={board.data?.sheet}
          notifications={board.data?.unread ?? 0}
          worker={session.worker}
          until={session.until}
          onLock={lock}
          onSwitchWorker={() => void switchWorker()}
          onNotifications={go(alertsPath(pathname))}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
        <CounterActionBar
          backedUpAt={board.data?.backedUpAt}
          onCheckout={go('/checkout')}
          onCanteen={go('/canteen')}
          onPlayers={go('/players')}
          onToday={go('/today')}
          onExpense={go('/expense')}
          onPauseAll={go('/pause-all')}
          onCloseSheet={go('/close-sheet')}
        />
      </div>
      <IdleLock />
      {locked ? <LockScreen session={session} /> : null}
    </>
  );
}
