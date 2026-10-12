import type { TableKind } from '@stockers/shared';
import type { TileStatus } from '@/tiles';
import type { TileSample } from './sample-types';

/*
  Sample words for the "every tile in every state" part of the gallery. They only fill the tiles so the
  drawings can be checked; they are not product copy. English and the Urdu used on screen 6 come from the
  approved screens. Urdu that no screen shows is listed in docs/URDU_TO_CHECK.md for the owners.
*/

export type GalleryLang = 'en' | 'ur';

export const KINDS: TableKind[] = [
  'snooker',
  'room',
  'pool',
  'carrom',
  'foosball',
  'ludo',
  'playstation',
];

export const STATUSES: TileStatus[] = [
  'free',
  'playing',
  'over30',
  'paused',
  'outOfOrder',
  'noPrice',
  'selected',
];

interface Words {
  number: string;
  label: [string, string];
  /** The price line when the price is not set. */
  noPriceLabel: [string, string];
  game: string;
  players: { a: string; b?: string; under?: boolean };
  cta: { title: string; hint: string };
  note: { title?: string; detail: string };
}

const EN: Record<TableKind, Words> = {
  snooker: {
    number: '2',
    label: ['Table', 'Rs 250 a frame'],
    noPriceLabel: ['Table', 'Rs —'],
    game: 'Single frame',
    players: { a: 'Ali Raza', b: 'Bilal Ahmed' },
    cta: { title: 'Tap to start a game', hint: 'Double Rs 500. Century Rs 15 a minute.' },
    note: { title: 'Cloth change', detail: 'Marked by Adil at 4:15 PM' },
  },
  room: {
    number: 'R1',
    label: ['Room', 'Rs 1,500/hr'],
    noPriceLabel: ['Room', 'Rs —'],
    game: 'Hourly',
    players: { a: 'Ali Hassan', under: true },
    cta: { title: 'Tap to start a room', hint: '1 hour minimum' },
    note: { title: 'Cloth change', detail: 'Marked by Adil at 4:15 PM' },
  },
  pool: {
    number: '1',
    label: ['Pool table', 'Rs 150 a game'],
    noPriceLabel: ['Pool table', 'Rs —'],
    game: 'Single game',
    players: { a: 'Usman Ghani', b: 'Danish Iqbal' },
    cta: { title: 'Tap to start a game', hint: 'The loser pays, like a single frame' },
    note: { title: 'Cloth change', detail: 'Marked by Adil at 4:15 PM' },
  },
  carrom: {
    number: '1',
    label: ['Carrom', 'Rs 50 a game'],
    noPriceLabel: ['Carrom', 'Rs —'],
    game: 'Single game',
    players: { a: 'Junaid', b: 'Shoaib' },
    cta: { title: 'Tap to start', hint: 'The loser pays the game' },
    note: { detail: 'Dice missing' },
  },
  foosball: {
    number: '1',
    label: ['Foosball', 'Rs 50 a game'],
    noPriceLabel: ['Foosball', 'Rs —'],
    game: 'Single game',
    players: { a: 'Rizwan', b: 'Danish' },
    cta: { title: 'Tap to start', hint: 'The loser pays the game' },
    note: { detail: 'Dice missing' },
  },
  ludo: {
    number: '1',
    label: ['Ludo', 'Rs 50 a game'],
    noPriceLabel: ['Ludo', 'Rs —'],
    game: '4 players',
    players: { a: 'Saad, Ali, Usman, Zubair' },
    cta: { title: 'Tap to start', hint: 'The loser pays the game' },
    note: { detail: 'Dice missing' },
  },
  playstation: {
    number: '1',
    label: ['PlayStation', 'Rs 100 a game'],
    noPriceLabel: ['PlayStation', 'Rs —'],
    game: 'FIFA',
    players: { a: 'Kamran', b: 'Faisal' },
    cta: { title: 'Tap to start', hint: 'The loser pays the game' },
    note: { detail: 'Dice missing' },
  },
};

const UR: Record<TableKind, Words> = {
  snooker: {
    number: '2',
    label: ['ٹیبل', 'فریم 250 روپے'],
    noPriceLabel: ['ٹیبل', '— روپے'],
    game: 'سنگل فریم',
    players: { a: 'علی رضا', b: 'بلال احمد' },
    cta: { title: 'گیم شروع کریں', hint: 'ڈبل 500 روپے۔ سنچری 15 روپے فی منٹ۔' },
    note: { title: 'کپڑا تبدیل ہو رہا ہے', detail: 'عادل نے شام 4:15 بجے لگایا' },
  },
  room: {
    number: 'R1',
    label: ['روم', '1,500 روپے/گھنٹہ'],
    noPriceLabel: ['روم', '— روپے'],
    game: 'گھنٹے کے حساب سے',
    players: { a: 'علی حسن', under: true },
    cta: { title: 'روم شروع کریں', hint: 'کم از کم 1 گھنٹہ' },
    note: { title: 'کپڑا تبدیل ہو رہا ہے', detail: 'عادل نے شام 4:15 بجے لگایا' },
  },
  pool: {
    number: '1',
    label: ['پول ٹیبل', 'گیم 150 روپے'],
    noPriceLabel: ['پول ٹیبل', '— روپے'],
    game: 'سنگل گیم',
    players: { a: 'علی رضا', b: 'بلال احمد' },
    cta: { title: 'گیم شروع کریں', hint: 'ہارنے والا گیم کے پیسے دیتا ہے' },
    note: { title: 'کپڑا تبدیل ہو رہا ہے', detail: 'عادل نے شام 4:15 بجے لگایا' },
  },
  carrom: {
    number: '1',
    label: ['کیرم', 'گیم 50 روپے'],
    noPriceLabel: ['کیرم', '— روپے'],
    game: 'سنگل گیم',
    players: { a: 'علی رضا', b: 'بلال احمد' },
    cta: { title: 'گیم شروع کریں', hint: 'ہارنے والا گیم کے پیسے دیتا ہے' },
    note: { detail: 'پانسہ غائب ہے' },
  },
  foosball: {
    number: '1',
    label: ['فوس بال', 'گیم 50 روپے'],
    noPriceLabel: ['فوس بال', '— روپے'],
    game: 'سنگل گیم',
    players: { a: 'علی رضا', b: 'بلال احمد' },
    cta: { title: 'گیم شروع کریں', hint: 'ہارنے والا گیم کے پیسے دیتا ہے' },
    note: { detail: 'پانسہ غائب ہے' },
  },
  ludo: {
    number: '1',
    label: ['لڈو', 'گیم 50 روپے'],
    noPriceLabel: ['لڈو', '— روپے'],
    game: '4 کھلاڑی',
    players: { a: 'کامران، فیصل، عمران، نوید' },
    cta: { title: 'گیم شروع کریں', hint: 'ہارنے والا گیم کے پیسے دیتا ہے' },
    note: { detail: 'پانسہ غائب ہے' },
  },
  playstation: {
    number: '1',
    label: ['پلے اسٹیشن', 'گیم 100 روپے'],
    noPriceLabel: ['پلے اسٹیشن', '— روپے'],
    game: 'سنگل گیم',
    players: { a: 'علی رضا', b: 'بلال احمد' },
    cta: { title: 'گیم شروع کریں', hint: 'ہارنے والا گیم کے پیسے دیتا ہے' },
    note: { detail: 'پانسہ غائب ہے' },
  },
};

const LOCK = {
  en: 'Locked until an owner sets the price',
  ur: 'جب تک مالک قیمت مقرر نہ کرے، بند ہے',
};
const PAUSED = { en: 'paused', ur: 'رکا ہوا' };

const AMOUNT: Record<TableKind, number> = {
  snooker: 250,
  room: 1800,
  pool: 150,
  carrom: 50,
  foosball: 50,
  ludo: 50,
  playstation: 100,
};

/** One tile for a kind of table in a status, in English or Urdu. */
export function matrixSample(lang: GalleryLang, kind: TableKind, status: TileStatus): TileSample {
  const w = (lang === 'en' ? EN : UR)[kind];
  const sample: TileSample = {
    id: `matrix-${lang}-${kind}-${status}`,
    kind,
    status,
    number: w.number,
    label: status === 'noPrice' ? w.noPriceLabel : w.label,
    ariaLabel: `${kind} ${w.number}, ${status}`,
  };
  switch (status) {
    case 'free':
    case 'selected':
      sample.cta = w.cta;
      break;
    case 'playing':
    case 'over30':
    case 'paused':
      sample.gameLine =
        status === 'paused' ? { main: w.game, detail: PAUSED[lang] } : { main: w.game };
      sample.players = w.players;
      sample.timer = status === 'over30' ? '32:40' : kind === 'room' ? '1:12:05' : '11:05';
      sample.amount = AMOUNT[kind];
      break;
    case 'outOfOrder':
      sample.note = w.note;
      break;
    case 'noPrice':
      sample.lockReason = LOCK[lang];
      break;
  }
  return sample;
}
