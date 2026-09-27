'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import { useAdmin } from '@/contexts/AdminContext';
import { userFacingError } from '@/lib/user-error';

const FLASH_KEY = 'fc:result-flash';
const FLASH_EVENT = 'fc:result-flash';
export const MATCH_RESTORED_EVENT = 'fc:match-restored';

export interface SavedResultPayload {
  home_score: number;
  away_score: number;
  stats: Record<string, unknown>;
  goals: Array<{ player_id: string; minute: number | null }>;
}

export type ResultFlash = {
  message: string;
  // Undo an edit by re-saving the result exactly as it was before.
  undo?: { matchId: string; tournamentId: string; previous: SavedResultPayload; summary: string };
  // A first-time save can't be un-recorded, but it can be reopened and corrected.
  fix?: { href: string };
};

// Carries a one-line confirmation across the navigation that follows a save,
// or straight to the notice when the page doesn't change (edits).
export function setResultFlash(flash: ResultFlash | string) {
  const value: ResultFlash = typeof flash === 'string' ? { message: flash } : flash;
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the save itself already succeeded.
  }
  window.dispatchEvent(new Event(FLASH_EVENT));
}

function takeResultFlash(): ResultFlash | null {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FLASH_KEY);
    const parsed = JSON.parse(raw) as ResultFlash | string;
    return typeof parsed === 'string' ? { message: parsed } : parsed;
  } catch {
    return null;
  }
}

export default function SavedResultNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const { getPinForTournament } = useAdmin();
  const [flash, setFlash] = useState<ResultFlash | null>(null);
  const [severity, setSeverity] = useState<'success' | 'error'>('success');
  const [undoing, setUndoing] = useState(false);

  const show = useCallback(() => {
    const next = takeResultFlash();
    if (!next) return;
    setSeverity('success');
    setFlash(next);
  }, []);

  useEffect(() => {
    // Browser storage is only readable after mount.
    show();
    window.addEventListener(FLASH_EVENT, show);
    return () => window.removeEventListener(FLASH_EVENT, show);
  }, [pathname, show]);

  const close = () => {
    if (!undoing) setFlash(null);
  };

  const undo = async () => {
    const target = flash?.undo;
    if (!target) return;
    const pin = getPinForTournament(target.tournamentId);
    if (!pin) {
      setSeverity('error');
      setFlash({ message: 'Unlock with the tournament PIN to undo this change.' });
      return;
    }
    setUndoing(true);
    try {
      const response = await fetch(`/api/matches/${target.matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target.previous, advance_bracket: false, pin }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'The previous result could not be restored. Try again.');
      }
      window.dispatchEvent(new CustomEvent(MATCH_RESTORED_EVENT, { detail: { matchId: target.matchId } }));
      router.refresh();
      setSeverity('success');
      setFlash({ message: `Restored · ${target.summary}` });
    } catch (error) {
      setSeverity('error');
      setFlash({ message: userFacingError(error, 'The previous result', 'restored') });
    } finally {
      setUndoing(false);
    }
  };

  const action = flash?.undo ? (
    <Button color="inherit" size="small" onClick={() => void undo()} disabled={undoing} sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'underline' }}>
      {undoing ? <CircularProgress size={16} color="inherit" /> : 'Undo'}
    </Button>
  ) : flash?.fix ? (
    <Button color="inherit" size="small" onClick={() => { const href = flash.fix!.href; setFlash(null); router.push(href); }} sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'underline' }}>
      Fix it
    </Button>
  ) : undefined;

  return (
    <Snackbar
      open={Boolean(flash)}
      // Long enough to notice a mistake and reach the button.
      autoHideDuration={flash?.undo || flash?.fix ? 10_000 : 5_000}
      onClose={(_, reason) => { if (reason !== 'clickaway') close(); }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: { xs: '72px !important', lg: '24px !important' }, px: 1.5 }}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={close}
        action={action && <>{action}</>}
        sx={{ width: 'min(560px, calc(100vw - 24px))', '& .MuiAlert-action': { alignItems: 'center', pt: 0 } }}
      >
        {flash?.message}
      </Alert>
    </Snackbar>
  );
}
