'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SensorsIcon from '@mui/icons-material/Sensors';
import GlassCard from '@/components/shared/GlassCard';
import { useLiveScoreChannel, type LiveScore } from '@/lib/live-score';

const storageKey = (matchId: string) => `fc-live:${matchId}`;

function readStored(matchId: string): LiveScore | null {
  try {
    const raw = window.localStorage.getItem(storageKey(matchId));
    return raw ? (JSON.parse(raw) as LiveScore) : null;
  } catch {
    return null;
  }
}

function store(score: LiveScore | null, matchId: string) {
  try {
    if (score) window.localStorage.setItem(storageKey(matchId), JSON.stringify(score));
    else window.localStorage.removeItem(storageKey(matchId));
  } catch {
    // Private mode: the score just won't survive a reload.
  }
}

interface Props {
  matchId: string;
  tournamentId: string;
  homeName: string;
  awayName: string;
  // Called at full time with the score, to prefill the result form.
  onFullTime: (home: number, away: number) => void;
}

// Keep score on a phone while the match is played; TV mode shows each goal
// as it happens. Full time hands the score to the result form.
export default function LiveScorer({ matchId, tournamentId, homeName, awayName, onFullTime }: Props) {
  const [score, setScore] = useState<LiveScore | null>(() => (typeof window === 'undefined' ? null : readStored(matchId)));
  const { connected, send } = useLiveScoreChannel(tournamentId, { source: () => score });

  // Re-announce a match that was already live when the page reloaded.
  useEffect(() => {
    if (connected && score) send(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the connection comes up
  }, [connected]);

  const update = (next: LiveScore | null) => {
    setScore(next);
    store(next, matchId);
    if (next) send(next);
  };

  const kickOff = () => update({ matchId, home: 0, away: 0, status: 'live', startedAt: Date.now(), lastGoal: null, version: Date.now() });
  const change = (side: 'home' | 'away', delta: number) => {
    if (!score) return;
    const value = Math.max(0, score[side] + delta);
    if (value === score[side]) return;
    update({ ...score, [side]: value, lastGoal: delta > 0 ? side : null, version: Date.now() });
  };
  const fullTime = () => {
    if (!score) return;
    update({ ...score, status: 'ended', lastGoal: null, version: Date.now() });
    onFullTime(score.home, score.away);
  };

  if (!score) {
    return (
      <GlassCard sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontWeight: 700 }}>Keep score live</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Tap each goal as it goes in. TV mode shows it straight away.</Typography>
          </Box>
          <Button variant="contained" startIcon={<SensorsIcon />} onClick={kickOff}>Kick off</Button>
        </CardContent>
      </GlassCard>
    );
  }

  const sides = [
    { side: 'home' as const, name: homeName, value: score.home },
    { side: 'away' as const, name: awayName, value: score.away },
  ];

  return (
    <GlassCard sx={{ mb: 3, borderColor: 'primary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: score.status === 'live' ? 'primary.main' : 'text.secondary', animation: score.status === 'live' ? 'livePulse 1.6s ease-in-out infinite' : 'none', '@keyframes livePulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } } }} />
          <Typography sx={{ fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.8125rem' }}>{score.status === 'live' ? 'LIVE' : 'FULL TIME'}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', ml: 'auto' }}>{connected ? 'TV connected' : 'Connecting…'}</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {sides.map((entry) => (
            <Box key={entry.side} sx={{ display: 'grid', justifyItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 700, maxWidth: '100%' }} noWrap>{entry.name}</Typography>
              <Typography aria-live="polite" sx={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{entry.value}</Typography>
              {score.status === 'live' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton aria-label={`Take a goal off ${entry.name}`} onClick={() => change(entry.side, -1)} disabled={entry.value === 0} sx={{ border: '1px solid rgba(201, 185, 190, 0.2)' }}>
                    <RemoveIcon />
                  </IconButton>
                  <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => change(entry.side, 1)} aria-label={`Goal for ${entry.name}`} sx={{ minWidth: 96 }}>
                    Goal
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2.5, flexWrap: 'wrap' }}>
          {score.status === 'live' ? (
            <>
              <Button onClick={() => update(null)} color="inherit">Cancel</Button>
              <Button variant="contained" onClick={fullTime}>Full time</Button>
            </>
          ) : (
            <>
              <Button onClick={() => update({ ...score, status: 'live', version: Date.now() })} color="inherit">Back to live</Button>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', alignSelf: 'center' }}>The score is in the form below. Add the stats and save.</Typography>
            </>
          )}
        </Box>
      </CardContent>
    </GlassCard>
  );
}
