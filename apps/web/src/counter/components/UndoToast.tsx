import { canUndo, formatRs, undoSecondsLeft, type BoardTable } from '@stockers/shared';
import { Check, Undo2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { useBoard, useMe, useUndoable, useUndoCheckout, useUndoEnd, useUndoGame } from '../api';
import { useLockStore } from '../session/lock-store';
import { useNote } from './note-store';
import { RichText } from './RichText';
import { tablePath } from './table-paths';

/** `1:42`: minutes and seconds left, the way screen 14 writes it. */
const clockLeft = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const DONE_FOR_MS = 4000;
/** A toast is about 84 px with its gap; a dialog leaves this much room under it for each one on screen. */
const ROOM_BASE = 110;
const ROOM_EACH = 84;

type Done = { kind: 'game'; table: string } | { kind: 'payment'; name: string };

/**
 * The cream Undo toast, for the 2 minutes after the signed-in worker did something money can follow (D16, D63):
 *  - "Game started on Table 2 for Ahmed Nawaz and Ali Akbar. Undo for 1:42 more" (screen 14): a game started by mistake;
 *  - "Rs 250 added to Bilal Ahmed’s bill. Undo for 1:12 more": a frame he charged, also after the next frame has started
 *    (Undo opens "Who lost this frame?" again for that frame);
 *  - "Payment saved: Bilal Ahmed paid Rs 1,000. Undo for 1:50 more": a payment he took.
 * They are found from the data, not remembered by the screen that did it, so they are still there after a reload and on
 * any screen. Each is the signed-in worker's own, and goes when the 2 minutes are up. After Undo of a game or a payment
 * it says what happened for a moment.
 */
export function UndoToast() {
  const { t } = useTranslation('table');
  const { t: tBoard } = useTranslation('board');
  const { t: tCheckout } = useTranslation('checkout');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const board = useBoard('all');
  const undoable = useUndoable();
  const me = useMe();
  const locked = useLockStore((state) => state.locked);
  const undoGame = useUndoGame();
  const undoEnd = useUndoEnd();
  const undoPayment = useUndoCheckout();
  const now = useNow(1000);
  const [done, setDone] = useState<Done | null>(null);
  const note = useNote((state) => state.message);
  const clearNote = useNote((state) => state.clear);

  const mine = me.data?.worker.id;
  const tableOf = (table: Pick<BoardTable, 'kind' | 'number'>) =>
    tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const candidate = (board.data?.tables ?? [])
    .filter(
      (table) =>
        table.game && table.game.startedBy.id === mine && canUndo(table.game.startedAt, now),
    )
    .sort((a, b) => Date.parse(b.game?.startedAt ?? '') - Date.parse(a.game?.startedAt ?? ''))[0];

  // Screen 18 has its own Undo button, and the correction is on screen while it is open.
  const onOwnScreen = /\/(next|correct\/[^/]+)(\/|$)/.test(pathname);
  const charge = undoable.data?.charge;
  const chargeTable = charge
    ? board.data?.tables.find((table) => table.id === charge.tableId)
    : undefined;
  const chargeShown =
    charge !== null && charge !== undefined && canUndo(charge.endedAt, now) && !onOwnScreen;
  const payment = undoable.data?.payment;
  const paymentShown = payment !== null && payment !== undefined && canUndo(payment.at, now);

  // The "undone" message goes by itself after a few seconds.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(null), DONE_FOR_MS);
    return () => clearTimeout(timer);
  }, [done]);

  // What a page that closed by itself said (an expense, a canteen sale) goes after a few seconds too.
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(clearNote, DONE_FOR_MS);
    return () => clearTimeout(timer);
  }, [note, clearNote]);

  // After Undo of a game, another game that can still be undone takes the place of the message.
  const doneShown = done !== null && !(done.kind === 'game' && candidate);
  const count =
    (candidate?.game ? 1 : 0) +
    (chargeShown ? 1 : 0) +
    (paymentShown ? 1 : 0) +
    (doneShown ? 1 : 0) +
    (note ? 1 : 0);
  const visible = !locked && count > 0;

  // A dialog on screen leaves room for the toasts under it (screen 14 centres the two together).
  useEffect(() => {
    document.body.toggleAttribute('data-undo-toast', visible);
    document.body.style.setProperty(
      '--undo-room',
      `${ROOM_BASE + ROOM_EACH * Math.max(0, count - 1)}px`,
    );
    return () => {
      document.body.removeAttribute('data-undo-toast');
      document.body.style.removeProperty('--undo-room');
    };
  }, [visible, count]);

  if (locked || count === 0) return null;

  const game = candidate?.game;
  const names = (
    game && board.data
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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[75px] z-[60] flex flex-col items-center gap-3 px-6">
      {note ? (
        <Card>
          <span className="min-w-0 flex-1 text-[19px] font-semibold">{note}</span>
        </Card>
      ) : null}

      {done && doneShown ? (
        <Card>
          <span className="min-w-0 flex-1 text-[19px] font-semibold">
            {done.kind === 'game'
              ? t('undo.done', { table: done.table })
              : tCheckout('undo.done', { name: done.name })}
          </span>
        </Card>
      ) : null}

      {game && candidate ? (
        <Card>
          <span className="min-w-0 flex-[1_1_300px] text-[19px] font-semibold">
            <RichText
              ns="table"
              i18nKey="undo.started"
              values={{ table: tableOf(candidate), players }}
            />
          </span>
          <Left>{t('undo.left', { time: clockLeft(undoSecondsLeft(game.startedAt, now)) })}</Left>
          <UndoButton
            disabled={undoGame.isPending}
            onClick={() =>
              undoGame.mutate(game.id, {
                onSuccess: () => setDone({ kind: 'game', table: tableOf(candidate) }),
              })
            }
          >
            {t('undo.button')}
          </UndoButton>
        </Card>
      ) : null}

      {chargeShown && charge ? (
        <Card>
          <span className="min-w-0 flex-[1_1_300px] text-[19px] font-semibold">
            <RichText
              ns="end"
              i18nKey="next.title"
              values={{ amount: formatRs(charge.amount, lang), name: charge.name }}
            />
            {chargeTable ? (
              <span className="ms-2 text-[16px] font-normal text-c-toast-muted">
                {tableOf(chargeTable)}
              </span>
            ) : null}
          </span>
          <Left>{t('undo.left', { time: clockLeft(undoSecondsLeft(charge.endedAt, now)) })}</Left>
          <UndoButton
            disabled={undoEnd.isPending}
            onClick={() =>
              undoEnd.mutate(charge.gameId, {
                onSuccess: () =>
                  navigate(tablePath(pathname, charge.tableId, `/correct/${charge.gameId}`)),
              })
            }
          >
            {t('undo.button')}
          </UndoButton>
        </Card>
      ) : null}

      {paymentShown && payment ? (
        <Card>
          <span className="min-w-0 flex-[1_1_300px] text-[19px] font-semibold">
            <RichText
              ns="checkout"
              i18nKey={payment.paid > 0 ? 'undo.saved' : 'undo.savedCredit'}
              values={{ name: payment.name, amount: formatRs(payment.paid, lang) }}
            />
            {payment.paid > 0 && payment.toCredit > 0 ? (
              <span className="ms-2 text-[16px] font-normal text-c-toast-muted">
                {tCheckout('undo.credit', { amount: formatRs(payment.toCredit, lang) })}
              </span>
            ) : null}
          </span>
          <Left>{t('undo.left', { time: clockLeft(undoSecondsLeft(payment.at, now)) })}</Left>
          <UndoButton
            disabled={undoPayment.isPending}
            onClick={() =>
              undoPayment.mutate(payment.playerId, {
                onSuccess: () => setDone({ kind: 'payment', name: payment.name }),
              })
            }
          >
            {t('undo.button')}
          </UndoButton>
        </Card>
      ) : null}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-[980px] flex-wrap items-center gap-4 rounded-[18px] bg-c-text px-5 py-4 text-c-brass-ink shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    >
      <Check aria-hidden="true" size={26} strokeWidth={2.4} className="shrink-0 text-c-felt" />
      {children}
    </div>
  );
}

function Left({ children }: { children: ReactNode }) {
  return <span className="text-[16px] text-c-toast-muted">{children}</span>;
}

function UndoButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex min-h-touch items-center gap-2.5 rounded-[12px] border-2 border-c-brass-ink bg-transparent px-6 text-[18px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-[var(--ov-k22)] disabled:opacity-40',
        // The ring is dark here: the toast is cream, and the page's ivory ring would not show on it.
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-brass-ink',
      )}
    >
      <Undo2 aria-hidden="true" size={20} strokeWidth={2.2} />
      {children}
    </button>
  );
}
