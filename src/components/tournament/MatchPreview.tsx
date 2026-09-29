'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import GlassCard from '@/components/shared/GlassCard';
import SectionTitle from '@/components/shared/SectionTitle';
import { fetcher } from '@/lib/fetcher';
import { outcomeOf, type ResultPick } from '@/lib/predictions';
import type { HypeLine } from '@/lib/hype';
import { userFacingError } from '@/lib/user-error';
import type { RegisteredPlayer } from '@/lib/types';

export interface MatchPreviewData {
  homePlayerId: string;
  awayPlayerId: string;
  hype: HypeLine[];
  odds: { home: number; draw: number; away: number } | null;
  h2h: { meetings: number; homeWins: number; draws: number; awayWins: number };
  predictionsAvailable: boolean;
  predictions: Array<{ match_id: string; predictor_id: string; pick: ResultPick; name: string }>;
  modelPick: ResultPick | null;
}

const PREDICTOR_KEY = 'fc-predictor-id';

function readPredictor() {
  try {
    return window.localStorage.getItem(PREDICTOR_KEY) ?? '';
  } catch {
    return '';
  }
}

export function usePreview(matchId: string) {
  return useSWR<MatchPreviewData>(`/api/matches/${matchId}/preview`, fetcher, { revalidateOnFocus: false, onError: () => undefined });
}

interface Props {
  match: { id: string; is_played: boolean; home_score: number | null; away_score: number | null };
  homeName: string;
  awayName: string;
}

// Talking points and the predictions game for one fixture. Before kick-off
// anyone can pick a result; afterwards it shows who called it.
export default function MatchPreview({ match, homeName, awayName }: Props) {
  const { data, mutate, isLoading } = usePreview(match.id);
  const { data: players = [] } = useSWR<RegisteredPlayer[]>('/api/players', fetcher);
  const [predictor, setPredictor] = useState(() => (typeof window === 'undefined' ? '' : readPredictor()));
  const [saving, setSaving] = useState<ResultPick | null>(null);
  const [error, setError] = useState('');

  if (isLoading) return <Skeleton variant="rounded" height={160} sx={{ mb: 3, bgcolor: 'rgba(201, 185, 190, 0.05)' }} />;
  if (!data) return null;

  // Old results nobody predicted don't need an empty panel.
  if (match.is_played && data.predictions.length === 0) return null;
  const outcome = match.is_played ? outcomeOf(match) : null;
  const mine = data.predictions.find((prediction) => prediction.predictor_id === predictor)?.pick ?? null;
  const options: Array<{ pick: ResultPick; label: string }> = [
    { pick: 'home', label: homeName },
    { pick: 'draw', label: 'Draw' },
    { pick: 'away', label: awayName },
  ];

  const choosePredictor = (id: string) => {
    setPredictor(id);
    try {
      window.localStorage.setItem(PREDICTOR_KEY, id);
    } catch {
      // Private mode: they'll pick again next time.
    }
  };

  const save = async (pick: ResultPick) => {
    if (!predictor) {
      setError('Pick who you are first.');
      return;
    }
    setSaving(pick);
    setError('');
    const optimistic = [...data.predictions.filter((p) => p.predictor_id !== predictor), { match_id: match.id, predictor_id: predictor, pick, name: players.find((p) => p.id === predictor)?.name ?? 'You' }];
    try {
      await mutate(async () => {
        const response = await fetch(`/api/matches/${match.id}/predictions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ predictor_id: predictor, pick }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || 'Your pick could not be saved. Try again.');
        }
        return { ...data, predictions: optimistic };
      }, { optimisticData: { ...data, predictions: optimistic }, rollbackOnError: true, revalidate: true });
    } catch (err) {
      setError(userFacingError(err, 'Your pick', 'saved'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {!match.is_played && data.hype.length > 0 && (
        <Box component="ul" aria-label="Talking points" sx={{ listStyle: 'none', m: 0, mb: 2.5, p: 0, display: 'grid', gap: 1 }}>
          {data.hype.map((line) => (
            <Box component="li" key={line.text} sx={{ display: 'flex', gap: 1.25, alignItems: 'baseline' }}>
              <Box aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, transform: 'translateY(-2px)', boxShadow: '0 0 8px currentColor', color: 'primary.main' }} />
              <Typography sx={{ fontWeight: 600 }}>{line.text}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <SectionTitle title={match.is_played ? 'Who called it' : 'Your prediction'} />
      <GlassCard>
        <CardContent>
          {!data.predictionsAvailable ? (
            <Typography color="text.secondary">Predictions switch on once the predictions database update has been applied.</Typography>
          ) : (
            <>
              {!match.is_played && (
                <TextField
                  select
                  size="small"
                  label="I am"
                  value={predictor}
                  onChange={(event) => choosePredictor(event.target.value)}
                  sx={{ minWidth: 180, mb: 2 }}
                >
                  {players.map((player) => <MenuItem key={player.id} value={player.id}>{player.name}</MenuItem>)}
                </TextField>
              )}
              <Box role={match.is_played ? undefined : 'radiogroup'} aria-label="Predict the result" sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
                {options.map((option) => {
                  const pickers = data.predictions.filter((prediction) => prediction.pick === option.pick);
                  const selected = mine === option.pick;
                  const won = outcome === option.pick;
                  return (
                    <ButtonBase
                      key={option.pick}
                      role={match.is_played ? undefined : 'radio'}
                      aria-checked={match.is_played ? undefined : selected}
                      disabled={match.is_played || saving != null}
                      onClick={() => void save(option.pick)}
                      sx={{
                        display: 'grid',
                        gap: 0.5,
                        justifyItems: 'center',
                        p: 1.5,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: selected || won ? 'primary.main' : 'rgba(201, 185, 190, 0.14)',
                        bgcolor: (theme) => (selected || won ? alpha(theme.palette.primary.main, 0.12) : 'rgba(201, 185, 190, 0.03)'),
                        transition: 'border-color 150ms ease, background-color 150ms ease',
                        '&:hover': { borderColor: 'primary.light' },
                        opacity: saving && saving !== option.pick ? 0.6 : 1,
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, maxWidth: '100%' }} noWrap>{option.label}</Typography>
                      {data.odds && <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{Math.round(data.odds[option.pick] * 100)}%</Typography>}
                      <Typography sx={{ fontSize: '0.8125rem', color: pickers.length ? 'text.primary' : 'text.secondary', textAlign: 'center' }}>
                        {pickers.length ? pickers.map((p) => p.name).join(', ') : 'No picks'}
                      </Typography>
                      {data.modelPick === option.pick && <Typography sx={{ fontSize: '0.75rem', color: 'primary.light', fontWeight: 700 }}>Ratings pick</Typography>}
                      {won && <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'primary.main' }}>✓ Result</Typography>}
                    </ButtonBase>
                  );
                })}
              </Box>
              {error && <Typography role="alert" sx={{ color: 'error.main', mt: 1.5 }}>{error}</Typography>}
              {!match.is_played && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mt: 1.5 }}>
                  Picks can change until the result is saved. Right picks score in the tournament&apos;s pundit table.
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </GlassCard>
    </Box>
  );
}
