import { useQuery } from '@tanstack/react-query';
import { useAction } from '@/lib/use-action';
import * as calls from './calls';
import { counterKeys as keys } from './keys';

// Reads. Live events refresh them (see live.tsx); timers do not need events.

export const usePublicWorkers = () =>
  useQuery({ queryKey: keys.workers, queryFn: calls.getPublicWorkers });

/** The sign-in page's line about the sheet and the tables. Needs no session. */
export const useClubStatus = () =>
  useQuery({ queryKey: keys.clubStatus, queryFn: calls.getClubStatus });

/** Who is signed in. A 401 means nobody is, or the worker's time is over. */
export const useMe = () => useQuery({ queryKey: keys.me, queryFn: calls.getMe, retry: false });

export const useAlerts = () => useQuery({ queryKey: keys.alerts, queryFn: calls.getAlerts });

export const useBoard = (category?: string) =>
  useQuery({ queryKey: keys.board(category), queryFn: () => calls.getBoard(category) });

export const useGame = (id: string, enabled = true) =>
  useQuery({ queryKey: keys.game(id), queryFn: () => calls.getGame(id), enabled });

/** Who played here lately, for the "Played here recently" chips (screen 8). */
export const useRecentPlayers = () =>
  useQuery({ queryKey: keys.recent, queryFn: calls.recentPlayers });

export const usePlayers = (q?: string) =>
  useQuery({ queryKey: keys.players(q), queryFn: () => calls.searchPlayers(q) });

export const useStatement = (id: string) =>
  useQuery({ queryKey: keys.statement(id), queryFn: () => calls.getStatement(id) });

export const useCheckoutList = () =>
  useQuery({ queryKey: keys.checkout(), queryFn: calls.getCheckoutList });

export const useCheckoutBill = (playerId: string) =>
  useQuery({
    queryKey: keys.checkoutBill(playerId),
    queryFn: () => calls.getCheckoutBill(playerId),
  });

export const useCanteenItems = () =>
  useQuery({ queryKey: keys.canteen, queryFn: calls.getCanteenItems });

export const useToday = () => useQuery({ queryKey: keys.today, queryFn: calls.getToday });

export const useClosePreview = () =>
  useQuery({ queryKey: keys.closePreview, queryFn: calls.getClosePreview });

// Writes. Each one is a mutation; its `error` is an `ApiError` with `{code, message}`.

export const useReadAllAlerts = () => useAction(calls.readAllAlerts, [['alerts'], ['board']]);

export const useSignIn = () => useAction(calls.signIn);
export const useUnlock = () => useAction(calls.unlock);
export const useSignOut = () => useAction(calls.signOut);

export const useStartGame = () => useAction(calls.startGame);
export const useChangeGameType = () =>
  useAction((v: { id: string; request: Parameters<typeof calls.changeGameType>[1] }) =>
    calls.changeGameType(v.id, v.request),
  );
export const usePauseGame = () => useAction(calls.pauseGame);
export const useResumeGame = () => useAction(calls.resumeGame);
export const usePauseAll = () => useAction(calls.pauseAll);
export const useResumeAll = () => useAction(calls.resumeAll);
export const useMoveGame = () =>
  useAction((v: { id: string; request: Parameters<typeof calls.moveGame>[1] }) =>
    calls.moveGame(v.id, v.request),
  );
export const useReplacePlayer = () =>
  useAction((v: { id: string; request: Parameters<typeof calls.replacePlayer>[1] }) =>
    calls.replacePlayer(v.id, v.request),
  );
export const useDiscardGame = () =>
  useAction((v: { id: string; request: Parameters<typeof calls.discardGame>[1] }) =>
    calls.discardGame(v.id, v.request),
  );
export const useDisputeGame = () =>
  useAction((v: { id: string; request: Parameters<typeof calls.disputeGame>[1] }) =>
    calls.disputeGame(v.id, v.request),
  );
export const useCancelGame = () =>
  useAction((v: { id: string; request: Parameters<typeof calls.cancelGame>[1] }) =>
    calls.cancelGame(v.id, v.request),
  );
export const useUndoGame = () => useAction(calls.undoGame);
export const useUndoEnd = () => useAction(calls.undoEnd);
export const useDamageCharge = () =>
  useAction((v: { id: string; request: Parameters<typeof calls.damageCharge>[1] }) =>
    calls.damageCharge(v.id, v.request),
  );
export const useEndGame = () =>
  useAction((v: { id: string; request: Parameters<typeof calls.endGame>[1] }) =>
    calls.endGame(v.id, v.request),
  );
export const useNextFrame = () => useAction(calls.nextFrame);
export const useEndCentury = () => useAction(calls.endCentury);
export const useStartRoom = () =>
  useAction((v: { tableId: string; request: Parameters<typeof calls.startRoom>[1] }) =>
    calls.startRoom(v.tableId, v.request),
  );
export const useEndRoom = () => useAction(calls.endRoom);

export const useMarkOutOfOrder = () =>
  useAction((v: { tableId: string; request: Parameters<typeof calls.markOutOfOrder>[1] }) =>
    calls.markOutOfOrder(v.tableId, v.request),
  );
export const useBackInOrder = () =>
  useAction((v: { tableId: string; request: Parameters<typeof calls.backInOrder>[1] }) =>
    calls.backInOrder(v.tableId, v.request),
  );
export const useCreatePlayer = () => useAction(calls.createPlayer, [['players']]);
export const usePayCheckout = () =>
  useAction((v: { playerId: string; request: Parameters<typeof calls.payCheckout>[1] }) =>
    calls.payCheckout(v.playerId, v.request),
  );
export const useSellCanteen = () => useAction(calls.sellCanteen);
export const useAddDrawerExpense = () => useAction(calls.addDrawerExpense);
export const useCloseSheet = () => useAction(calls.closeSheet);
