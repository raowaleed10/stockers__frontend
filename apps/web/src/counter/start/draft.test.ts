import { beforeEach, describe, expect, it } from 'vitest';
import { pickedIds, slotCount, useStartDraft, type PickedPlayer } from './draft';

const person = (id: string): PickedPlayer => ({ id, name: id.toUpperCase() });
const draft = () => useStartDraft.getState();

beforeEach(() => draft().reset());

describe('the draft of the game being started', () => {
  it('a frame takes two players and a Century one', () => {
    expect(slotCount('single')).toBe(2);
    expect(slotCount('double')).toBe(2);
    expect(slotCount('century')).toBe(1);
  });

  it('fills the slots in order, and takes nobody twice or a third', () => {
    draft().begin('t2');
    draft().pick(person('a'));
    draft().pick(person('a'));
    draft().pick(person('b'));
    draft().pick(person('c'));
    expect(draft().players.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('a Century stops at one player', () => {
    draft().begin('t2');
    draft().setKind('century');
    draft().pick(person('a'));
    draft().pick(person('b'));
    expect(draft().players.map((p) => p.id)).toEqual(['a']);
  });

  it('removing a player makes his slot free for the next pick', () => {
    draft().begin('t2');
    draft().pick(person('a'));
    draft().pick(person('b'));
    draft().remove('a');
    draft().pick(person('c'));
    expect(draft().players.map((p) => p.id)).toEqual(['b', 'c']);
  });

  it('a double fills the active side, then hands over to the other side when it is full', () => {
    draft().begin('t2');
    draft().setKind('double');
    draft().pick(person('a'));
    draft().pick(person('b'));
    // Side A is full: the next player is on side B, which is now the active one.
    expect(draft().side).toBe(1);
    draft().pick(person('c'));
    expect(draft().sides.map((side) => side.map((p) => p.id))).toEqual([['a', 'b'], ['c']]);
    expect(draft().side).toBe(1);
    draft().pick(person('d'));
    draft().pick(person('e'));
    expect(pickedIds(draft())).toEqual(['a', 'b', 'c', 'd']);
  });

  it('a side that was chosen takes the next player, even when the other is empty', () => {
    draft().begin('t2');
    draft().setKind('double');
    draft().setSide(1);
    draft().pick(person('a'));
    expect(draft().sides.map((side) => side.map((p) => p.id))).toEqual([[], ['a']]);
  });

  it('begin keeps the draft for the same table and starts a clean one for another', () => {
    draft().begin('t2');
    draft().setKind('century');
    draft().setRate(20);
    draft().pick(person('a'));
    draft().begin('t2');
    expect(draft().players).toHaveLength(1);
    expect(draft().rate).toBe(20);
    draft().begin('t4');
    expect(draft().players).toEqual([]);
    expect(draft().kind).toBe('single');
    expect(draft().rate).toBeNull();
  });

  it('load fills everything at once, and reset empties it', () => {
    draft().load({
      tableId: 't2',
      kind: 'double',
      rate: null,
      players: [],
      sides: [[person('a')], [person('b')]],
    });
    expect(pickedIds(draft())).toEqual(['a', 'b']);
    expect(draft().side).toBe(0);
    draft().reset();
    expect(draft().tableId).toBeNull();
    expect(pickedIds(draft())).toEqual([]);
  });
});
