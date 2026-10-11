import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routerFuture } from '@/lib/router-future';
import { CounterRoutes } from './index';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={routerFuture}>
      <CounterRoutes />
    </MemoryRouter>,
  );

describe('counter routes', () => {
  it('shows the placeholder at /', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Stockers' })).toBeInTheDocument();
  });

  it('shows a plain "Page not found" for any other address and never mentions owners', () => {
    const { container } = renderAt('/anything-else');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(container.textContent?.toLowerCase()).not.toContain('owner');
  });
});
