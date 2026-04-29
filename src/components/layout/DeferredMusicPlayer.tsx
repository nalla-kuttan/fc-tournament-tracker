'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MusicPlayer = dynamic(() => import('@/components/layout/MusicPlayer'), {
  ssr: false,
});

export default function DeferredMusicPlayer() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const scheduleIdle = window.requestIdleCallback;
    const idleCallback =
      typeof scheduleIdle === 'function'
        ? scheduleIdle(() => setEnabled(true), { timeout: 2500 })
        : window.setTimeout(() => setEnabled(true), 1200);

    return () => {
      if (typeof scheduleIdle === 'function') {
        window.cancelIdleCallback(idleCallback);
      } else {
        window.clearTimeout(idleCallback);
      }
    };
  }, []);

  return enabled ? <MusicPlayer /> : null;
}
