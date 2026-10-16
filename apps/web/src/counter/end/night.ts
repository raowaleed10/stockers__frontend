import {
  formatRs,
  type BoardResponse,
  type PlayerTonight,
  type PlayerWithTail,
} from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/lib/use-format';
import type { PersonStatus } from '@/ui/PersonCard';
import { partWords } from '../components/bill-words';

/**
 * The two lines at the foot of a player's card on "Who lost this frame?" (screen 17): what he did tonight ("Won 2 frames
 * tonight", "Lost 2 frames, 2 teas tonight") and what he owes ("Owes nothing", "Rs 600 waiting"). It reads the bill
 * from the board, the frames won from the game, and what he owed from before from his player record.
 */
export function useNightCard(
  board: BoardResponse,
  tonight: Record<string, PlayerTonight> | undefined,
  players: readonly PlayerWithTail[] | undefined,
) {
  const { t } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();

  return (playerId: string): { note: string; status: PersonStatus } => {
    const bill = board.waiting.find((row) => row.playerId === playerId);
    const won = tonight?.[playerId]?.won ?? 0;

    const lostWords = (bill?.parts ?? [])
      .map((part) =>
        part.kind === 'frame'
          ? t('parts.frame', { count: part.count })
          : part.kind === 'game'
            ? t('parts.game', { count: part.count })
            : partWords(part, tBoard, lang),
      )
      .join(t('comma'));
    const wonText = won > 0 ? t('who.won', { count: won }) : '';
    const lostText = lostWords ? t('who.lost', { what: lostWords }) : '';

    const note =
      wonText && lostText
        ? t('who.both', { won: wonText, lost: lostText })
        : wonText || lostText
          ? t('who.tonight', { text: wonText || lostText })
          : t('who.nothing');

    const balance = players?.find((player) => player.id === playerId)?.balance ?? 0;
    const status: PersonStatus = bill
      ? { text: t('who.waiting', { amount: formatRs(bill.tonight, lang) }), tone: 'warn' }
      : balance > 0
        ? { text: t('who.owesBefore', { amount: formatRs(balance, lang) }), tone: 'warn' }
        : { text: t('who.owesNothing') };
    return { note, status };
  };
}
