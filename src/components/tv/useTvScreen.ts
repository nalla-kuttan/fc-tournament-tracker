'use client';

import { useEffect, useState } from 'react';

const IDLE_MS = 3000;

// Keeps a TV, laptop or tablet from dimming or sleeping while TV mode is
// open, and hides the mouse cursor once it stops moving. Returns whether the
// cursor should be hidden.
export function useTvScreen() {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    type Sentinel = { release: () => Promise<void>; released?: boolean };
    const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (!wakeLock) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
      try {
        const next = await wakeLock.request('screen');
        if (cancelled) void next.release();
        else sentinel = next;
      } catch {
        // Battery saver or an unsupported browser: the screen may still sleep.
      }
    };
    // The browser drops the lock whenever the tab is hidden.
    const onVisible = () => { void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    let timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    window.addEventListener('pointermove', wake);
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  return idle;
}
