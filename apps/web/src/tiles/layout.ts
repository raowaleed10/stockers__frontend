/*
  Where the balls, coins, rods and diamonds go on a table. Pure numbers, taken from the approved screens
  (design/html 03 and 05) so the drawings match them. Positions are CSS `left` / `top` values; they are
  physical on purpose: a table is not mirrored in Urdu (docs/04 §10).
*/

/** `calc(68% + 8px)` or `calc(50% - 4.5px)`. */
export function at(percent: number, px = 0): string {
  const rounded = Math.round(Math.abs(px) * 10) / 10;
  if (rounded === 0) return `${percent}%`;
  return `calc(${percent}% ${px < 0 ? '-' : '+'} ${rounded}px)`;
}

export interface BallSpot {
  left: string;
  top: string;
  /** A CSS colour, always a token such as `var(--ball-red)`. */
  colour: string;
  stripe?: boolean;
}

const BALL = 9; // px
const ROW = 9.2; // px between two balls in a rack column
const COLUMN = 8; // px between two rack columns
const MIDDLE = -BALL / 2; // top of a ball that sits on the centre line

/** A triangle of balls: column c has c + 1 balls, centred on the middle line. */
function rackSpot(startPercent: number, column: number, row: number) {
  return {
    left: at(startPercent, column * COLUMN),
    top: at(50, MIDDLE + (row - column / 2) * ROW),
  };
}

/**
 * Snooker: 10 reds in a four-row triangle at 68 %, the pink and black, the blue in the centre, brown, green
 * and yellow on the baulk line, and the cue ball. A room shows only the reds, blue, pink and black.
 */
export function snookerSetup(kind: 'snooker' | 'room'): BallSpot[] {
  const balls: BallSpot[] = [];
  if (kind === 'snooker') {
    balls.push(
      { left: at(21, -BALL / 2), top: at(50, MIDDLE), colour: 'var(--ball-brown)' },
      { left: at(21, -BALL / 2), top: at(50, -26), colour: 'var(--ball-green)' },
      { left: at(21, -BALL / 2), top: at(50, 17), colour: 'var(--ball-yellow)' },
    );
  }
  balls.push(
    { left: at(50, -BALL / 2), top: at(50, MIDDLE), colour: 'var(--ball-blue)' },
    { left: at(68, -15), top: at(50, MIDDLE), colour: 'var(--ball-pink)' },
    { left: at(90, -BALL / 2), top: at(50, MIDDLE), colour: 'var(--ball-black)' },
  );
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row <= column; row++) {
      balls.push({ ...rackSpot(68, column, row), colour: 'var(--ball-red)' });
    }
  }
  if (kind === 'snooker') {
    balls.push({ left: at(13, -BALL / 2), top: at(50, 6), colour: 'var(--ball-cue)' });
  }
  return balls;
}

// Pool: the rack, row by row from the front (solid and striped balls of the same colour).
const POOL_RACK: { colour: string; stripe?: boolean }[] = [
  { colour: 'var(--ball-yellow)' },
  { colour: 'var(--ball-yellow)', stripe: true },
  { colour: 'var(--ball-blue)' },
  { colour: 'var(--ball-blue)', stripe: true },
  { colour: 'var(--ball-black)' },
  { colour: 'var(--ball-pool-red)' },
  { colour: 'var(--ball-pool-red)', stripe: true },
  { colour: 'var(--ball-purple)' },
  { colour: 'var(--ball-purple)', stripe: true },
  { colour: 'var(--ball-orange)' },
  { colour: 'var(--ball-orange)', stripe: true },
  { colour: 'var(--ball-green)' },
  { colour: 'var(--ball-green)', stripe: true },
  { colour: 'var(--ball-maroon)' },
  { colour: 'var(--ball-maroon)', stripe: true },
];

/** Pool: 15 balls in a five-row triangle at 72 %, and the cue ball on the head string at 25 %. */
export function poolSetup(): BallSpot[] {
  const balls: BallSpot[] = [
    { left: at(25, -BALL / 2), top: at(50, MIDDLE), colour: 'var(--ball-cue)' },
  ];
  let index = 0;
  for (let column = 0; column < 5; column++) {
    for (let row = 0; row <= column; row++) {
      balls.push({ ...rackSpot(72, column, row), ...POOL_RACK[index++] });
    }
  }
  return balls;
}

/** The diamond sights on a pool rail: 6 on each long side, 3 on each short side (18 in all). */
export interface Diamond {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
}

export function poolDiamonds(): Diamond[] {
  const along = [12.5, 25, 37.5, 62.5, 75, 87.5];
  const diamonds: Diamond[] = [];
  for (const percent of along) {
    diamonds.push({ top: '4px', left: at(percent, -3) }, { bottom: '4px', left: at(percent, -3) });
  }
  for (const percent of [25, 50, 75]) {
    diamonds.push({ left: '4px', top: at(percent, -3) }, { right: '4px', top: at(percent, -3) });
  }
  return diamonds;
}

export interface CoinSpot {
  left: string;
  top: string;
  kind: 'queen' | 'white' | 'black';
}

const COIN = 10; // px

/** Carrom: the queen, then a ring of 6 coins and a ring of 12, white and black taking turns (19 coins). */
export function carromSetup(): CoinSpot[] {
  const coins: CoinSpot[] = [{ left: at(50, -COIN / 2), top: at(50, -COIN / 2), kind: 'queen' }];
  const ring = (count: number, radius: number, start: number, first: 'white' | 'black') => {
    for (let i = 0; i < count; i++) {
      const angle = ((start + (360 / count) * i) * Math.PI) / 180;
      const second = first === 'white' ? 'black' : 'white';
      coins.push({
        left: at(50, Math.cos(angle) * radius - COIN / 2),
        top: at(50, Math.sin(angle) * radius - COIN / 2),
        kind: i % 2 === 0 ? first : second,
      });
    }
  };
  ring(6, 10.5, 0, 'white');
  ring(12, 21, 15, 'black');
  return coins;
}

export interface FoosRod {
  /** Where the rod stands across the pitch, in percent. */
  x: number;
  team: 'red' | 'blue';
  /** Where each man stands along the rod, in percent. */
  men: number[];
  /** Left offset of the handle, in px, from the same percent of the table's width. */
  handle: number;
  /** Rods take turns sticking out at the top and at the bottom. */
  handleAtTop: boolean;
}

const five = [16.7, 33.3, 50, 66.7, 83.3];

/** Foosball: 8 rods and 22 men (11 a side: 1, 2, 5 and 3 for red; 3, 5, 2 and 1 for blue). */
export const FOOSBALL_RODS: FoosRod[] = [
  { x: 9, team: 'red', men: [50], handle: 7, handleAtTop: true },
  { x: 19, team: 'red', men: [33.3, 66.7], handle: 4.2, handleAtTop: false },
  { x: 31, team: 'blue', men: [25, 50, 75], handle: 0.8, handleAtTop: true },
  { x: 43, team: 'red', men: five, handle: -2.5, handleAtTop: false },
  { x: 57, team: 'blue', men: five, handle: -6.5, handleAtTop: true },
  { x: 69, team: 'red', men: [25, 50, 75], handle: -9.8, handleAtTop: false },
  { x: 81, team: 'blue', men: [33.3, 66.7], handle: -13.2, handleAtTop: true },
  { x: 91, team: 'blue', men: [50], handle: -16, handleAtTop: false },
];
