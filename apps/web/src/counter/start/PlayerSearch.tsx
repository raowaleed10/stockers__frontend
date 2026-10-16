import { rankPlayerResults, type BoardTable } from '@stockers/shared';
import { Plus, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/ui/cx';
import { PersonCard } from '@/ui/PersonCard';
import { focusWithinRing } from '@/ui/theme';
import { useBoard, usePlayers } from '../api';
import type { PickedPlayer } from './draft';
import { toPicked, usePlayerNote } from './player-parts';

/** Where each player is playing now, from the board: the table or room, and its place in the board's order. */
function useBusyPlayers() {
  const board = useBoard('all');
  return useMemo(() => {
    const busy = new Map<string, { table: BoardTable; order: number }>();
    board.data?.tables.forEach((table, order) => {
      const game = table.game;
      if (!game) return;
      const ids = [
        ...(game.playerIds ?? []),
        ...(game.sides?.flat() ?? []),
        ...(game.underPlayerId ? [game.underPlayerId] : []),
      ];
      ids.forEach((id) => busy.set(id, { table, order }));
    });
    return busy;
  }, [board.data]);
}

export interface PlayerSearchProps {
  /** The screen reader name of the box. */
  label: string;
  placeholder?: string;
  query: string;
  onQuery: (query: string) => void;
  /** Players already picked: they are not offered again. */
  exclude: readonly string[];
  onPick: (player: PickedPlayer) => void;
  /** "Add Ali as a new player": gets the name that was typed. */
  onAddNew: (name: string) => void;
  /** How many results show before the list scrolls (screen 8 draws 4). */
  rows?: number;
  /** Screen 8 (22 px, with "4 found") or screen 9 (21 px, none). */
  variant?: 'full' | 'compact';
  className?: string;
}

const ROW = 68;
const GAP = 8;

/**
 * The search box, its results and the "Add a new player" row (screens 8 and 9, and the same pattern later on screen
 * 13). A result is a player with his masked phone number (D21) and one plain line: where he is playing, what he owes
 * or when he last played; never a warning. The results are in the order of `rankPlayerResults`.
 */
export function PlayerSearch({
  label,
  placeholder,
  query,
  onQuery,
  exclude,
  onPick,
  onAddNew,
  rows = 4,
  variant = 'full',
  className,
}: PlayerSearchProps) {
  const { t } = useTranslation('start');
  const typed = query.trim();
  const found = usePlayers(typed || undefined);
  const busy = useBusyPlayers();
  const noteOf = usePlayerNote();

  const results = useMemo(() => {
    const order = new Map([...busy].map(([id, entry]) => [id, entry.order]));
    const free = (found.data ?? []).filter((p) => !exclude.includes(p.id));
    return rankPlayerResults(free, typed, order);
  }, [found.data, busy, exclude, typed]);

  const full = variant === 'full';
  return (
    <div className={cx('flex flex-col gap-3.5', className)}>
      <div
        className={cx(
          'flex min-h-[64px] items-center gap-3 rounded-[16px] border-2 border-c-line-2 bg-c-page px-[18px] focus-within:border-c-brass',
          focusWithinRing.counter,
        )}
      >
        <Search aria-hidden="true" size={24} strokeWidth={2} className="shrink-0 text-c-text-2" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          aria-label={label}
          placeholder={placeholder ?? label}
          autoComplete="off"
          enterKeyHint="search"
          className={cx(
            'min-w-0 flex-1 bg-transparent text-c-text outline-none placeholder:text-c-text-2',
            full ? 'text-[22px]' : 'text-[21px]',
          )}
        />
        {full && typed ? (
          <span role="status" className="shrink-0 text-[15px] text-c-text-2">
            {t('players.found', { count: results.length })}
          </span>
        ) : null}
      </div>

      {typed ? (
        <div className="flex flex-col gap-2">
          {results.length > 0 ? (
            <ul
              aria-label={t('players.results')}
              className="m-0 flex list-none flex-col gap-2 overflow-y-auto p-0"
              style={{ maxHeight: rows * ROW + (rows - 1) * GAP }}
            >
              {results.map((player) => {
                const entry = busy.get(player.id);
                return (
                  <li key={player.id} className="flex">
                    <PersonCard
                      className="w-full"
                      name={player.name}
                      phoneTail={player.phone ?? ''}
                      status={noteOf(player, entry?.table)}
                      onClick={() => onPick(toPicked(player))}
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}
          <button
            type="button"
            onClick={() => onAddNew(typed)}
            className="flex min-h-[68px] items-center gap-3 rounded-[14px] border-2 border-dashed border-c-line-3 bg-transparent px-[18px] text-start text-[19px] font-bold text-c-brass transition-colors duration-150 active:bg-c-raised focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-text"
          >
            <Plus aria-hidden="true" size={22} strokeWidth={2.4} className="shrink-0" />
            <span className="min-w-0">{t('players.addNew', { name: typed })}</span>
          </button>
        </div>
      ) : full ? (
        // Nothing typed yet: the same space, empty, so the dialog does not change height when the first letter is typed.
        <div aria-hidden="true" style={{ minHeight: rows * ROW + (rows - 1) * GAP + GAP + ROW }} />
      ) : null}
    </div>
  );
}
