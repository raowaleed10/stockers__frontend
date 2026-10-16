import { describe, expect, it } from 'vitest';
import { formatWeekday } from './format';
import { lastPlayedWhen, rankPlayerResults, similarPlayers } from './players';

const NIGHT = '2026-10-03T21:46:00+05:00'; // Saturday

const player = (id: string, name: string, nick?: string) => ({
  id,
  name,
  ...(nick ? { nick } : {}),
});

const ALIS = [
  player('hamid', 'Hamid Ali'),
  player('ali-raza', 'Ali Raza'),
  player('rizwan', 'Rizwan Ali'),
  player('ali-hassan', 'Ali Hassan'),
  player('ali-haider', 'Ali Haider'),
  player('ali-akbar', 'Ali Akbar'),
];

describe('rankPlayerResults', () => {
  const busy = new Map([
    ['ali-raza', 0], // Table 1
    ['ali-hassan', 7], // Room 1
    ['hamid', 5], // Table 6
  ]);

  it('puts the names that start with the text first, free players before the ones playing (screen 8)', () => {
    const names = rankPlayerResults(ALIS, 'ali', busy).map((p) => p.name);
    // Akbar and Haider are free; Raza is on Table 1 and Hassan in Room 1; then the names that only contain "ali".
    expect(names).toEqual([
      'Ali Akbar',
      'Ali Haider',
      'Ali Raza',
      'Ali Hassan',
      'Rizwan Ali',
      'Hamid Ali',
    ]);
  });

  it('ignores case and extra spaces, and starts with a nickname too', () => {
    const list = [player('a', 'Zubair Khan', 'Zubi'), player('b', 'Bilal Zubair')];
    expect(rankPlayerResults(list, '  ZUB ').map((p) => p.id)).toEqual(['a', 'b']);
    expect(rankPlayerResults(list, 'zubi').map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('with nothing typed, is alphabetical with the busy players last', () => {
    const list = [player('c', 'Cy'), player('a', 'Al'), player('b', 'Bo')];
    expect(rankPlayerResults(list, '', new Map([['a', 0]])).map((p) => p.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('does not change the list it is given', () => {
    const before = ALIS.map((p) => p.id);
    rankPlayerResults(ALIS, 'ali', busy);
    expect(ALIS.map((p) => p.id)).toEqual(before);
  });
});

describe('lastPlayedWhen', () => {
  it('says today, yesterday, a weekday within six days, and a date after that', () => {
    expect(lastPlayedWhen('2026-10-03T20:10:00+05:00', NIGHT)).toEqual({ kind: 'today' });
    expect(lastPlayedWhen('2026-10-02T23:59:00+05:00', NIGHT)).toEqual({ kind: 'yesterday' });
    expect(lastPlayedWhen('2026-10-01T19:00:00+05:00', NIGHT)).toEqual({
      kind: 'weekday',
      at: '2026-10-01T19:00:00+05:00',
    });
    expect(lastPlayedWhen('2026-09-27T19:00:00+05:00', NIGHT).kind).toBe('weekday'); // 6 days
    expect(lastPlayedWhen('2026-09-26T19:00:00+05:00', NIGHT).kind).toBe('date'); // 7 days
  });

  it('counts club days: 12:05 AM is a new day even a few minutes after 11:55 PM', () => {
    expect(lastPlayedWhen('2026-10-03T23:55:00+05:00', '2026-10-04T00:05:00+05:00')).toEqual({
      kind: 'yesterday',
    });
  });

  it('names the weekday in English and Urdu', () => {
    expect(formatWeekday('2026-10-01T19:00:00+05:00')).toBe('Thursday');
    expect(formatWeekday('2026-10-01T19:00:00+05:00', 'ur')).toBe('جمعرات');
  });
});

describe('similarPlayers', () => {
  const saved = [
    player('shah', 'Ali Shah'),
    player('haider', 'Ali Haider'),
    player('raza', 'Ali Raza'),
    player('bilal', 'Bilal Ahmed'),
    player('shahid', 'Ali Shahid'),
  ];

  it('finds a saved name that the typed name starts with, or that starts with it', () => {
    // "Ali Shahid" is two letters away, "Ali Shah" three, so the closer one comes first.
    expect(similarPlayers(saved, 'Ali Shahzad').map((p) => p.id)).toEqual(['shahid', 'shah']);
    expect(similarPlayers(saved, 'ali ra').map((p) => p.id)).toEqual(['raza']);
  });

  it('finds a name that is only a letter or two away', () => {
    expect(similarPlayers(saved, 'Bilaal Ahmed').map((p) => p.id)).toEqual(['bilal']);
  });

  it('suggests nothing for fewer than three letters, and never an unrelated name', () => {
    expect(similarPlayers(saved, 'al')).toEqual([]);
    expect(similarPlayers(saved, '')).toEqual([]);
    expect(similarPlayers(saved, 'Kamran Iqbal')).toEqual([]);
  });

  it('puts the closest first and stops at the limit', () => {
    const many = Array.from({ length: 8 }, (_, i) => player(`p${i}`, `Ali Khan ${i}`));
    expect(similarPlayers(many, 'Ali Khan', 3)).toHaveLength(3);
    expect(
      similarPlayers([player('x', 'Ali Khan'), player('y', 'Ali Khan Junior')], 'ali khan')[0].id,
    ).toBe('x');
  });
});
