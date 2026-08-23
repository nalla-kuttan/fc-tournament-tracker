'use client';

import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { SWRConfig, useSWRConfig } from 'swr';
import {
  createBatchedAnalyticsRevalidator,
  isAnalyticsDataKey,
  subscribeToAnalyticsChanges,
} from '@/lib/analytics-realtime';
import { FetchError, fetcher } from '@/lib/fetcher';
import { createClient } from '@/lib/supabase/client';

function AnalyticsRealtimeSync() {
  const { mutate } = useSWRConfig();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const revalidator = createBatchedAnalyticsRevalidator(() => {
      void mutate(isAnalyticsDataKey);
    });
    const unsubscribe = subscribeToAnalyticsChanges(supabase, revalidator.schedule);

    return () => {
      revalidator.dispose();
      unsubscribe();
    };
  }, [mutate, supabase]);

  return null;
}

function DataErrorNotice({ message, onClose }: { message: string; onClose: () => void }) {
  const { mutate } = useSWRConfig();

  const retry = () => {
    onClose();
    void mutate(() => true);
  };

  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={10_000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: { xs: '72px !important', lg: '24px !important' }, px: 1.5 }}
    >
      <Alert
        severity="error"
        variant="filled"
        onClose={onClose}
        action={
          <Button color="inherit" size="small" onClick={retry} sx={{ minHeight: 40, px: 1.25 }}>
            Retry
          </Button>
        }
        sx={{ width: 'min(560px, calc(100vw - 24px))', '& .MuiAlert-action': { alignItems: 'center' } }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

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
      <AnalyticsRealtimeSync />
      {children}
      <DataErrorNotice message={message} onClose={() => setMessage('')} />
    </SWRConfig>
  );
}
