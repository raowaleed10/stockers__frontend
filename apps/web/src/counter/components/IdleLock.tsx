import { useEffect } from 'react';
import { clock } from '@/lib/clock';
import { idleLockMs } from '../session/idle';
import { useLockStore } from '../session/lock-store';

/** Locks the screen after 5 minutes without a touch or a key. It draws nothing. */
export function IdleLock() {
  const locked = useLockStore((state) => state.locked);
  const lock = useLockStore((state) => state.lock);

  useEffect(() => {
    if (locked) return;
    const limit = idleLockMs();
    let lastTouch = clock.now();
    const touched = () => {
      lastTouch = clock.now();
    };
    // Capture phase, so a tap that something else handles still counts as a touch.
    const events = ['pointerdown', 'keydown'] as const;
    for (const name of events) window.addEventListener(name, touched, true);
    const id = setInterval(() => {
      if (clock.now() - lastTouch >= limit) lock();
    }, 1000);
    return () => {
      clearInterval(id);
      for (const name of events) window.removeEventListener(name, touched, true);
    };
  }, [locked, lock]);

  return null;
}
