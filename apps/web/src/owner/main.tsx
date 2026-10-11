import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/lib/fonts';
import '@/styles/tokens.css';
import '@/styles/base.css';
import { clock } from '@/lib/clock';
import { registerResources } from '@/lib/i18n';
import { initLanguage } from '@/lib/language';
import { App } from './app';
import { ownerResources } from './locales';

async function boot() {
  clock.init({ app: 'owner' });
  registerResources(ownerResources);
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
