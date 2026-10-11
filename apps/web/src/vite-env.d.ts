/// <reference types="vite/client" />

/** True when the mock API (MSW) is switched on. Set at build time in vite.config.ts. */
declare const __MOCKS__: boolean;

interface ImportMetaEnv {
  readonly VITE_MOCKS?: 'on' | 'off';
  readonly VITE_DEMO_CLOCK?: 'on' | 'off';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
