'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import WifiOffIcon from '@mui/icons-material/WifiOff';

export default function PwaManager() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateNetworkState = () => setOnline(navigator.onLine);
    updateNetworkState();
    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);

    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
          console.warn('Service worker registration failed', error);
        });
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }
    }

    return () => {
      window.removeEventListener('online', updateNetworkState);
      window.removeEventListener('offline', updateNetworkState);
    };
  }, []);

  if (online) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'fixed',
        left: '50%',
        bottom: { xs: 88, md: 20 },
        zIndex: 1400,
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.75,
        py: 1,
        borderRadius: 999,
        bgcolor: '#172033',
        color: '#F8FAFC',
        border: '1px solid rgba(248, 250, 252, 0.16)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.28)',
        fontSize: '0.8125rem',
        fontWeight: 700,
      }}
    >
      <WifiOffIcon sx={{ fontSize: 18 }} />
      Offline — live results are unavailable
    </Box>
  );
}
