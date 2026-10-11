import { useEffect, useState } from 'react';

/** True while the media query matches. False where the browser cannot tell (tests). */
export function useMediaQuery(query: string): boolean {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [matches, setMatches] = useState(() =>
    supported ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (!supported) return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query, supported]);

  return matches;
}

/** Below Tailwind's `md` (768 px): the owner portal on a phone. */
export const PHONE_QUERY = '(max-width: 767px)';
