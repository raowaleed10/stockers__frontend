import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Rs, Settings, Table, Worker } from './types';

describe('shared types', () => {
  it('treats a table without a price as locked', () => {
    const table: Table = {
      id: 't8',
      categoryId: 'pool',
      kind: 'pool',
      number: '1',
      name: 'Pool 1',
      price: null,
    };
    expectTypeOf(table.price).toEqualTypeOf<Rs | null>();
    expect(table.price).toBeNull();
  });

  it('keeps worker sign-in times as 24 hour strings', () => {
    const worker: Worker = {
      id: 'zain',
      name: 'Zain',
      slot: { start: '14:00', end: '23:00' },
      enabled: true,
      pinSet: true,
    };
    expectTypeOf(worker.slot.start).toEqualTypeOf<string>();
    expect(worker.slot).toEqual({ start: '14:00', end: '23:00' });
  });

  it('fixes the counter rules to the owners numbers', () => {
    expectTypeOf<Settings['rules']['doubleAfterMin']>().toEqualTypeOf<30>();
    expectTypeOf<Settings['rules']['lockAfterMin']>().toEqualTypeOf<5>();
  });
});
