import { screen } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import { readAppBase } from '../app-base';
import { renderOwner, resetOwnerState, startOwnerTests } from '../test/harness';

const api = createTestApi();
beforeAll(() => startOwnerTests(api), 60_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load({ app: 'owner' });
  api.setTime('2026-10-03T22:30:00+05:00');
  resetOwnerState();
});

describe('owner routes', () => {
  it('shows the dashboard page inside the owner frame at /', async () => {
    renderOwner('/');
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Owner menu' })).toBeInTheDocument();
  });

  it('shows a plain "Page not found" for any other address, signed in or not', async () => {
    const signedIn = renderOwner('/anything-else');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Owner menu' })).toBeNull();
    signedIn.unmount();

    api.db.s.auth.session = null;
    renderOwner('/anything-else');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('readAppBase', () => {
  const docWith = (head: string) => new DOMParser().parseFromString(head, 'text/html');

  it('reads the base path from the meta tag and drops the trailing slash', () => {
    const doc = docWith('<meta name="app-base" content="/some-path/">');
    expect(readAppBase(doc)).toBe('/some-path');
  });

  it('keeps "/" as the root', () => {
    expect(readAppBase(docWith('<meta name="app-base" content="/">'))).toBe('/');
  });

  it('returns null when the tag is missing or is not a path', () => {
    expect(readAppBase(docWith(''))).toBeNull();
    expect(readAppBase(docWith('<meta name="app-base" content="somewhere">'))).toBeNull();
  });
});
