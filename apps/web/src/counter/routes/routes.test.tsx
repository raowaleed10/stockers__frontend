import { screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import { renderCounter, resetCounterState, startCounterTests, wherePath } from '../test/harness';

const api = createTestApi();
beforeAll(() => startCounterTests(api), 30_000);
afterAll(() => api.server.close());
beforeEach(() => resetCounterState());
afterEach(() => resetCounterState());

describe('counter routes', () => {
  it('shows the live board at / for a signed-in worker', async () => {
    api.load();
    renderCounter('/');
    expect(await screen.findByRole('button', { name: 'Table 1, playing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Waiting to pay' })).toBeInTheDocument();
  });

  it('sends / to the sign-in page when nobody is signed in', async () => {
    api.load({ as: 'none' });
    const view = renderCounter('/');
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
  });

  it('shows the sign-in page at /sign-in without a session', async () => {
    api.load({ as: 'none' });
    renderCounter('/sign-in');
    expect(await screen.findByRole('heading', { name: 'Who is working?' })).toBeInTheDocument();
  });

  it('shows a plain "Page not found" for any other address and never mentions owners', async () => {
    api.load({ as: 'none' });
    const { container } = renderCounter('/anything-else');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(container.textContent?.toLowerCase()).not.toContain('owner');
  });

  it('does not tell a visitor whether an address exists: the owner paths are plain "Page not found"', async () => {
    api.load({ as: 'none' });
    renderCounter('/owner-dev/');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
