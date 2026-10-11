import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/lib/fonts';
import '@/styles/tokens.css';
import '@/styles/base.css';
import { clock } from '@/lib/clock';
import { initLanguage } from '@/lib/language';
import { App } from './app';

async function boot() {
  clock.init({ app: 'owner' });
  initLanguage('owner');

  if (__MOCKS__) {
    const [{ startMocks }, { ownerHandlers }] = await Promise.all([
      import('@/mocks/start'),
      import('@/mocks/owner-handlers'),
    ]);
    await startMocks(ownerHandlers);
  }

  const container = document.getElementById('root');
  if (!container) throw new Error('Missing #root');
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
