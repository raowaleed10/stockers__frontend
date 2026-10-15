import { isSlotEndingSoon, isWithinSlot, type WorkerSession } from '@stockers/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { counterKeys } from '../api/keys';
import { RichText } from './RichText';

/** How often the app asks the server again once the worker's time looks over. */
const RECHECK_MS = 2000;

/**
 * The end of a worker's sign-in time (docs/08 §3, D51). From 10 minutes before the end a banner runs across
 * the top. When the time is over by the clock, the app asks the server who is signed in: the server decides
 * with its own clock (a device clock is never trusted), and its answer 401 `SESSION_ENDED` is what sends the
 * worker to the sign-in page. Games keep running; nothing here touches them.
 *
 * It has its own `useNow`, so only this block redraws each second, not the board under it.
 */
export function SessionTiming({ session }: { session: WorkerSession }) {
  const now = useNow();
  const { clock } = useFormat();
  const queryClient = useQueryClient();
  const ended = !isWithinSlot(now, session.worker.slot);

  useEffect(() => {
    if (!ended) return;
    const check = () => void queryClient.invalidateQueries({ queryKey: counterKeys.me });
    check();
    const id = setInterval(check, RECHECK_MS);
    return () => clearInterval(id);
  }, [ended, queryClient]);

  if (ended || !isSlotEndingSoon(now, session.worker.slot)) return null;

  return (
    <div
      role="status"
      className="border-b border-c-warn-line bg-c-warn-bg px-6 py-3 text-[18px] font-semibold text-c-warn-ink"
    >
      <RichText ns="frame" i18nKey="banner" values={{ time: clock(session.until) }} />
    </div>
  );
}
