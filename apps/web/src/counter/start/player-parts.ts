import {
  formatDate,
  formatRs,
  formatWeekday,
  lastPlayedWhen,
  type BoardTable,
  type PlayerWithTail,
  type TableKind,
} from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import type { PersonStatus } from '@/ui/PersonCard';
import type { PickedPlayer } from './draft';

export const toPicked = (player: PlayerWithTail): PickedPlayer => ({
  id: player.id,
  name: player.name,
  ...(player.phone ? { phone: player.phone } : {}),
  ...(player.phoneTail ? { phoneTail: player.phoneTail } : {}),
});

/** `0302 81`: four digits, a space, then the rest, like the numbers on the statements. */
export const showPhone = (digits: string) =>
  digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits;

/** The line at the end of a result: where he is playing, what he owes, or when he last played (plain information). */
export function usePlayerNote() {
  const { t } = useTranslation('start');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const now = useNow(60_000);
  return (player: PlayerWithTail, table?: BoardTable): PersonStatus | undefined => {
    if (table) {
      const kind: TableKind = table.kind;
      const name = tBoard(`nameOf.${kind}`, { number: table.number.replace(/^R/i, '') });
      return {
        text: t(kind === 'room' ? 'tags.inRoom' : 'tags.playingOn', { name }),
        tone: 'busy',
      };
    }
    if (player.balance > 0) {
      return { text: t('tags.owes', { amount: formatRs(player.balance, lang) }) };
    }
    if (player.lastPlayedAt) {
      const when = lastPlayedWhen(player.lastPlayedAt, now);
      const text =
        when.kind === 'today'
          ? t('tags.lastPlayedToday')
          : when.kind === 'yesterday'
            ? t('tags.lastPlayedYesterday')
            : t('tags.lastPlayedOn', {
                when:
                  when.kind === 'weekday'
                    ? formatWeekday(when.at, lang)
                    : formatDate(when.at, lang),
              });
      return { text };
    }
    return undefined;
  };
}
