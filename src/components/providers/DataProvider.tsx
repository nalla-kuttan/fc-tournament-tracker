'use client';

import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { SWRConfig } from 'swr';
import { FetchError, fetcher } from '@/lib/fetcher';

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const value = useMemo(() => ({
    fetcher,
    onError: (error: unknown) => {
      const fetchError = error instanceof FetchError ? error : null;
      const suffix = fetchError?.requestId ? ` Reference: ${fetchError.requestId.slice(0, 8)}.` : '';
      setMessage(`${fetchError?.message ?? 'Live data could not be loaded.'}${suffix}`);
    },
    onErrorRetry: (error: unknown, _key: string, _config: unknown, revalidate: (options: { retryCount: number }) => void, options: { retryCount: number }) => {
      if (error instanceof FetchError && error.status < 500) return;
      if (options.retryCount >= 2) return;
      window.setTimeout(() => revalidate({ retryCount: options.retryCount + 1 }), 3_000);
    },
  }), []);

  return (
    <SWRConfig value={value}>
      {children}
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={8_000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: '88px !important', lg: '24px !important' } }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setMessage('')}
          sx={{ maxWidth: 560, '& .MuiAlert-action button': { minWidth: 44, minHeight: 44 } }}
        >
          {message}
        </Alert>
      </Snackbar>
    </SWRConfig>
  );
}
