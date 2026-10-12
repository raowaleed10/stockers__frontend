import type { TableKind } from '@stockers/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/lib/i18n';
import { TimerText } from '@/ui/TimerText';
import { GameTile } from './GameTile';
import { FOOSBALL_RODS, at, carromSetup, poolDiamonds, poolSetup, snookerSetup } from './layout';
import { MiniTable } from './MiniTable';
import { STATUS_LOOK } from './status';
import { TileActionButton } from './TileActionButton';
import type { TileProps, TileStatus } from './types';

const KINDS: TableKind[] = ['snooker', 'room', 'pool', 'carrom', 'foosball', 'ludo', 'playstation'];
const STATUSES = Object.keys(STATUS_LOOK) as TileStatus[];

// What the pill says for each status, and the ring class each one gets (docs/04 §5).
const PILL: Record<TileStatus, string> = {
  free: 'Free',
  playing: 'Playing',
  over30: 'Over 30 min',
  paused: 'Paused',
  outOfOrder: 'Out of order',
  noPrice: 'Price not set',
  selected: 'Free',
};
const RING: Record<TileStatus, string> = {
  free: 'tile-ring-free',
  playing: 'tile-ring-play',
  over30: 'tile-ring-over',
  paused: 'tile-ring-pause',
  outOfOrder: 'tile-ring-ooo',
  noPrice: 'tile-ring-none',
  selected: 'tile-ring-sel',
};

function base(status: TileStatus, extra: Partial<TileProps> = {}): TileProps {
  return {
    status,
    number: '4',
    label: ['Table', 'Rs 200 a frame'],
    ariaLabel: `Table 4, ${status}`,
    ...extra,
  };
}

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('every kind of table in every status', () => {
  const cases = KINDS.flatMap((kind) => STATUSES.map((status) => [kind, status] as const));

  it.each(cases)(
    '%s, %s: the pill says the right words and the ring has the right class',
    (kind, status) => {
      const { container } = render(<GameTile kind={kind} {...base(status)} />);
      expect(screen.getByText(PILL[status])).toBeInTheDocument();
      expect(container.querySelectorAll(`.${RING[status]}`)).toHaveLength(1);
      // no other status ring on the tile
      const rings = [...new Set(Object.values(RING))].filter((ring) => ring !== RING[status]);
      for (const ring of rings) expect(container.querySelector(`.${ring}`)).toBeNull();
      expect(container.querySelector('.tile')).toHaveAttribute('data-kind', kind);
    },
  );

  it.each(KINDS)('%s: the tile is named by its aria-label', (kind) => {
    render(<GameTile kind={kind} {...base('free')} ariaLabel={`Test ${kind}, free`} />);
    expect(screen.getByRole('button', { name: `Test ${kind}, free` })).toBeInTheDocument();
  });

  it('lights the cloth when playing and fades it when paused or locked', () => {
    const { container, rerender } = render(<GameTile kind="snooker" {...base('playing')} />);
    expect(container.querySelector('.tile-lit')).not.toBeNull();
    rerender(<GameTile kind="snooker" {...base('paused')} />);
    expect(container.querySelector('.tile-dim')).not.toBeNull();
    rerender(<GameTile kind="snooker" {...base('noPrice')} />);
    expect(container.querySelector('.tile-dim')).not.toBeNull();
    rerender(<GameTile kind="snooker" {...base('free')} />);
    expect(container.querySelector('.tile-lit, .tile-dim')).toBeNull();
  });

  it('covers a snooker table that is out of order with grey stripes, and leaves the others bare', () => {
    const { container, rerender } = render(<GameTile kind="snooker" {...base('outOfOrder')} />);
    expect(container.querySelector('.tile-cover')).not.toBeNull();
    rerender(<GameTile kind="snooker" {...base('playing')} />);
    expect(container.querySelector('.tile-cover')).toBeNull();
    // the ludo board keeps its picture when it is out of order (screen 5)
    rerender(<GameTile kind="ludo" {...base('outOfOrder')} />);
    expect(container.querySelector('.tile-cover')).toBeNull();
  });
});

/** The text of every players line on the page, with the small word between the names included. */
function players(root: HTMLElement) {
  return [...root.querySelectorAll('.tile-pl')].map((line) => line.textContent);
}

function frozenTimer(minutes: number, seconds: number) {
  const start = Date.UTC(2026, 9, 3, 15, 0, 0);
  return (
    <TimerText
      startedAt={new Date(start).toISOString()}
      pausedAt={new Date(start + (minutes * 60 + seconds) * 1000).toISOString()}
    />
  );
}

describe('the red card timer', () => {
  it('is used from 30 minutes on a frame', () => {
    render(<GameTile kind="snooker" {...base('over30', { timer: frozenTimer(34, 10) })} />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('34:10');
    expect(timer.className).toContain('bg-s-card');
  });

  it('is not used at 29:59', () => {
    render(<GameTile kind="snooker" {...base('playing', { timer: frozenTimer(29, 59) })} />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('29:59');
    expect(timer.className).not.toContain('bg-s-card');
  });

  it('shows the small red card in the pill and the wide ring when over 30', () => {
    const { container } = render(<GameTile kind="pool" {...base('over30')} />);
    expect(container.querySelector('.-rotate-12')).not.toBeNull();
    expect(container.querySelector('.tile-ring-over')).not.toBeNull();
  });
});

describe('a table with no price', () => {
  const reason = 'Locked until an owner sets the price';

  it('is disabled, and the reason is its accessible description', () => {
    const onPress = vi.fn();
    render(
      <GameTile
        kind="pool"
        {...base('noPrice', {
          lockReason: reason,
          onPress,
          ariaLabel: 'Pool table 1, price not set',
        })}
      />,
    );
    const tile = screen.getByRole('button', { name: 'Pool table 1, price not set' });
    expect(tile).toBeDisabled();
    expect(tile).toHaveAttribute('aria-disabled', 'true');
    expect(tile).toHaveAccessibleDescription(reason);
    // the reason is on the page as text, not only a faded tile
    expect(screen.getByText(reason)).toBeVisible();
  });

  it('does nothing when pressed', async () => {
    const onPress = vi.fn();
    render(<GameTile kind="pool" {...base('noPrice', { lockReason: reason, onPress })} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is pressable when it has a price', async () => {
    const onPress = vi.fn();
    render(<GameTile kind="pool" {...base('free', { onPress })} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('a tile with its own buttons', () => {
  function Paused({ onPress, onResume }: { onPress: () => void; onResume: () => void }) {
    return (
      <GameTile
        kind="snooker"
        {...base('paused', {
          as: 'div',
          onPress,
          ariaLabel: 'Table 1, paused',
          trailing: <TileActionButton onClick={onResume}>Resume</TileActionButton>,
        })}
      />
    );
  }

  it('is a group, not a button, so there is no button inside a button', () => {
    const { container } = render(<Paused onPress={vi.fn()} onResume={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Table 1, paused' })).toBeInTheDocument();
    expect(container.querySelector('button button')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('presses Resume without pressing the tile', async () => {
    const onPress = vi.fn();
    const onResume = vi.fn();
    render(<Paused onPress={onPress} onResume={onResume} />);
    await userEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('draws Resume 50 px tall inside a 56 px box that moves nothing', () => {
    render(<Paused onPress={vi.fn()} onResume={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Resume' });
    expect(button).toHaveAttribute('data-drawn', '50');
    expect(button.className).toContain('min-h-touch');
    expect(button.className).toContain('-my-[3px]');
    expect(button.querySelector('[data-visible]')?.className).toContain('h-[50px]');
  });
});

describe('the words on a tile', () => {
  it('writes the players, the game, the timer and the amount', () => {
    render(
      <GameTile
        kind="snooker"
        {...base('playing', {
          gameLine: { main: 'Single frame', detail: 'Frame 3, Ali leads 2–0' },
          players: { a: 'Ali Raza', b: 'Bilal Ahmed' },
          timer: frozenTimer(18, 42),
          amount: 250,
        })}
      />,
    );
    expect(screen.getByText('Single frame')).toBeInTheDocument();
    expect(screen.getByText(/Frame 3, Ali leads 2–0/)).toBeInTheDocument();
    expect(players(document.body)).toEqual(['Ali Raza vs Bilal Ahmed']);
    expect(screen.getByRole('timer')).toHaveTextContent('18:42');
    expect(screen.getByText('Rs 250')).toBeInTheDocument();
  });

  it('writes "Under" before the name in English', () => {
    render(
      <GameTile
        kind="room"
        {...base('playing', { players: { a: 'Saad Hussain', under: true } })}
      />,
    );
    expect(players(document.body)).toEqual(['Under Saad Hussain']);
  });

  it('writes a list of names as it is', () => {
    render(
      <GameTile kind="ludo" {...base('playing', { players: { a: 'Saad, Ali, Usman, Zubair' } })} />,
    );
    expect(screen.getByText('Saad, Ali, Usman, Zubair')).toBeInTheDocument();
  });

  it('shows the call to action of a free table, with its hint', () => {
    render(
      <GameTile
        kind="snooker"
        {...base('free', { cta: { title: 'Tap to start a game', hint: 'Double Rs 500.' } })}
      />,
    );
    expect(screen.getByText('Tap to start a game')).toBeInTheDocument();
    expect(screen.getByText('Double Rs 500.')).toBeInTheDocument();
  });

  it('shows the note of a table that is out of order', () => {
    render(
      <GameTile
        kind="snooker"
        {...base('outOfOrder', {
          note: { title: 'Cloth change', detail: 'Marked by Adil at 4:15 PM' },
        })}
      />,
    );
    expect(screen.getByText('Cloth change')).toBeInTheDocument();
    expect(screen.getByText('Marked by Adil at 4:15 PM')).toBeInTheDocument();
  });

  it('uses its own words for the pill when it is given them', () => {
    render(<GameTile kind="snooker" {...base('paused', { pillLabel: 'Power cut' })} />);
    expect(screen.getByText('Power cut')).toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });
});

describe('right to left', () => {
  async function inUrdu(ui: React.ReactElement) {
    const urdu = i18n.cloneInstance({ lng: 'ur' });
    return render(
      <I18nextProvider i18n={urdu}>
        <div dir="rtl" lang="ur">
          {ui}
        </div>
      </I18nextProvider>,
    );
  }

  it('puts the word after the name for "Under" and keeps "vs" between two names', async () => {
    await inUrdu(
      <>
        <GameTile
          kind="room"
          {...base('playing', { ariaLabel: 'a', players: { a: 'سعد حسین', under: true } })}
        />
        <GameTile
          kind="snooker"
          {...base('playing', { ariaLabel: 'b', players: { a: 'علی رضا', b: 'بلال احمد' } })}
        />
      </>,
    );
    expect(players(document.body)).toEqual(['سعد حسین کے نام', 'علی رضا بمقابلہ بلال احمد']);
  });

  it('draws the table the same in both languages: balls and coins stay where they are', async () => {
    const positions = (container: HTMLElement) =>
      [...container.querySelectorAll<HTMLElement>('.tile-ball, .tile-cn')].map(
        (spot) => `${spot.style.left}|${spot.style.top}`,
      );
    const english = render(<GameTile kind="snooker" {...base('free')} />);
    const inEnglish = positions(english.container);
    english.unmount();
    const urdu = await inUrdu(<GameTile kind="snooker" {...base('free')} />);
    expect(positions(urdu.container)).toEqual(inEnglish);
    expect(inEnglish.length).toBeGreaterThan(10);
  });

  it('puts the sofa after the table in the page, so the row turns it to the other side in Urdu', () => {
    const { container } = render(<GameTile kind="room" {...base('free')} />);
    const room = container.querySelector('.tile-room') as HTMLElement;
    expect(room.children[0]).toHaveClass('tile-snk');
    expect(room.children[1]).toHaveClass('tile-sofa');
  });

  it('writes the amount as "250 روپے" in Urdu', async () => {
    await inUrdu(<GameTile kind="snooker" {...base('playing', { amount: 250 })} />);
    expect(document.querySelector('.tile-amt')?.textContent).toBe('250 روپے');
  });
});

describe('where the balls, coins and rods go', () => {
  it('sets up snooker with 10 reds and 7 colours and the cue ball, and a room without the baulk colours', () => {
    const reds = (balls: ReturnType<typeof snookerSetup>) =>
      balls.filter((ball) => ball.colour === 'var(--ball-red)');
    const snooker = snookerSetup('snooker');
    expect(reds(snooker)).toHaveLength(10);
    expect(snooker).toHaveLength(10 + 7); // reds, brown green yellow blue pink black, cue ball
    const room = snookerSetup('room');
    expect(reds(room)).toHaveLength(10);
    expect(room).toHaveLength(13); // reds, blue, pink and black
    expect(room.some((ball) => ball.colour === 'var(--ball-cue)')).toBe(false);
  });

  it('sets up pool with 15 balls, 7 of them striped, and the cue ball', () => {
    const balls = poolSetup();
    expect(balls).toHaveLength(16);
    expect(balls.filter((ball) => ball.stripe)).toHaveLength(7);
    expect(balls.filter((ball) => ball.colour === 'var(--ball-cue)')).toHaveLength(1);
  });

  it('puts 18 diamond sights on a pool table: 6 on each long rail and 3 on each short rail', () => {
    const diamonds = poolDiamonds();
    expect(diamonds).toHaveLength(18);
    expect(diamonds.filter((d) => d.top === '4px' || d.bottom === '4px')).toHaveLength(12);
    expect(diamonds.filter((d) => d.left === '4px' || d.right === '4px')).toHaveLength(6);
  });

  it('sets up carrom with the queen and 18 coins, 9 white and 9 black', () => {
    const coins = carromSetup();
    expect(coins).toHaveLength(19);
    expect(coins.filter((coin) => coin.kind === 'queen')).toHaveLength(1);
    expect(coins.filter((coin) => coin.kind === 'white')).toHaveLength(9);
    expect(coins.filter((coin) => coin.kind === 'black')).toHaveLength(9);
  });

  it('puts 11 men on each side of the foosball table', () => {
    expect(FOOSBALL_RODS).toHaveLength(8);
    for (const team of ['red', 'blue'] as const) {
      const men = FOOSBALL_RODS.filter((rod) => rod.team === team).flatMap((rod) => rod.men);
      expect(men).toHaveLength(11);
    }
    // the handles take turns: 4 at the top and 4 at the bottom
    expect(FOOSBALL_RODS.filter((rod) => rod.handleAtTop)).toHaveLength(4);
  });

  it('writes positions as CSS calc values', () => {
    expect(at(68, 8)).toBe('calc(68% + 8px)');
    expect(at(50, -4.5)).toBe('calc(50% - 4.5px)');
    expect(at(21)).toBe('21%');
  });

  it('draws 15 reds, rods and men into the page', () => {
    const { container } = render(<GameTile kind="foosball" {...base('free')} />);
    expect(container.querySelectorAll('.tile-rod')).toHaveLength(8);
    expect(container.querySelectorAll('.tile-man')).toHaveLength(22);
    expect(container.querySelectorAll('.tile-hd')).toHaveLength(8);
  });
});

describe('MiniTable', () => {
  it('is decoration only: hidden from screen readers, with the number on the cloth', () => {
    const { container } = render(<MiniTable number="7" status="outOfOrder" />);
    const glyph = container.firstElementChild as HTMLElement;
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(within(glyph).getByText('7')).toHaveClass('tile-mini-cover');
    expect(glyph.querySelectorAll('.tile-mini-pk')).toHaveLength(6);
  });

  it.each([
    ['free', 'tile-mini-free'],
    ['playing', 'tile-mini-lit'],
    ['over30', 'tile-mini-lit'],
    ['paused', 'tile-mini-dim'],
    ['outOfOrder', 'tile-mini-cover'],
  ] as const)('%s uses the cloth %s', (status, cloth) => {
    const { container } = render(<MiniTable number="1" status={status} />);
    expect(container.querySelector('.tile-mini-cloth')).toHaveClass(cloth);
  });

  it('gives a room a sofa', () => {
    const { container } = render(<MiniTable number="R1" status="playing" room />);
    expect(container.querySelector('.tile-mini-sofa')).not.toBeNull();
    expect(container.querySelector('.tile-mini-room')).not.toBeNull();
  });
});
