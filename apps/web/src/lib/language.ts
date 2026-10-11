import { useEffect } from 'react';
import { create } from 'zustand';
import type { AppId } from './app-id';
import i18n from './i18n';

export type Lang = 'en' | 'ur';
export type Dir = 'ltr' | 'rtl';

interface LanguageState {
  app: AppId;
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

const isLang = (value: unknown): value is Lang => value === 'en' || value === 'ur';
const storageKey = (app: AppId) => `stockers.lang.${app}`;

function readSaved(app: AppId): Lang | null {
  try {
    const saved = window.localStorage.getItem(storageKey(app));
    return isLang(saved) ? saved : null;
  } catch {
    return null; // storage can be blocked; the language still works for this visit
  }
}

function save(app: AppId, lang: Lang): void {
  try {
    window.localStorage.setItem(storageKey(app), lang);
  } catch {
    // ignore, see readSaved
  }
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  app: 'counter',
  lang: 'en',
  setLang: (lang) => set({ lang }),
  toggle: () => set({ lang: get().lang === 'en' ? 'ur' : 'en' }),
}));

/**
 * Picks the starting language: `?lang=` in the address, else what this device saved, else English.
 * Call once per entry, before the first render.
 */
export function initLanguage(app: AppId, search = window.location.search): void {
  const fromUrl = new URLSearchParams(search).get('lang');
  const lang = isLang(fromUrl) ? fromUrl : (readSaved(app) ?? 'en');
  useLanguageStore.setState({ app, lang });
}

/** The current language. Keeps `<html lang dir>`, the i18n language and the saved choice in step. */
export function useLanguage() {
  const { app, lang, setLang, toggle } = useLanguageStore();
  const dir: Dir = lang === 'ur' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    void i18n.changeLanguage(lang);
    save(app, lang);
  }, [app, lang, dir]);

  return { lang, dir, setLang, toggle };
}
