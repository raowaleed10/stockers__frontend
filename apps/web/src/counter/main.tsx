import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/lib/fonts';
import '@/styles/tokens.css';
import '@/styles/base.css';
import { clock } from '@/lib/clock';
import { registerResources } from '@/lib/i18n';
import { initLanguage } from '@/lib/language';
import { App } from './app';
import { counterResources } from './locales';
import { initLock } from './session/lock-store';

async function boot() {
  clock.init({ app: 'counter' });
  registerResources(counterResources);
  initLanguage('counter');
  initLock();

  if (__MOCKS__) {
    const [{ startMocks }, { counterHandlers }] = await Promise.all([
      import('@/mocks/start'),
      import('@/mocks/counter-handlers'),
    ]);
    await startMocks(counterHandlers);
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
