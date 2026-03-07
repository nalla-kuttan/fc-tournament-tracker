'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import dayjs from 'dayjs';

interface BigWin {
  match_id: string;
  home_player: string;
  away_player: string;
  home_score: number;
  away_score: number;
  goal_difference: number;
  winner: string;
  tournament_name?: string;
  played_at: string | null;
}

interface Props {
  wins: BigWin[];
  title?: string;
}

export default function BiggestWinsTable({ wins, title = 'Biggest Wins' }: Props) {
  if (wins.length === 0) return null;

  return (
    <GlassCard>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', px: 0.5, mb: 0.5, opacity: 0.6 }}>
          <Typography variant="caption" sx={{ width: 80, flexShrink: 0 }}>Date</Typography>
          <Typography variant="caption" sx={{ flex: 1, textAlign: 'center' }}>Result</Typography>
          {wins[0]?.tournament_name && (
            <Typography variant="caption" sx={{ width: 120, textAlign: 'right', flexShrink: 0 }}>Tournament</Typography>
          )}
        </Box>
        {wins.map((w, i) => (
          <Box
            key={w.match_id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 1.5,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ width: 80, flexShrink: 0 }}>
              {w.played_at ? dayjs(w.played_at).format('MMM D') : '\u2014'}
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                fontWeight={w.home_score > w.away_score ? 700 : 400}
                sx={{ color: w.home_score > w.away_score ? '#34C759' : 'text.primary' }}
                noWrap
              >
                {w.home_player}
              </Typography>
              <Chip
                label={`${w.home_score} - ${w.away_score}`}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  bgcolor: 'rgba(0,212,255,0.12)',
                  color: '#22C55E',
                  minWidth: 56,
                  height: 24,
                }}
              />
              <Typography
                variant="body2"
                fontWeight={w.away_score > w.home_score ? 700 : 400}
                sx={{ color: w.away_score > w.home_score ? '#34C759' : 'text.primary' }}
                noWrap
              >
                {w.away_player}
              </Typography>
            </Box>
            {w.tournament_name && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 120, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {w.tournament_name}
              </Typography>
            )}
          </Box>
        ))}
      </CardContent>
    </GlassCard>
  );
}
