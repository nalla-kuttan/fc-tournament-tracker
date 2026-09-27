'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const FLASH_KEY = 'fc:result-flash';

// Carries a one-line confirmation across the navigation that follows a save.
export function setResultFlash(message: string) {
  try {
    sessionStorage.setItem(FLASH_KEY, message);
  } catch {
    // Storage can be unavailable (private mode); the save itself already succeeded.
  }
}

function takeResultFlash() {
  try {
    const message = sessionStorage.getItem(FLASH_KEY);
    if (message) sessionStorage.removeItem(FLASH_KEY);
    return message;
  } catch {
    return null;
  }
}

export default function SavedResultNotice() {
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const flash = takeResultFlash();
    // Reading browser storage has to happen after mount, so this state update is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (flash) setMessage(flash);
  }, [pathname]);

  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={5_000}
      onClose={() => setMessage(null)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: { xs: '72px !important', lg: '24px !important' }, px: 1.5 }}
    >
      <Alert severity="success" variant="filled" onClose={() => setMessage(null)} sx={{ width: 'min(560px, calc(100vw - 24px))' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
