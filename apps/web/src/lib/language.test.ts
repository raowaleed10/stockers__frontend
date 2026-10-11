import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { initLanguage, useLanguage, useLanguageStore } from './language';

describe('useLanguage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useLanguageStore.setState({ app: 'counter', lang: 'en' });
  });

  it('sets lang and dir on <html> when the language changes', () => {
    const { result } = renderHook(() => useLanguage());
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');

    act(() => result.current.setLang('ur'));
    expect(document.documentElement.lang).toBe('ur');
    expect(document.documentElement.dir).toBe('rtl');

    act(() => result.current.toggle());
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('starts from ?lang=, then from what the device saved, then English', () => {
    initLanguage('counter', '?lang=ur');
    expect(useLanguageStore.getState().lang).toBe('ur');

    window.localStorage.setItem('stockers.lang.counter', 'ur');
    initLanguage('counter', '');
    expect(useLanguageStore.getState().lang).toBe('ur');

    window.localStorage.clear();
    initLanguage('counter', '');
    expect(useLanguageStore.getState().lang).toBe('en');
  });

  it('remembers the choice for this app only', () => {
    renderHook(() => useLanguage());
    act(() => useLanguageStore.getState().setLang('ur'));
    expect(window.localStorage.getItem('stockers.lang.counter')).toBe('ur');
    expect(window.localStorage.getItem('stockers.lang.owner')).toBeNull();
  });
});
