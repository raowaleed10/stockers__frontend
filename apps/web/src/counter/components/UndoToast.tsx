import { canUndo, undoSecondsLeft, type BoardTable } from '@stockers/shared';
import { Check, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNow } from '@/lib/clock';
import { cx } from '@/ui/cx';
import { useBoard, useMe, useUndoGame } from '../api';
import { useLockStore } from '../session/lock-store';
import { RichText } from './RichText';

/** `1:42`: minutes and seconds left, the way screen 14 writes it. */
const clockLeft = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const DONE_FOR_MS = 4000;

/**
 * "Game started on Table 2 for Ahmed Nawaz and Ali Akbar. Undo for 1:42 more" (screen 14): a game started by mistake
 * can be undone with no reason for 2 minutes (D16). It is found from the board, not remembered by the screen that
 * started the game, so it is still there after a reload and on any screen. It is the signed-in worker's own latest
 * game only, and it goes when the 2 minutes are up. After Undo it says "Game undone on Table 2." for a moment.
 */
export function UndoToast() {
  const { t } = useTranslation('table');
  const { t: tBoard } = useTranslation('board');
  const board = useBoard('all');
  const me = useMe();
  const locked = useLockStore((state) => state.locked);
  const undo = useUndoGame();
  const now = useNow(1000);
  const [undone, setUndone] = useState<{ table: string } | null>(null);

  const mine = me.data?.worker.id;
  const tableOf = (table: BoardTable) =>
    tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const candidate = (board.data?.tables ?? [])
    .filter(
      (table) =>
        table.game && table.game.startedBy.id === mine && canUndo(table.game.startedAt, now),
    )
    .sort((a, b) => Date.parse(b.game?.startedAt ?? '') - Date.parse(a.game?.startedAt ?? ''))[0];

  // The "undone" message goes by itself after a few seconds.
  useEffect(() => {
    if (!undone) return;
    const timer = setTimeout(() => setUndone(null), DONE_FOR_MS);
    return () => clearTimeout(timer);
  }, [undone]);

  const visible = !locked && (candidate?.game !== undefined || (undone !== null && !candidate));

  // A dialog on screen leaves room for the toast under it (screen 14 centres the two together).
  useEffect(() => {
    document.body.toggleAttribute('data-undo-toast', visible);
    return () => document.body.removeAttribute('data-undo-toast');
  }, [visible]);

  if (locked) return null;

  const frame = 'fixed inset-x-0 bottom-[75px] z-[60] flex justify-center px-6 pointer-events-none';
  const card =
    'pointer-events-auto flex w-full max-w-[980px] flex-wrap items-center gap-4 rounded-[18px] bg-c-text px-5 py-4 text-c-brass-ink shadow-[0_20px_50px_rgba(0,0,0,0.5)]';

  if (undone && !candidate) {
    return (
      <div className={frame}>
        <div role="status" className={card}>
          <Check aria-hidden="true" size={26} strokeWidth={2.4} className="shrink-0 text-c-felt" />
          <span className="min-w-0 flex-1 text-[19px] font-semibold">
            {t('undo.done', { table: undone.table })}
          </span>
        </div>
      </div>
    );
  }
  if (!candidate?.game) return null;

  const game = candidate.game;
  const names = (
    board.data
      ? [
          ...(game.playerIds ?? []),
          ...(game.sides?.flat() ?? []),
          ...(game.underPlayerId ? [game.underPlayerId] : []),
        ]
      : []
  ).map((id) => board.data?.players[id]?.name ?? id);
  const last = names.at(-1);
  const players =
    names.length <= 1
      ? (last ?? '')
      : `${names.slice(0, -1).join(t('undo.comma'))}${t('undo.and')}${last}`;
  const left = undoSecondsLeft(game.startedAt, now);

  return (
    <div className={frame}>
      <div role="status" className={card}>
        <Check aria-hidden="true" size={26} strokeWidth={2.4} className="shrink-0 text-c-felt" />
        <span className="min-w-0 flex-[1_1_300px] text-[19px] font-semibold">
          <RichText
            ns="table"
            i18nKey="undo.started"
            values={{ table: tableOf(candidate), players }}
          />
        </span>
        <span className="text-[16px] text-c-toast-muted">
          {t('undo.left', { time: clockLeft(left) })}
        </span>
        <button
          type="button"
          disabled={undo.isPending}
          onClick={() =>
            undo.mutate(game.id, { onSuccess: () => setUndone({ table: tableOf(candidate) }) })
          }
          className={cx(
            'flex min-h-touch items-center gap-2.5 rounded-[12px] border-2 border-c-brass-ink bg-transparent px-6 text-[18px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-[var(--ov-k22)] disabled:opacity-40',
            // The ring is dark here: the toast is cream, and the page's ivory ring would not show on it.
            'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-brass-ink',
          )}
        >
          <Undo2 aria-hidden="true" size={20} strokeWidth={2.2} />
          {t('undo.button')}
        </button>
      </div>
    </div>
  );
}
